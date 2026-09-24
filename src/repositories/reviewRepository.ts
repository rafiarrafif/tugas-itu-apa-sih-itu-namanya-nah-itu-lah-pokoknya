import { and, count, eq, like, type SQL } from "drizzle-orm";
import { getDb } from "../db/index.ts";
import { reviews, stalls, users } from "../db/schema.ts";

export interface FindAllParams {
  search?: string;
  stallId?: number;
  userId?: number;
  page: number;
  limit: number;
}

export interface CreateReviewInput {
  stallId: number;
  userId: number;
  rating: number;
  comment?: string;
}

export class ReviewRepository {
  async findAll(params: FindAllParams) {
    const db = await getDb();

    const conditions: SQL[] = [];
    if (params.search)
      conditions.push(like(reviews.comment, `%${params.search}%`));
    if (params.stallId) conditions.push(eq(reviews.stallId, params.stallId));
    if (params.userId) conditions.push(eq(reviews.userId, params.userId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        id: reviews.id,
        stallId: reviews.stallId,
        userId: reviews.userId,
        rating: reviews.rating,
        comment: reviews.comment,
        likeCount: reviews.likeCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        stall: {
          id: stalls.id,
          name: stalls.name,
          category: stalls.category,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(reviews)
      .innerJoin(stalls, eq(reviews.stallId, stalls.id))
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(where)
      .orderBy(reviews.id)
      .offset(offset)
      .fetch(params.limit);

    const totals = await db
      .select({ total: count() })
      .from(reviews)
      .where(where);

    return { rows, total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select({
        id: reviews.id,
        stallId: reviews.stallId,
        userId: reviews.userId,
        rating: reviews.rating,
        comment: reviews.comment,
        likeCount: reviews.likeCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        stall: {
          id: stalls.id,
          name: stalls.name,
          category: stalls.category,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(reviews)
      .innerJoin(stalls, eq(reviews.stallId, stalls.id))
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.id, id));

    return rows[0];
  }

  async create(input: CreateReviewInput) {
    const db = await getDb();

    const rows = await db
      .insert(reviews)
      .output()
      .values({
        stallId: input.stallId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment || null,
        likeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    return rows[0];
  }

  async remove(id: number) {
    const db = await getDb();
    const rows = await db.delete(reviews).where(eq(reviews.id, id)).output();
    return rows[0];
  }

  async findByIdSimple(id: number) {
    const db = await getDb();
    const rows = await db.select().from(reviews).where(eq(reviews.id, id));
    return rows[0];
  }
}
