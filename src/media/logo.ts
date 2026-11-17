/**
 * The Fintela wordmark as the header and footer draw it: about 22px tall, so
 * 360px wide covers a 3x screen. The master is 3640×680 and half a megabyte;
 * vite-imagetools resizes it at build time, so the page never fetches it.
 */
import src from '../assets/logos/fintela_logo_2.png?w=360&format=webp';

export const FINTELA_LOGO = { src, width: 360, height: 67 } as const;
