export const BIRTH_YEAR = 2002;
export const BIRTH_MONTH = 10;

export function calculateAge(now: Date = new Date()): number {
  const years = now.getFullYear() - BIRTH_YEAR;
  return now.getMonth() + 1 >= BIRTH_MONTH ? years : years - 1;
}
