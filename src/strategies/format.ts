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

