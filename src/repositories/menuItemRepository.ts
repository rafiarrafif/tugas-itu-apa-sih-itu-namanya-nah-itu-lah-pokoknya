import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { menuItems } from '../db/schema.ts';

export class MenuItemRepository {
  async findByStallId(stallId: number) {
    const db = await getDb();
    return db.select().from(menuItems).where(eq(menuItems.stallId, stallId));
  }
}
