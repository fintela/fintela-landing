// Shared documentation content — TYPE SHAPES.
//
// This directory is the single source of truth for the PROSE, CODE SNIPPETS,
// STEP LISTS and TABLE DATA that the landing site (src/docs) and the
// Fintela app (the Fintela app's own documentation tree) both document. The two doc trees are forked
// (their resolver/registry/render machinery is intentionally incompatible), so
// only this framework-agnostic DATA is shared — each tree keeps its own
// DocBlock wrapper, render() function, JSX, and local id / docPath / default
// render-mode.
//
// HARD RULES for everything under src/docs-content/:
//   * Plain data only — strings, string[], and simple record arrays.
//   * NO React, NO MUI, NO JSX, NO runtime dependencies. Pure, dependency-free
//     TypeScript that compiles under BOTH apps' strict tsconfig.
//   * Inline emphasis (bold, inline code) is intentionally NOT encoded here;
//     each tree re-applies its own emphasis when it renders these strings.
//   * Code snippets are kept verbatim so the two trees render identical code.

/** A row in the "what an API key can see" visibility table (authentication). */
export interface VisibilityRow {
  /** The kind of resource being described. */
  resource: string;
  /**
   * Whether it is readable through the developer API. A short phrase rather
   * than a bare boolean, because one case is "No — use the web app".
   */
  visible: string;
}

/** One onboarding step in the quickstart. */
export interface QuickStep {
  num: number;
  title: string;
  body: string;
  /** Optional in-app breadcrumb the rich renderer may show as a NavPath. */
  navPath?: string[];
}

/** A named field / parameter row (studies, asset groups). */
export interface FieldRow {
  name: string;
  desc: string;
}

/** A performance-metric row (portfolios). */
export interface MetricRow {
  name: string;
  desc: string;
}

/** A lifecycle-state row (optimizer lifecycle). */
export interface StateRow {
  /** The state token, e.g. "QUEUED". */
  state: string;
  /** What the state applies to: "Study · Trial", "Study", or "Trial". */
  appliesTo: string;
  /** One-line meaning. */
  meaning: string;
  /** Optional presentation hint (hex colour) the app's status badge uses. */
  color?: string;
}

/** Standard render-mode prose shared by every concept block. */
export interface ConceptContent {
  /** One-sentence summary (the block's meta.summary). */
  summary: string;
  /** Ordered paragraphs for the rich / "full" rendering. Plain text. */
  full: string[];
  /** One-liner for the compact rendering. */
  compact: string;
  /** Shortest form, for inline rendering. */
  inline: string;
  /** Optional highlighted tip / callout line, when the block has one. */
  tip?: string;
  /** Optional second callout (e.g. a warning) for blocks that carry two. */
  note?: string;
}

/** Authentication block content. */
export interface AuthContent extends ConceptContent {
  /** The authenticated-request example — byte-identical across both trees. */
  authExample: string;
  /** What an API key can see, row by row. */
  visibility: VisibilityRow[];
}

/** Quickstart block content. */
export interface QuickstartContent {
  /** One-sentence summary (the block's meta.summary). */
  summary: string;
  /** Short lead-in shown above the steps. */
  intro: string;
  /** The ordered onboarding steps. */
  steps: QuickStep[];
  /** The "start small" tip body. */
  tip: string;
  /** One-liner for the compact rendering. */
  compact: string;
  /** Shortest form, for inline rendering. */
  inline: string;
}

/** External-mode block content (external strategies / external fitness). */
export interface ExternalModeContent extends ConceptContent {
  /** "When to use" bullet list (rich rendering). */
  whenToUse: string[];
  /** Endpoint summary, e.g. "POST {your-endpoint}/simulate". */
  endpoint: string;
  /** One-line description of the endpoint. */
  endpointDescription: string;
  /** Example request (verbatim snippet). */
  requestExample?: string;
  /** Example success response (verbatim snippet). */
  responseExample: string;
  /** Minimal server implementation (external strategies only, verbatim). */
  implementationExample?: string;
  /** Language of implementationExample, e.g. "python". */
  implementationLanguage?: string;
  /** The body-vs-query asymmetry note shared by both modes. */
  contractNote?: string;
}

/** Data-clusters block content (adds the frontend field table). */
export interface DataClustersContent extends ConceptContent {
  /** Fields that define a cluster (currently rendered by the app tree only). */
  fields: FieldRow[];
}

/** Studies block content (adds the study-field table). */
export interface StudiesContent extends ConceptContent {
  /** Key study fields. */
  fields: FieldRow[];
}

/** Portfolios block content (adds the metric table). */
export interface PortfoliosContent extends ConceptContent {
  /** Example performance metrics (currently rendered by the app tree only). */
  metrics: MetricRow[];
}

/** Optimizer-lifecycle block content (adds the state table). */
export interface LifecycleContent extends ConceptContent {
  /** The study / trial state machine. */
  states: StateRow[];
}

/** Strategies block content (adds the signal-shape code snippets). */
export interface StrategiesContent extends ConceptContent {
  /** Full signal-shape example (multiple dates), verbatim. */
  signalExample: string;
  /** Compact signal-shape example (single date), verbatim. */
  signalCompact: string;
}

/** Seed block content (adds the seed-shape code snippets). */
export interface SeedContent extends ConceptContent {
  /** Full seed-shape example (multiple dates), verbatim. */
  seedExample: string;
  /** Compact seed-shape example (single date), verbatim. */
  seedCompact: string;
}
