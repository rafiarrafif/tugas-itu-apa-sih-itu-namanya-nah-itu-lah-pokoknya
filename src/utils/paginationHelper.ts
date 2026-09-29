export function normalizePagination(
  page: any = 1,
  limit: any = 10
): { page: number; limit: number } {
  let p = Math.max(1, Math.floor(Number(page) || 1));
  let l = Math.max(1, Math.min(Math.floor(Number(limit) || 10), 1000));

  return { page: p, limit: l };
}
