import { and, count, eq, like, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { users } from '../db/schema.ts';
import bcrypt from 'bcrypt';

export interface FindAllParams {
  search?: string;
  role?: string;
  page: number;
  limit: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'owner' | 'customer';
}

export class UserRepository {
  async findAll(params: FindAllParams) {
    const db = await getDb();

    const conditions: SQL[] = [];
    if (params.search) conditions.push(like(users.name, `%${params.search}%`));
    if (params.role) conditions.push(eq(users.role, params.role));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (params.page - 1) * params.limit;

    // MSSQL: pagination memakai ORDER BY + OFFSET ... FETCH NEXT.
    const rows = await db
      .select()
      .from(users)
      .where(where)
      .orderBy(users.id)
      .offset(offset)
      .fetch(params.limit);

    const totals = await db.select({ total: count() }).from(users).where(where);

    return { rows, total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0];
  }

  async findByEmail(email: string) {
    const db = await getDb();
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0];
  }

  async create(input: CreateUserInput) {
    const db = await getDb();

    // Hash password sebelum disimpan
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const rows = await db
      .insert(users)
      .output()
      .values({
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      });

    return rows[0];
  }
}
