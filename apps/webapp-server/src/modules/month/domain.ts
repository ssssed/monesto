export function canEditMonth(year: number, month: number) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  return year === y && month === m;
}
