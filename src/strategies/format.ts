const MINUS = '−';

/** `+12.3%`, `−4.0%`: a value whose sign is the point. */
export const formatSigned = (value: number, digits = 1, unit = '%'): string =>
  `${value > 0 ? '+' : value < 0 ? MINUS : ''}${Math.abs(value).toFixed(digits)}${unit}`;

/** `1.42`, `−0.05`: a plain figure with a typographic minus. */
export const formatPlain = (value: number, digits = 2, unit = ''): string =>
  `${value < 0 ? MINUS : ''}${Math.abs(value).toFixed(digits)}${unit}`;

/** `Nov 23, 2026` from `YYYY-MM-DD`, in UTC so the server and the browser agree. */
export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );

/** Days published as years and months, for the caller to put into words. */
export const splitAge = (days: number): { years: number; months: number; days: number } => {
  if (days < 60) return { years: 0, months: 0, days };
  const months = Math.floor(days / 30.44);
  return { years: Math.floor(months / 12), months: months % 12, days: 0 };
};
