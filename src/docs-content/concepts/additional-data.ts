// Shared content for the "data pipelines" (additional data) concept block.
//
// LANDING-ONLY today: there is no the Fintela app's own documentation tree twin. Kept here as a single
// copy so it can be shared the moment the app tree adds an additional-data
// block, and so all doc content lives in one place.
import type { ConceptContent } from '../types';

export const additionalData: ConceptContent = {
  summary:
    'Reusable, versioned graphs that bring custom data into strategies, fitness functions and risk managers — data sources (built-in feeds or your own external APIs) flow through transforms into named outputs, validated graph-aware before you save.',

  full: [
    'Beyond raw market prices, strategies, fitness functions and risk managers pull custom data through data pipelines — reusable, versioned graphs that wire data sources (built-in feeds like trading volume, fundamentals, news sentiment, market cap, dividends & splits, sector / country / index groupings and basket holdings, or your own external APIs) through transforms (returns, rolling, z-score, rank, lag, combine) into named outputs.',
    'Sources can be built-in feeds or your own external data sources — a public HTTPS endpoint you host, in front of your own database or API, that returns JSON for the tickers Fintela requests. Fintela pulls and caches it out of band and injects it as a kwarg; it never connects to your database directly and never runs your code.',
    "Each output node becomes a named input in your code's signature, and validation is graph-aware: before you save, the platform walks the exact pipeline the runtime will, so an input only resolves if a connected pipeline actually produces it. Pipelines are built once and connected to any strategy, fitness function or risk manager — no glue code, no per-component data plumbing.",
    "Not sure what a source actually looks like? The Data Explorer → Ingredients catalog documents every injectable source's exact shape — a table, a dictionary, a membership set of tickers, or a record — with a code-indexing example and a live sample. Non-price objects like hierarchical groupings, default clusters and basket holdings are configured and previewed right there, so you know each ingredient before you wire it in.",
  ],

  compact:
    'Reusable, versioned graphs that wire data sources (built-in or external) through transforms into named outputs, feeding strategies, fitness functions and risk managers. Graph-aware-validated, resolved automatically at run time.',

  inline:
    'Reusable graphs that wire custom data sources and transforms into the inputs your code consumes.',
};
