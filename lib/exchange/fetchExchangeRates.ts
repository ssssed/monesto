/** Заглушка: позже заменить на реальный API. */
export async function fetchUsdRubRate(): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return 82;
}
