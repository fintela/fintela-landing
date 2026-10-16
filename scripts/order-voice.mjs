/**
 * Orders are the user's.
 *
 * A live operation sends a brokerage account the orders its owner started, at
 * their direction: the app's own copy says so ("so Fintela can transmit your
 * live operations' orders to it, at your direction"), and the docs have to say
 * the same. Prose that casts Fintela as the trader — "Fintela places the
 * initial buy", "Fintela sells just enough", "trades on your behalf" — says the
 * opposite, and it has come back into these pages through rewrites before.
 * `scripts/check-content.mjs` runs this over every published doc and post.
 *
 * It finds the phrasings, not every way of saying it: a sentence can still be
 * wrong in words no pattern names, so this is a floor under review, not a
 * replacement for it. A backtest's simulated trades are a different subject,
 * and are written without these phrasings ("a study treats that curve like a
 * ticker's price series", "the orders the simulation placed").
 */

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

/** Words that can sit between the subject and its verb: "Fintela simply sells",
 *  "Fintela genuinely can't place", "the platform will place", "Fintela to trade". */
const BETWEEN = String.raw`(?:\s+(?:automatically|simply|then|also|still|genuinely|actually|itself|will|would|can|can't|cannot|could|couldn't|may|might|must|never|only|just|now|always|immediately|to))*`;
const SUBJECT = String.raw`\b(?:Fintela|the platform)`;

const PATTERNS = [
  // Fintela as the one buying, selling, placing or trading.
  String.raw`${SUBJECT}${BETWEEN}\s+(?:buys?|bought|sells?|sold|places?|placed|trades?|traded|trims?|trimmed|liquidates?|liquidated|invests?|invested)\b`,
  // ... or executing / submitting orders. ("Fintela transmits your orders, at
  // your direction" is the app's own wording and stays allowed.)
  String.raw`${SUBJECT}${BETWEEN}\s+(?:executes?|executed|submits?|submitted)\s+(?:\S+\s+){0,3}?(?:orders?|trades?|buys?|sells?)\b`,
  // "every order Fintela plans", "an order Fintela placed".
  String.raw`\borders?\s+(?:that\s+)?(?:Fintela|the platform)\s+(?:has\s+|had\s+)?(?:plans?|planned|places?|placed|submits?|submitted)\b`,
  // "order placement is handled ... by Fintela", "orders are placed by Fintela".
  // (Not "the halt can only be triggered by Fintela's operations team".)
  String.raw`\b(?:order placement|placement of (?:orders|trades)|(?:orders?|trades?) (?:are|is|were|was|get|gets) (?:\w+ ){0,2}?(?:placed|sent|submitted|executed|made))\b[^.!?|\n]{0,60}\bby (?:Fintela|the platform)\b`,
  // "on your behalf" in a sentence about orders or trading.
  String.raw`\b(?:orders?|trad(?:e|es|ed|ing)|buy|sell|positions?|invest(?:s|ed|ing)?)\b[^.!?|]{0,120}\bon your behalf\b`,
  String.raw`\bon your behalf\b[^.!?|]{0,120}\b(?:orders?|trad(?:e|es|ed|ing)|buy|sell|positions?)\b`,
  // "trades for you", "places orders for you".
  String.raw`\b(?:trades?|trading|buys?|sells?|orders?|invests?)\s+for you\b`,
].map((source) => new RegExp(source, 'gi'));

/**
 * The phrasings in `markdown` that cast Fintela as the trader, outside fenced
 * code, each with the 1-based line of the body it starts on. Lines are joined
 * first, so a phrase wrapped across two lines is still found.
 */
export function findOrderVoice(markdown) {
  const kept = [];
  let fence = null;
  for (const line of markdown.split('\n')) {
    const match = FENCE.exec(line);
    if (match) {
      const ticks = match[1][0];
      if (!fence) fence = ticks;
      else if (ticks === fence) fence = null;
      kept.push('');
      continue;
    }
    kept.push(fence ? '' : line);
  }
  const text = kept.join('\n');
  const found = new Map();
  for (const pattern of PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      if (found.has(match.index)) continue;
      found.set(match.index, {
        line: text.slice(0, match.index).split('\n').length,
        phrase: match[0].replace(/\s+/g, ' ').trim(),
      });
    }
  }
  return [...found.entries()].sort(([a], [b]) => a - b).map(([, hit]) => hit);
}
