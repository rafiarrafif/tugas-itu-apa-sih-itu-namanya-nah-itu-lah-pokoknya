/**
 * Normalize dan validate pagination parameters untuk keamanan
 * - Ensures page >= 1
 * - Ensures 1 <= limit <= 1000
 * - Converts to integers
 */
export function normalizePagination(
  page: any = 1,
  limit: any = 10
): { page: number; limit: number } {
  // Convert to numbers and ensure they're integers
  let p = Math.max(1, Math.floor(Number(page) || 1));
  let l = Math.max(1, Math.min(Math.floor(Number(limit) || 10), 1000));

  return { page: p, limit: l };
}
