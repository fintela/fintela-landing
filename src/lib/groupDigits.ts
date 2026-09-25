/**
 * Thousands always grouped in the visitor's separator ("1,000", "1.000"):
 * CLDR leaves four-digit numbers ungrouped in Spanish, which would disagree
 * with the copy around them.
 */
export const groupDigits = (n: number, lang: string) => {
  const group = new Intl.NumberFormat(lang).formatToParts(1234567).find((p) => p.type === 'group')?.value ?? ',';
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, group);
};
