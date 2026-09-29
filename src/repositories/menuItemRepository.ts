import { and, count, eq, like, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { menuItems, stalls } from '../db/schema.ts';

export interface FindAllParams {
  search?: string;
  stallId?: number;
  page: number;
  limit: number;
}

export interface CreateMenuItemInput {
  stallId: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface UpdateMenuItemInput {
  name?: string;
  price?: number;
  isAvailable?: boolean;
}

export class MenuItemRepository {
  async findAll(params: FindAllParams) {
    const db = await getDb();

    const conditions: SQL[] = [];
    if (params.search) conditions.push(like(menuItems.name, `%${params.search}%`));
    if (params.stallId) conditions.push(eq(menuItems.stallId, params.stallId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select({
        id: menuItems.id,
        stallId: menuItems.stallId,
        name: menuItems.name,
        price: menuItems.price,
        isAvailable: menuItems.isAvailable,
        stall: {
          id: stalls.id,
          name: stalls.name,
          category: stalls.category,
          location: stalls.location,
        },
      })
      .from(menuItems)
      .leftJoin(stalls, eq(menuItems.stallId, stalls.id))
      .where(where)
      .orderBy(menuItems.id)
      .offset(offset)
      .fetch(params.limit);

    const totals = await db
      .select({ total: count() })
      .from(menuItems)
      .where(where);

    return { rows, total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select({
        id: menuItems.id,
        stallId: menuItems.stallId,
        name: menuItems.name,
        price: menuItems.price,
        isAvailable: menuItems.isAvailable,
        stall: {
          id: stalls.id,
          name: stalls.name,
          category: stalls.category,
          location: stalls.location,
        },
      })
      .from(menuItems)
      .leftJoin(stalls, eq(menuItems.stallId, stalls.id))
      .where(eq(menuItems.id, id));

    return rows[0];
  }

  async create(input: CreateMenuItemInput) {
    const db = await getDb();

    const rows = await db
      .insert(menuItems)
      .output()
      .values({
        stallId: input.stallId,
        name: input.name,
        price: input.price,
        isAvailable: input.isAvailable,
      });

    return rows[0];
  }

  async update(id: number, input: UpdateMenuItemInput) {
    const db = await getDb();

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.isAvailable !== undefined) updateData.isAvailable = input.isAvailable;

    const rows = await db
      .update(menuItems)
      .set(updateData)
      .where(eq(menuItems.id, id))
      .output();

    return rows[0];
  }

  async remove(id: number) {
    const db = await getDb();
    const rows = await db.delete(menuItems).where(eq(menuItems.id, id)).output();
    return rows[0];
  }

  async findByIdSimple(id: number) {
    const db = await getDb();
    const rows = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return rows[0];
  }

  async findByStallId(stallId: number) {
    const db = await getDb();
    const rows = await db
      .select({
        id: menuItems.id,
        stallId: menuItems.stallId,
        name: menuItems.name,
        price: menuItems.price,
        isAvailable: menuItems.isAvailable,
        stall: {
          id: stalls.id,
          name: stalls.name,
          category: stalls.category,
          location: stalls.location,
        },
      })
      .from(menuItems)
      .leftJoin(stalls, eq(menuItems.stallId, stalls.id))
      .where(eq(menuItems.stallId, stallId));

    return rows;
  }
}
