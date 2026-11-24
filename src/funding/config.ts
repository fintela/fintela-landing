/**
 * The one switch for the price the Get Funding page quotes.
 *
 * TENTATIVE: the figure is not final. It is shown only as platform usage,
 * never as a plan, and never with the plan's name or benefits. Change the
 * string to change it everywhere on the page; set it to `null` to remove the
 * figure (the page then says "you pay for platform usage" without a number).
 */
export const FUNDING_PLATFORM_PRICE: string | null = '$199';

/** The request form's anchor, the target of every "Request funding" button. */
export const FUNDING_REQUEST_ANCHOR = 'request';

/** The page's route, shared by the router, the nav, the sitemap and the search index. */
export const FUNDING_PATH = '/get-funding';

/**
 * The selection criteria the page publishes. Exactly three, and on purpose
 * worded at a level that does not let anyone reverse-engineer the evaluation:
 * no weights, no formula, no full threshold set.
 *
 * PLACEHOLDERS until the final values are confirmed. Change the wording here
 * only; the page renders this list as it is.
 */
export const FUNDING_SELECTION_CRITERIA: readonly [string, string, string] = [
  // PLACEHOLDER (value given, wording to confirm).
  'Adjusted Sharpe above 1.2',
  // TBD: criterion 2 not decided yet. Do not ship with this text.
  '[Criterion 2: TBD]',
  // TBD: criterion 3 not decided yet. Do not ship with this text.
  '[Criterion 3: TBD]',
];

/**
 * TENTATIVE: the FAQ answer saying the activation fee is charged only once a
 * strategy is accepted. `false` removes that question from the page and from
 * its FAQ structured data.
 */
export const FUNDING_FAQ_ACTIVATION_FEE = true;
