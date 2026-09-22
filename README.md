# Hands-on 2 — Akses Database dengan Drizzle ORM

Hands-on ini mengganti akses data dari query SQL manual menjadi **ORM (Drizzle)**,
tetap memakai arsitektur berlapis (Repository → Service → Controller → Router).

> File ini adalah sumber langkah utama.

## Prinsip

- **Skema DDL tetap dikelola di `../db/*.sql`** (recall ERD di SQL Server).
- Drizzle dipakai untuk **query bertipe** dari aplikasi.
- `src/db/schema.ts` **ditulis manual**, bukan hasil `drizzle-kit pull`. Alasannya:
  intropeksi (`pull`) Drizzle untuk MSSQL masih **RC** dan belum stabil.

## Prasyarat

- Node.js **>= 22.18.0**, npm
- SQL Server aktif + database sudah disiapkan:

```powershell
sqlcmd -S localhost -E -C -i ..\db\00-setup-mixed-mode.sql       # sekali saja
sqlcmd -S localhost -E -C -i ..\db\01-create-database-and-user.sql
sqlcmd -S localhost -E -C -i ..\db\02-schema.sql
sqlcmd -S localhost -E -C -i ..\db\03-seed.sql
```

---

## Langkah 1 — Buat project & install dependencies

```bash
npm init -y
npm install express mssql dotenv drizzle-orm@1.0.0-rc.5-5935859 swagger-ui-express swagger-autogen
npm install -D typescript @types/express @types/mssql @types/node tsx drizzle-kit@1.0.0-rc.5-5935859 @types/swagger-ui-express
```

> Versi `drizzle-orm`/`drizzle-kit` dipatok ke RC yang sudah diuji. Drizzle untuk MSSQL
> masih preview, jadi API bisa berubah.

### `package.json`

```json
{
  "main": "src/index.ts",
  "scripts": {
    "start": "tsx src/index.ts",
    "prestart": "npm run docs:gen",
    "dev": "tsx watch src/index.ts",
    "predev": "npm run docs:gen",
    "docs:gen": "tsx src/docs/swagger.ts"
  },
  "type": "commonjs"
}
```

## Langkah 2 — Konfigurasi `.env`

```powershell
Copy-Item .env.example .env
```

```
DB_SERVER=localhost
DB_PORT=1433
DB_USER=praktikum_user
DB_PASSWORD=Praktikum2026!
DB_NAME=review_kantin
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

> Nilai yang mengandung `#` wajib dibungkus tanda kutip (dotenv menganggap `#` komentar).

## Langkah 3 — Definisikan schema (`src/db/schema.ts`)

Kita memetakan tabel SQL Server ke objek TypeScript memakai `mssqlTable` dan
builder kolom `mssql-core`.

```ts
import { mssqlTable, int, bit, nvarchar, decimal, datetime2 } from 'drizzle-orm/mssql-core';

export const users = mssqlTable('USERS', {
  id: int('id').primaryKey().identity(),
  name: nvarchar('name', { length: 100 }).notNull(),
  email: nvarchar('email', { length: 150 }).notNull().unique(),
  passwordHash: nvarchar('password_hash', { length: 255 }).notNull(),
  role: nvarchar('role', { length: 20, enum: ['admin', 'owner', 'customer'] }).notNull(),
  createdAt: datetime2('created_at'),
});

export const stalls = mssqlTable('STALLS', {
  id: int('id').primaryKey().identity(),
  ownerId: int('owner_id').notNull().references(() => users.id),
  name: nvarchar('name', { length: 100 }).notNull(),
  category: nvarchar('category', { length: 50 }),
  location: nvarchar('location', { length: 100 }),
  description: nvarchar('description', { length: 'max' }),
  avgRating: decimal('avg_rating', { precision: 3, scale: 2 }).notNull(),
  reviewCount: int('review_count').notNull(),
  createdAt: datetime2('created_at'),
});

export const menuItems = mssqlTable('MENU_ITEMS', {
  id: int('id').primaryKey().identity(),
  stallId: int('stall_id').notNull().references(() => stalls.id),
  name: nvarchar('name', { length: 100 }).notNull(),
  price: int('price').notNull(),
  isAvailable: bit('is_available').notNull(),
});
```

`src/db/schema.ts` juga memuat `reviews`, `likes`, `flags`, dan `auditLogs`
(tabel lain dari ERD yang belum dipakai di hands-on ini).

## Langkah 4 — Inisialisasi koneksi (`src/db/index.ts`)

```ts
import 'dotenv/config';
import mssql from 'mssql';
import { drizzle } from 'drizzle-orm/node-mssql';
import * as schema from './schema.ts';

const config: mssql.config = {
  server: process.env.DB_SERVER ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

let poolPromise: Promise<mssql.ConnectionPool> | null = null;
let dbPromise: ReturnType<typeof buildDb> | null = null;

async function buildDb() {
  poolPromise ??= mssql.connect(config);
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

## Langkah 5 — Repository dengan query builder

`src/repositories/stallRepository.ts`:

```ts
import { and, count, eq, like, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { stalls } from '../db/schema.ts';

export class StallRepository {
  async findAll(params: FindAllParams) {
    const db = await getDb();

    const conditions: SQL[] = [];
    if (params.search) conditions.push(like(stalls.name, `%${params.search}%`));
    if (params.category) conditions.push(eq(stalls.category, params.category));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (params.page - 1) * params.limit;

    // MSSQL: pagination = ORDER BY + OFFSET ... FETCH NEXT
    const rows = await db
      .select()
      .from(stalls)
      .where(where)
      .orderBy(stalls.id)
      .offset(offset)
      .fetch(params.limit);

    const totals = await db.select({ total: count() }).from(stalls).where(where);

    return { rows, total: Number(totals[0]?.total ?? 0) };
  }

  async create(input: CreateStallInput) {
    const db = await getDb();
    const rows = await db.insert(stalls).output().values({ /* ... */ });
    return rows[0];
  }
}
```

Join contoh (menu items) — `src/repositories/menuItemRepository.ts`:

```ts
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { menuItems } from '../db/schema.ts';

export class MenuItemRepository {
  async findByStallId(stallId: number) {
    const db = await getDb();
    return db.select().from(menuItems).where(eq(menuItems.stallId, stallId));
  }
}
```

## Langkah 6 — Service (mapping + logika bisnis)

`src/services/stallService.ts` memetakan row DB menjadi DTO camelCase dan menghitung
`isPopular` (rating ≥ 4.7). Perhatikan: `decimal` dari driver berbentuk **string**,
jadi di-`Number(...)`.

```ts
private toDto(row: StallRow): StallResponseDto {
  const avgRating = Number(row.avgRating);
  return { ...row, avgRating, isPopular: avgRating >= 4.7 };
}
```

## Langkah 7 — Controller, Router, dan Entry point

- `src/controllers/stallController.ts` — handler Express, memetakan `STALL_NOT_FOUND` → 404.
- `src/routes/stallRouter.ts` — pemetaan endpoint.
- `src/index.ts` — server Express + `GET /health` (`SELECT 1` via Drizzle).

## Langkah 8 — Jalankan & uji

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

---

## 📚 Daftar API yang Tersedia

### Endpoint Summary

| Method | Endpoint | Status Code | Fungsi |
| --- | --- | --- | --- |
| `GET` | `/health` | 200, 500 | Cek kesehatan server & koneksi database |
| `GET` | `/docs` | 200 | Swagger UI (dokumentasi interaktif) |
| `GET` | `/api/v1/stalls` | 200, 500 | Daftar warung (dengan filter & pagination) |
| `POST` | `/api/v1/stalls` | 201, 500 | Buat warung baru |
| `GET` | `/api/v1/stalls/:id` | 200, 404, 500 | Detail warung spesifik |
| `PUT` | `/api/v1/stalls/:id` | 200, 404, 500 | Update data warung |
| `DELETE` | `/api/v1/stalls/:id` | 200, 404, 500 | Hapus warung |
| `GET` | `/api/v1/stalls/:id/menus` | 200, 404, 500 | Daftar menu dari warung tertentu |

---

### Contoh Testing API

#### 1. **GET /health** — Cek Kesehatan Server

```bash
curl -X GET http://localhost:3000/health
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Server dan database terhubung"
}
```

**Response (Error - 500):**
```json
{
  "status": "error",
  "message": "Gagal terhubung ke database",
  "error": "Connection timeout"
}
```

---

#### 2. **GET /api/v1/stalls** — Daftar Warung

**Tanpa parameter (default page=1, limit=10):**
```bash
curl -X GET http://localhost:3000/api/v1/stalls
```

**Dengan pagination:**
```bash
curl -X GET "http://localhost:3000/api/v1/stalls?page=1&limit=5"
```

**Dengan filter search (nama warung):**
```bash
curl -X GET "http://localhost:3000/api/v1/stalls?search=soto"
```

**Dengan filter category:**
```bash
curl -X GET "http://localhost:3000/api/v1/stalls?category=Minuman"
```

**Kombinasi semua parameter:**
```bash
curl -X GET "http://localhost:3000/api/v1/stalls?search=soto&category=Makanan&page=1&limit=5"
```

**Response (200):**
```json
{
  "status": "success",
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 15
  },
  "data": [
    {
      "id": 1,
      "ownerId": 2,
      "name": "Warung Soto Ayam",
      "category": "Makanan",
      "location": "Jalan Merdeka No. 10",
      "description": "Soto ayam asli Yogyakarta",
      "avgRating": 4.8,
      "reviewCount": 42,
      "isPopular": true
    }
  ]
}
```

**Query Parameters:**

| Parameter | Type | Default | Deskripsi |
| --- | --- | --- | --- |
| `search` | string | - | Filter nama warung (case-insensitive) |
| `category` | string | - | Filter kategori warung |
| `page` | integer | 1 | Halaman ke berapa |
| `limit` | integer | 10 | Jumlah data per halaman |

---

#### 3. **POST /api/v1/stalls** — Buat Warung Baru

```bash
curl -X POST http://localhost:3000/api/v1/stalls \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": 2,
    "name": "Warung Bakso Mantap",
    "category": "Makanan",
    "location": "Jalan Sudirman No. 45",
    "description": "Bakso berkuah lezat dengan daging sapi pilihan"
  }'
```

**Request Body:**
```json
{
  "ownerId": 2,
  "name": "Warung Bakso Mantap",
  "category": "Makanan",
  "location": "Jalan Sudirman No. 45",
  "description": "Bakso berkuah lezat dengan daging sapi pilihan"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": 5,
    "ownerId": 2,
    "name": "Warung Bakso Mantap",
    "category": "Makanan",
    "location": "Jalan Sudirman No. 45",
    "description": "Bakso berkuah lezat dengan daging sapi pilihan",
    "avgRating": 0,
    "reviewCount": 0,
    "isPopular": false
  }
}
```

---

#### 4. **GET /api/v1/stalls/:id** — Detail Warung

```bash
curl -X GET http://localhost:3000/api/v1/stalls/1
```

**Response (200 - Found):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "ownerId": 2,
    "name": "Warung Soto Ayam",
    "category": "Makanan",
    "location": "Jalan Merdeka No. 10",
    "description": "Soto ayam asli Yogyakarta",
    "avgRating": 4.8,
    "reviewCount": 42,
    "isPopular": true
  }
}
```

**Response (404 - Not Found):**
```json
{
  "status": "fail",
  "message": "Data warung tidak ditemukan"
}
```

---

#### 5. **PUT /api/v1/stalls/:id** — Update Warung

```bash
curl -X PUT http://localhost:3000/api/v1/stalls/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Warung Soto Ayam Premium",
    "location": "Jalan Merdeka No. 15"
  }'
```

**Request Body:**
```json
{
  "name": "Warung Soto Ayam Premium",
  "location": "Jalan Merdeka No. 15"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "ownerId": 2,
    "name": "Warung Soto Ayam Premium",
    "category": "Makanan",
    "location": "Jalan Merdeka No. 15",
    "description": "Soto ayam asli Yogyakarta",
    "avgRating": 4.8,
    "reviewCount": 42,
    "isPopular": true
  }
}
```

**Response (404):**
```json
{
  "status": "fail",
  "message": "Data warung tidak ditemukan"
}
```

---

#### 6. **DELETE /api/v1/stalls/:id** — Hapus Warung

```bash
curl -X DELETE http://localhost:3000/api/v1/stalls/1
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "ownerId": 2,
    "name": "Warung Soto Ayam",
    "category": "Makanan",
    "location": "Jalan Merdeka No. 10",
    "description": "Soto ayam asli Yogyakarta",
    "avgRating": 4.8,
    "reviewCount": 42,
    "isPopular": true
  }
}
```

**Response (404):**
```json
{
  "status": "fail",
  "message": "Data warung tidak ditemukan"
}
```

---

#### 7. **GET /api/v1/stalls/:id/menus** — Daftar Menu Warung

```bash
curl -X GET http://localhost:3000/api/v1/stalls/1/menus
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "stallId": 1,
      "name": "Soto Ayam Sedang",
      "price": 25000,
      "isAvailable": true
    },
    {
      "id": 2,
      "stallId": 1,
      "name": "Soto Ayam Besar",
      "price": 35000,
      "isAvailable": true
    }
  ]
}
```

**Response (404 - Warung tidak ditemukan):**
```json
{
  "status": "fail",
  "message": "Data warung tidak ditemukan"
}
```

---

### Testing Tools Rekomendasi

1. **cURL** (command line) — built-in semua OS
2. **Postman** — GUI Desktop, cocok untuk kolaborasi
3. **Insomnia** — GUI Desktop, alternatif Postman
4. **Thunder Client** — VS Code Extension, ringan
5. **REST Client** — VS Code Extension, langsung di editor

---

## Dokumentasi API (Swagger UI)

Dokumentasi dibangun dengan **`swagger-autogen`**: ia memindai file route/entry,
mendeteksi **path + method secara otomatis**, sedangkan parameter & response ditambahkan
lewat komentar singkat `#swagger.*` di dalam handler. Hasilnya disajikan lewat
**`swagger-ui-express`** di `http://localhost:3000/docs`.

Alur:

1. `npm run docs:gen` — memindai `src/index.ts` (beserta router yang diimpor) dan
   menghasilkan `src/docs/swagger-output.json`.
2. `npm run dev` — menyajikan spec tersebut di `/docs`.
   (`predev`/`prestart` otomatis menjalankan `docs:gen` sebelum server start.)

Karena `#swagger.*` harus berada di dalam body handler, route ditulis sebagai handler
**inline** yang memanggil controller, mis.:

```ts
stallRouter.get('/', (req, res) => {
  // #swagger.parameters['search']   = { in: 'query', type: 'string' }
  // #swagger.parameters['category'] = { in: 'query', type: 'string' }
  // #swagger.parameters['page']     = { in: 'query', type: 'integer' }
  // #swagger.parameters['limit']    = { in: 'query', type: 'integer' }
  // #swagger.responses[200] = { description: 'Daftar warung' }
  return stallController.getStalls(req, res);
});

stallRouter.post('/', (req, res) => {
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/StallInput' } }
  // #swagger.responses[201] = { description: 'Warung dibuat' }
  return stallController.createStall(req, res);
});
```

File terkait:

- `src/docs/swagger.ts` — definisi `info`, `servers`, `definitions.StallInput`, lalu `swaggerAutogen()(outputFile, endpointsFiles, doc)`.
- `src/docs/swagger-output.json` — **hasil generate** (di-`.gitignore`, jangan diedit manual).
- `src/routes/stallRouter.ts` — handler inline + `#swagger.parameters`/`#swagger.responses`.
- `src/index.ts` — `app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));`

Buka `/docs`, lalu klik **Try it out** untuk mengisi parameter/body dan mengirim request.

> Spec yang dihasilkan berformat **Swagger 2.0** — karena itu schema dirujuk lewat
> `#/definitions/...` (bukan `#/components/schemas/...`).

---

## Catatan penting: perbedaan API Drizzle untuk MSSQL

Bila terbiasa dengan contoh Drizzle (Postgres/MySQL), ada beberapa perbedaan:

- **Pagination**: MSSQL memakai `.orderBy(...).offset(n).fetch(m)` — **bukan** `.limit()`.
  `.offset()` wajib didahului `.orderBy()`. Ada juga `.top(n)`.
- **Mengembalikan row saat insert/update/delete**: memakai `.output()` (bukan `.returning()`).
  Untuk insert, `.output()` dipanggil **sebelum** `.values()`.
- **`decimal`** dikembalikan sebagai **string** oleh driver; konversi ke `Number` bila perlu.
- **`drizzle-kit pull`** (introspeksi) untuk MSSQL masih RC dan belum stabil, sehingga
  `schema.ts` ditulis manual dan DDL tetap di `../db/*.sql`.

## Struktur Project

```
hands-on-2-orm-drizzle/
├─ README.md
├─ .env.example
├─ drizzle.config.ts          # konfigurasi drizzle-kit (referensi)
├─ package.json  tsconfig.json
└─ src/
   ├─ db/
   │  ├─ schema.ts            # pemetaan tabel (manual)
   │  └─ index.ts            # koneksi Drizzle
   ├─ docs/
   │  ├─ swagger.ts           # generator spec (swagger-autogen)
   │  └─ swagger-output.json  # hasil generate (gitignored)
   ├─ dtos/stallDto.ts
   ├─ repositories/
   │  ├─ stallRepository.ts
   │  └─ menuItemRepository.ts
   ├─ services/stallService.ts
   ├─ controllers/stallController.ts
   ├─ routes/stallRouter.ts
   └─ index.ts
```
