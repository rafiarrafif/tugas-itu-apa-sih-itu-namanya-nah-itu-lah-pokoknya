# Refleksi Pengerjaan Project Backend CRUD dengan Drizzle ORM

## 1. Kendala yang Dihadapi

### Kendala 1: Type Safety End-to-End dengan Drizzle ORM (PALING SUSAH)

Ketika mulai menggunakan Drizzle ORM, saya menghadapi tantangan besar dalam memastikan type safety dari schema database hingga API response. 

**Masalah spesifiknya:**
- Query results dari Drizzle memiliki tipe data yang berbeda-beda tergantung operasi (select, insert, update). Type inference tidak konsisten ketika melakukan transformasi data dari raw database row ke DTO.
- Saat membuat repository layer, raw data dari `db.select()` memiliki type `any` sampai di-cast ke proper interface. Ini membuat mudah terjadi error di runtime ketika field names tidak sesuai antara schema dan DTO.
- Contoh: Di `userRepository.ts`, ketika melakukan insert dengan `.output()`, hasil return type tidak sama dengan hasil `db.select()`. Ini membuat service layer sulit untuk generic handling karena harus membuat multiple type definitions untuk setiap operasi.
- Pagination dengan `.offset()` dan `.fetch()` juga memerlukan type guards untuk memastikan data yang dikembalikan sesuai dengan interface yang diharapkan.
- Error seperti "Cannot read property 'id' of undefined" sering terjadi di production karena type casting yang loose.

### Kendala 2: Audit Middleware Integration dengan Response Interception

Implementasi audit logging yang otomatis menangkap setiap POST/PUT/DELETE request juga memberikan challenge tersendiri.

**Masalahnya:**
- Express middleware standard tidak memiliki hook langsung ke response body yang akan dikirim. Untuk mendapatkan data yang di-return (terutama `targetId`), saya harus override method `res.json()` secara global.
- Ada risiko response duplikasi atau response tidak terkirim jika implementasi interception tidak benar.
- Menentukan `targetTable` dari URL path dengan mapping otomatis juga tricky - harus parse kebab-case ke UPPER_SNAKE_CASE dengan consistent logic.
- Asynchronous audit log creation tanpa blocking response juga harus handled dengan baik - error di audit logging tidak boleh affect HTTP response yang sudah dikirim.

---

## 2. Solusi untuk Mengatasi Kendala

### Solusi 1: Type Safety dengan Strict DTO Pattern

Untuk mengatasi type safety issue dengan Drizzle ORM:

1. **Definisikan strict interface untuk setiap operasi:**
   ```typescript
   // src/dtos/userDto.ts
   export interface UserResponseDto {
     id: number;
     name: string;
     email: string;
     role: 'admin' | 'owner' | 'customer';
     createdAt: Date | null;
   }
   
   export interface UserCreateRequestDto {
     name: string;
     email: string;
     password: string;
     role: 'admin' | 'owner' | 'customer';
   }
   ```

2. **Buat type-safe transformation di service layer:**
   - Service menerima raw data dari repository dengan type assertion
   - Service bertanggung jawab melakukan type transformation dan validation sebelum return ke controller
   - Contoh di `userService.ts`:
   ```typescript
   private toDto(row: UserRow): UserResponseDto {
     return {
       id: row.id,
       name: row.name,
       email: row.email,
       role: row.role as "admin" | "owner" | "customer",
       createdAt: row.createdAt,
     };
   }
   ```

3. **Repository mengembalikan typed data:**
   - Gunakan `type UserRow = Awaited<ReturnType<...>>` untuk extract actual type dari Drizzle queries
   - Ini memastikan repository data selalu konsisten dengan schema definition
   - Sehingga service layer bisa percaya pada type safety

4. **Result:** Type safety terjaga dari database → repository → service → controller → HTTP response. Error akan terdeteksi di compile time, bukan runtime.

### Solusi 2: Response Interceptor dengan Clean Error Handling

Untuk audit middleware yang reliable:

1. **Override res.json() dengan wrapper yang aman:**
   ```typescript
   const originalJson = res.json;
   res.json = function (body: any) {
     // Audit logging logic here
     // Must ensure we call originalJson.call(this, body) at the end
     return originalJson.call(this, body);
   };
   ```

2. **Extract target data dari multiple sources:**
   - Prioritas: `response.data.id` (dari service response)
   - Fallback: `req.params.id` (dari URL route params)
   - Ini handle case dimana response format berbeda-beda antar endpoint

3. **Auto-convert URL path to table name:**
   ```typescript
   const resource = pathSegments[2]; // 'users', 'stalls', 'menu-items'
   targetTable = resource
     .split('-')
     .map((part) => part.toUpperCase())
     .join('_'); // Result: 'MENU_ITEMS'
   ```

4. **Async audit creation tanpa blocking:**
   ```typescript
   auditService.createAuditLog(...).catch((err) => {
     console.error('Audit log creation failed:', err);
   });
   // Response sudah terkirim, audit error tidak akan crash HTTP response
   ```

5. **Result:** Audit logging berjalan seamless tanpa menambah latency ke client, dan error di audit logging tidak mempengaruhi API response.

---

## 3. Pemahaman Konsep & Teknologi

### CRUD (Create, Read, Update, Delete)

**Definisi:** CRUD adalah empat operasi fundamental dalam memanipulasi data di database:

- **Create (POST):** Membuat data baru. Contoh: `POST /users` dengan body `{name, email, password, role}` akan insert row baru ke table USERS. Di project ini, CREATE juga trigger validasi (email unique), encryption (bcrypt password), dan audit logging.

- **Read (GET):** Membaca data existing. Bisa read satu record atau banyak record dengan filtering & pagination. Contoh: `GET /users?search=john&role=customer&page=1&limit=10` akan return users dengan nama mengandung "john" dan role customer, dengan pagination.

- **Update (PUT):** Memodifikasi data existing. Contoh: `PUT /reviews/5` dengan body `{rating: 4, comment: "..."}` akan update row dengan id 5 di table REVIEWS. Update juga trigger audit log untuk compliance tracking.

- **Delete (DELETE):** Menghapus data. Contoh: `DELETE /stalls/3` akan menghapus stall dengan id 3 beserta semua foreign key relations (cascade delete atau soft delete tergantung design).

**Di project ini:** Setiap entity (users, stalls, menu items, reviews, likes, flags, audit logs) memiliki CRUD endpoints yang konsisten. Response format juga standardized: `{ status, meta, data }`.

---

### Layered Backend Architecture

**Definisi:** Arsitektur yang membagi aplikasi menjadi beberapa layer terpisah, masing-masing dengan tanggung jawab specific.

**Layer di project ini:**

1. **Route Layer** (`src/routes/*.ts`)
   - Bertanggung jawab: HTTP endpoint definition, path parameters, query validation basics
   - Contoh: `userRouter.get('/', userController.getUsers)` mendefinisikan endpoint GET /users
   - Benefit: Mudah untuk refactor atau add route baru tanpa touch business logic

2. **Controller Layer** (`src/controllers/*.ts`)
   - Bertanggung jawab: HTTP request/response handling, extract params/body, error handling, status code management
   - Contoh: `UserController.getUsers()` extract query params, panggil service, format response
   - Benefit: Separation antara HTTP protocol handling dan business logic

3. **Service Layer** (`src/services/*.ts`)
   - Bertanggung jawab: Business logic, validation, data transformation, orchestration
   - Contoh: `UserService.createUser()` validate email unique, call repository, transform to DTO
   - Benefit: Bisa di-test tanpa HTTP layer, bisa di-reuse dari berbagai endpoint

4. **Repository Layer** (`src/repositories/*.ts`)
   - Bertanggung jawab: Pure database operations, query building, data access patterns
   - Contoh: `UserRepository.create()` hash password, insert ke database, return inserted row
   - Benefit: Change database tanpa affect service/controller, easy to mock untuk testing

5. **DTO Layer** (`src/dtos/*.ts`)
   - Bertanggung jawab: Type definitions untuk request/response, data shape contracts
   - Benefit: Type safety, documentation untuk API consumer, separation antara internal model dan external contract

**Data Flow:**
```
HTTP Request
    ↓
Route matching → Controller (extract params) → Service (business logic)
    ↓
Repository (query DB) → [MSSQL Database]
    ↓
Repository return raw data → Service transform to DTO → Controller format response
    ↓
HTTP Response
```

**Benefit layered architecture:**
- **Maintainability:** Setiap layer punya single responsibility, mudah untuk modify logic di satu layer tanpa affect layer lain
- **Testability:** Bisa test service tanpa HTTP, test repository tanpa service, etc
- **Reusability:** Service bisa dipanggil dari multiple controllers atau background jobs
- **Scalability:** Mudah untuk add caching di service layer, add validation di controller layer, etc

---

### ORM (Object-Relational Mapping)

**Definisi:** ORM adalah library yang memetakan struktur database (tabel, kolom, relasi) ke object/class dalam code, sehingga developer bisa interact dengan database menggunakan object-oriented programming daripada raw SQL.

**Drizzle ORM (yang digunakan di project):**

Drizzle adalah ORM TypeScript-first dengan focus pada type safety dan minimal abstraction layer.

**Key features Drizzle:**

1. **Schema definition dengan code:**
   ```typescript
   export const users = mssqlTable('USERS', {
     id: int('id').primaryKey().identity(),
     name: nvarchar('name', { length: 100 }).notNull(),
     email: nvarchar('email', { length: 150 }).notNull().unique(),
     passwordHash: nvarchar('password_hash', { length: 255 }).notNull(),
     role: nvarchar('role', { length: 20, enum: ['admin', 'owner', 'customer'] }).notNull(),
     createdAt: datetime2('created_at'),
   });
   ```
   - Type definitions dan database schema sync di satu file
   - Enum types enforced di schema level
   - Column constraints (`notNull`, `unique`, `identity`) defined di code

2. **Query builder dengan type inference:**
   ```typescript
   const rows = await db
     .select()
     .from(users)
     .where(eq(users.email, email))
     .limit(1);
   // TypeScript automatically knows rows is Array<users type>
   ```
   - Tidak perlu manual type casting
   - IDE autocomplete untuk column names
   - Type error akan caught di compile time, bukan runtime

3. **Relational queries:**
   ```typescript
   const stall = await db.query.stalls.findFirst({
     where: eq(stalls.id, stallId),
     with: {
       owner: true, // JOIN dengan users table
       menuItems: true, // JOIN dengan menu items
     },
   });
   // Automatically resolved relationships
   ```

**Benefit ORM dibanding raw SQL:**
- Type safety: TypeScript compile-time checking
- SQL injection prevention: Parameter binding automatic
- Database portability: Change database dengan minimal code change (MSSQL → PostgreSQL)
- Less boilerplate: No need to map SQL result to object manually

**Trade-off:**
- Performance overhead: ORM generated SQL mungkin tidak se-optimal raw SQL di complex queries
- Learning curve: Harus learn Drizzle API, condition builders, etc

---

### Parametrized Query dengan ORM

**Definisi:** Parametrized query (prepared statement) adalah teknik untuk separate SQL query structure dari data, mencegah SQL injection attack.

**Contoh raw SQL (UNSAFE):**
```sql
SELECT * FROM users WHERE email = '$email'
-- Jika $email = "'; DROP TABLE users; --" akan jadi: SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
```

**Contoh parametrized SQL (SAFE):**
```sql
SELECT * FROM users WHERE email = @email
-- Data @email di-pass terpisah, SQL parser tidak execute data sebagai query
```

**Drizzle ORM automatic parametrization:**
```typescript
// Di Drizzle, semua queries otomatis parametrized
const rows = await db
  .select()
  .from(users)
  .where(eq(users.email, email)); // 'email' parameter di-pass separately

// Di backend, Drizzle generate SQL: SELECT * FROM users WHERE email = @p0
// Dan pass value email secara terpisah ke database driver
```

**Benefit:**
- **Security:** Tidak vulnerable terhadap SQL injection
- **Performance:** Database bisa cache prepared statement
- **Maintainability:** Cleaner code, less string concatenation

**Di project ini:** 
- Semua repository queries menggunakan Drizzle conditions (`eq()`, `like()`, `and()`, `or()`) yang otomatis parametrized
- Contoh di `userRepository.findAll()`:
  ```typescript
  if (params.search) conditions.push(like(users.name, `%${params.search}%`));
  if (params.role) conditions.push(eq(users.role, params.role));
  // Drizzle handle parameter binding otomatis
  ```

---

### Filtering

**Definisi:** Filtering adalah kemampuan untuk narrow down hasil query berdasarkan kondisi tertentu.

**Filtering patterns di project:**

1. **Search filtering (text matching):**
   ```typescript
   // Query: GET /users?search=john
   if (params.search) {
     conditions.push(like(users.name, `%${params.search}%`));
   }
   // Result: SELECT * FROM users WHERE name LIKE '%john%'
   ```

2. **Exact match filtering:**
   ```typescript
   // Query: GET /users?role=admin
   if (params.role) {
     conditions.push(eq(users.role, params.role));
   }
   // Result: SELECT * FROM users WHERE role = 'admin'
   ```

3. **Multiple condition filtering (AND logic):**
   ```typescript
   const conditions: SQL[] = [];
   if (params.search) conditions.push(...);
   if (params.role) conditions.push(...);
   const where = conditions.length > 0 ? and(...conditions) : undefined;
   // Result: SELECT * FROM users WHERE name LIKE '%...%' AND role = '...'
   ```

4. **Relation-based filtering:**
   ```typescript
   // Get reviews untuk specific stall
   const reviews = await db
     .select()
     .from(reviews)
     .where(eq(reviews.stallId, stallId));
   ```

**Implementation di project:**

- **User filtering:** Search by name, filter by role
- **Stall filtering:** Search by name, filter by category
- **Review filtering:** Filter by stall
- **Audit log filtering:** Filter by userId, action type

**Benefit filtering:**
- Reduced data transfer: Client hanya terima relevant data
- Better performance: Database execute filter, bukan application-level filter
- Better UX: Users dapat search/filter data dengan cepat

---

### Pagination

**Definisi:** Pagination adalah teknik untuk membagi large dataset menjadi smaller chunks (pages) untuk menghindari loading entire dataset sekaligus.

**Pagination formula:**
```
offset = (page - 1) * limit
// Example: page=2, limit=10 → offset=10, retrieve rows 10-19
```

**Pagination di project:**

1. **Pagination helper utility** (`src/utils/paginationHelper.ts`):
   ```typescript
   export function normalizePagination(page?: unknown, limit?: unknown) {
     const p = Math.max(1, Number(page) || 1); // Default page 1, min 1
     const l = Math.min(1000, Math.max(10, Number(limit) || 10)); // Default 10, max 1000
     return { page: p, limit: l };
   }
   ```
   - Validate dan normalize pagination params
   - Default values prevent invalid queries
   - Max limit 1000 prevent DOS attacks (huge data dump)

2. **Repository implementation:**
   ```typescript
   const offset = (params.page - 1) * params.limit;
   const rows = await db
     .select()
     .from(users)
     .where(where)
     .orderBy(users.id)
     .offset(offset)
     .fetch(params.limit);
   
   const totals = await db.select({ total: count() }).from(users).where(where);
   return { rows, total: Number(totals[0]?.total ?? 0) };
   ```
   - Execute 2 queries: data query dengan offset/limit, dan count query
   - Return both data dan total count

3. **Response format:**
   ```json
   {
     "status": "success",
     "meta": {
       "page": 1,
       "limit": 10,
       "total": 150
     },
     "data": [...]
   }
   ```
   - Client dapat calculate total pages: `Math.ceil(total / limit)`
   - Client dapat display "showing 1-10 of 150" text

**Query example:**
```
GET /users?page=2&limit=10&search=john
Result: Retrieve 10 users dengan name containing "john", from record 11-20
```

**Benefit pagination:**
- **Performance:** Retrieve hanya rows yang displayed, tidak seluruh table
- **Bandwidth:** Transfer data lebih sedikit
- **UX:** Faster page load, smoother scrolling
- **Scalability:** Bisa handle million-record tables dengan smooth pagination

---

### Integrasi Backend dengan Database

**Definisi:** Integrasi backend-database adalah bagaimana aplikasi backend terhubung, berinteraksi, dan manage lifecycle connection dengan database server.

**Architecture integrasi di project:**

```
Backend (Express App)
    ↓
Connection Pool (mssql package)
    ↓
ORM Layer (Drizzle)
    ↓
MSSQL Server
```

**1. Connection pooling** (`src/db/index.ts`):
```typescript
let poolPromise: Promise<mssql.ConnectionPool> | null = null;
let dbPromise: ReturnType<typeof buildDb> | null = null;

async function buildDb() {
  poolPromise ??= mssql.connect(config); // Lazy initialization
  const pool = await poolPromise;
  return drizzle({ client: pool, schema });
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = buildDb().catch((error) => {
      dbPromise = null;
      poolPromise = null;
      throw error;
    });
  }
  return dbPromise;
}
```

**Key points:**
- **Singleton pattern:** One Drizzle instance per app, reused across all requests
- **Lazy initialization:** Connection pool created on first `getDb()` call, not at app startup
- **Error recovery:** On error, reset promises untuk retry connection next time
- **Connection pooling:** mssql driver manage pool internally, reuse connections across requests

**2. Query execution:**
```typescript
const db = await getDb(); // Get singleton instance
const users = await db.select().from(users).where(eq(users.id, 1));
```
- Each request call `getDb()` to get pooled connection
- Drizzle build query, execute via mssql driver
- Connection returned to pool after query complete (automatic)

**3. Environment configuration** (`.env`):
```
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=...
DB_NAME=food_stalls_db
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```
- Database credentials external, not hardcoded
- SSL encryption optional untuk dev environment
- Loaded via dotenv package at app startup

**4. Seeding & migration:**
```typescript
// src/db/seed.ts
// Run: npm run seed
// Insert sample data ke database untuk development & testing
```

**5. Error handling:**
```typescript
export const getDb() {
  // ... build database
  .catch((error) => {
    dbPromise = null;
    poolPromise = null;
    throw error; // Propagate error to caller
  })
}

// di controller
try {
  const db = await getDb();
  const result = await db.select()...
} catch (error) {
  return res.status(500).json({ status: 'error', message: error.message });
}
```

**6. Middleware integration:**
```typescript
// auditMiddleware intercept HTTP response
// Extract response data & create audit log entry
// Query database (async, fire-and-forget)
```

**Benefit integrasi yang baik:**
- **Connection efficiency:** Pooling reuse connections, reduce overhead
- **Type safety:** Drizzle ensure schema-to-code alignment
- **Security:** Parametrized queries prevent SQL injection
- **Reliability:** Error handling & recovery mechanism
- **Maintainability:** Schema definition, migration, seeding di code

---

## 4. Kesimpulan

Project backend CRUD dengan Drizzle ORM ini memberikan pembelajaran mendalam tentang arsitektur modern backend dan best practices pengembangan aplikasi.

### Key learnings:

1. **Layered architecture** bukan hanya design pattern academic, tapi practical benefit untuk maintainability dan testability. Ketika setiap layer punya clear responsibility, refactoring dan debugging menjadi lebih mudah.

2. **Type safety end-to-end** (TypeScript + Drizzle) mencegah banyak bugs yang mungkin terjadi di runtime. Invest waktu untuk proper typing di awal development menghemat debugging time di production.

3. **ORM seperti Drizzle** memberikan sweet spot antara abstraction (mudah manipulasi data) dan control (masih close ke SQL semantics). Query builder pattern lebih readable daripada string interpolation dan lebih safe terhadap SQL injection.

4. **Parametrized query** adalah fundamental security practice yang automatic ketika menggunakan ORM - tidak perlu manual concatenation queries yang rawan injection.

5. **Pagination & filtering** adalah critical features untuk production apps. Simple implementation pada awal development mencegah performance issue di kemudian hari ketika data grow.

6. **Audit logging** sebagai cross-cutting concern bisa elegant di-handle dengan middleware pattern - tanpa pollute business logic di service layer.

7. **Connection pooling** dan singleton pattern untuk database instance adalah performance best practice - tidak perlu create new connection per request, reuse existing connections.

8. **Error handling consistency** (standardized response format `{ status, data }`) improve API usability dan error debugging di frontend.

### Architectural patterns yang proven:

- **Layered architecture:** Routes → Controllers → Services → Repositories → DB
- **DTO pattern:** Separate external API contract dari internal models
- **Repository pattern:** Abstract database access logic
- **Middleware pattern:** Cross-cutting concerns (audit logging)
- **Singleton pattern:** Database connection management
- **Dependency injection:** Services & repositories take dependencies via constructor

### Tools & ecosystem:

- **Drizzle ORM** - excellent untuk TypeScript projects yang perlu type safety
- **Express.js** - lightweight dan flexible, perfect untuk learning backend concepts
- **MSSQL** - enterprise-grade database dengan good tooling
- **Swagger autogen** - auto-documentation reduce manual documentation burden

### Next steps untuk improvement project:

1. Add authentication layer (JWT tokens) beyond simple X-User-Id header
2. Add input validation framework (e.g., Zod) untuk runtime request validation
3. Add transactional support untuk operations yang span multiple tables
4. Add soft delete pattern untuk data integrity
5. Add caching layer (Redis) untuk frequently accessed data
6. Add async job queue untuk heavy operations
7. Add comprehensive error codes & error boundary handling

---

**Kesimpulannya:** Project ini successfully demonstrate bagaimana build scalable, maintainable, dan type-safe backend application dengan modern tech stack. Konsep-konsep CRUD, layered architecture, ORM, filtering, dan pagination bukan hanya theoretical - tapi practical dan immediately applicable untuk production work.

Pembelajaran ini akan benefit significantly dalam building professional backend systems di masa depan.

