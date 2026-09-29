import { and, count, eq, like, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { flags } from '../db/schema.ts';

export interface FindAllParams {
  search?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface UpdateFlagInput {
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

export class FlagRepository {
  async findAll(params: FindAllParams) {
    const db = await getDb();

    const conditions: SQL[] = [];
    if (params.search) conditions.push(like(flags.reason, `%${params.search}%`));
    if (params.status) conditions.push(eq(flags.status, params.status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select()
      .from(flags)
      .where(where)
      .orderBy(flags.id)
      .offset(offset)
      .fetch(params.limit);

    const totals = await db.select({ total: count() }).from(flags).where(where);

    return { rows, total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db.select().from(flags).where(eq(flags.id, id));
    return rows[0];
  }

  async update(id: number, input: UpdateFlagInput) {
    const db = await getDb();

    const rows = await db
      .update(flags)
      .set({ status: input.status })
      .where(eq(flags.id, id))
      .output();

    return rows[0];
  }
}
