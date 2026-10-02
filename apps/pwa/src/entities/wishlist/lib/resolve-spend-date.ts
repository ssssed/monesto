/**
 * Дата разового расхода при «Потратить» из запланированной хотелки.
 * Должна лечь в период, на который хотелка запланирована, — НЕ в сегодняшний
 * день, иначе расход попадёт в текущий цикл вместо того, где его ждали.
 */
export function resolveSpendDateIso(
  item: { planned_date: string | null },
  todayIso: string,
): string {
  return item.planned_date ?? todayIso;
}
