/**
 * The Fintelligent demo's storyboard: every beat of the 30-second loop, in
 * seconds on the playhead. The flow is the one the app's agent prompts
 * direct (services/ai-agent/app/prompts/system/create_strategy.md and
 * create_study.md): one user message runs the strategy playbook and the
 * study playbook in a single turn that ends on a question card; answering it
 * builds the study and asks permission to spend; confirming launches it.
 *
 * Time is compressed — a real turn takes tens of seconds — but the order of
 * tools, the status phases and the labels are the app's.
 */

export const LOOP = 30;

/** The frame shown under prefers-reduced-motion: prompt, strategy and all three answers at once. */
export const STILL = 16.95;

export type ChapterKey = 'prompt' | 'strategy' | 'configure' | 'launch';

/** Chapters of the player bar; `still` is where a paused, reduced-motion seek lands. */
export const CHAPTERS: ReadonlyArray<{ key: ChapterKey; start: number; still: number }> = [
  { key: 'prompt', start: 0, still: 4.95 },
  { key: 'strategy', start: 5, still: 9.4 },
  { key: 'configure', start: 9.6, still: STILL },
  { key: 'launch', start: 21.9, still: 27.4 },
];

export const T = {
  /** Camera: isometric establishing shot → readable 3/4 → isometric finale. */
  toFront: [0.7, 2.0],
  toIso: [24.1, 25.6],
  fadeOut: [29.2, 29.8],
  fadeIn: [0, 0.35],

  pillHover: 1.75,
  composerOpen: 2.0,
  type: [2.3, 4.7],
  send: 5.0,
  panelOpen: 5.0,
  thinkingIn: 5.15,

  cardQ: 11.7,
  pickObjective: 12.9,
  tabOptimizer: 13.3,
  menuOpen: 14.0,
  menuPick: 15.7,
  tabTrials: 16.0,
  pickTrials: 16.8,
  submitQ: 17.5,

  cardPermission: 20.55,
  pickConfirm: 21.3,
  submitPermission: 21.8,

  openStudy: 23.7,
  chatClosed: 24.0,
  trials: [24.3, 28.8],
} as const;

/** Menu hover path through the sampler list, by option index (see SAMPLERS). */
export const MENU_HOVER: ReadonlyArray<readonly [number, number]> = [
  [14.0, 0],
  [14.3, 1],
  [14.7, 4],
  [15.0, 5],
  [15.35, 0],
];

/**
 * The backend's sampler catalogue (GET /samplers), in its order. The labels
 * are the backend's own and are English in every locale of the app; `budget`
 * is the lower end of each one's recommended trial range.
 */
export const SAMPLERS: ReadonlyArray<{ label: string; budget: number | null }> = [
  { label: 'TPE (Tree-structured Parzen Estimator)', budget: 100 },
  { label: 'CMA-ES (Covariance Matrix Adaptation)', budget: 1000 },
  { label: 'Random', budget: null },
  { label: 'QMC (Quasi-Monte Carlo)', budget: null },
  { label: 'QAOA — Quantum Optimization (emulated)', budget: 50 },
  { label: 'Quantum-Kernel Bayesian Optimization (emulated)', budget: 30 },
];

/**
 * A tool call. `label` is either the app's localized label (an i18n key under
 * fintelligentDemo.app.tools) or, for tools the app has no label for, the
 * de-slugged tool name the app itself falls back to — English everywhere.
 */
export interface ToolStep {
  tool: string;
  labelKey?: string;
  label?: string;
  start: number;
  end: number;
  took: string;
}

export type StatusKey =
  | 'analyzing'
  | 'configuring'
  | 'exploring'
  | 'validating'
  | 'writing'
  | 'running'
  | 'waiting'
  | 'finished';

export interface Turn {
  /** The user's send that opens the turn. */
  start: number;
  /** When the answer settles (live bubble → chips + text). */
  settle: number;
  steps: ToolStep[];
  status: ReadonlyArray<readonly [number, StatusKey]>;
  /** Live narration bursts: [time, key under fintelligentDemo.script]. */
  narration: ReadonlyArray<readonly [number, string]>;
  /** Completed thoughts in the Thinking feed. */
  thoughts: ReadonlyArray<readonly [number, string]>;
  /** The Thinking footer once settled: seconds and tool-call count. */
  summary: { seconds: string; calls: number };
}

const step = (tool: string, start: number, end: number, took: string, labelKey?: string): ToolStep => ({
  tool,
  start,
  end,
  took,
  labelKey,
  label: labelKey ? undefined : tool.charAt(0).toUpperCase() + tool.slice(1).replace(/_/g, ' '),
});

export const TURNS: readonly Turn[] = [
  {
    // Strategy playbook, then the study playbook's reads, ending on the question card.
    start: T.send,
    settle: 11.6,
    steps: [
      step('load_playbook', 5.6, 5.9, '312 ms'),
      step('get_data_source_catalog', 6.2, 6.5, '402 ms'),
      step('list_groupings', 6.5, 6.8, '366 ms'),
      step('preview_validation_fixture', 6.8, 7.2, '451 ms'),
      step('validate_internal_strategy', 7.5, 8.7, '4.8 s'),
      step('get_job', 8.7, 9.0, '284 ms'),
      step('create_strategy', 9.0, 9.5, '612 ms'),
      step('load_playbook', 9.7, 9.95, '298 ms'),
      step('list_asset_groups', 10.1, 10.45, '388 ms'),
      step('list_fitness_functions', 10.1, 10.55, '420 ms', 'listFitness'),
      step('get_strategies_parameters', 10.1, 10.65, '507 ms'),
      step('list_samplers', 10.1, 10.75, '233 ms'),
      step('ui_ask_user', 11.1, 11.5, '96 ms', 'askUser'),
    ],
    status: [
      [5.2, 'analyzing'],
      [5.6, 'configuring'],
      [6.2, 'exploring'],
      [7.5, 'validating'],
      [9.0, 'writing'],
      [9.7, 'configuring'],
      [10.1, 'exploring'],
      [11.6, 'waiting'],
    ],
    narration: [
      [6.2, 'narration.catalog'],
      [7.3, 'narration.draft'],
      [7.6, 'narration.validate'],
      [9.7, 'narration.setup'],
    ],
    thoughts: [
      [6.0, 'thoughts.universe'],
      [7.3, 'thoughts.rules'],
      [10.9, 'thoughts.decisions'],
    ],
    summary: { seconds: '41.6', calls: 13 },
  },
  {
    // Answers in: resolve the universe, size the search, save the draft, ask to spend.
    start: T.submitQ + 0.2,
    settle: 20.5,
    steps: [
      step('derive_asset_group_from_grouping', 18.0, 18.35, '341 ms'),
      step('suggest_study_search_space', 18.35, 18.75, '612 ms'),
      step('get_date_coverage', 18.75, 19.05, '287 ms'),
      step('preview_new_study_cost', 19.05, 19.4, '455 ms'),
      step('create_study', 19.4, 19.9, '903 ms', 'createStudy'),
      step('list_studies', 19.9, 20.15, '198 ms', 'listStudies'),
      step('ui_ask_user', 20.15, 20.45, '88 ms', 'askUser'),
    ],
    status: [
      [17.75, 'analyzing'],
      [18.0, 'configuring'],
      [20.5, 'waiting'],
    ],
    narration: [
      [18.0, 'narration.resolve'],
      [18.4, 'narration.space'],
      [19.1, 'narration.draftStudy'],
    ],
    thoughts: [[18.8, 'thoughts.window']],
    summary: { seconds: '17.3', calls: 7 },
  },
  {
    // Confirmed: launch.
    start: T.submitPermission + 0.15,
    settle: 22.8,
    steps: [step('launch_study', 22.2, 22.6, '1.1 s')],
    status: [
      [22.0, 'analyzing'],
      [22.2, 'running'],
      [22.8, 'finished'],
    ],
    narration: [[22.2, 'narration.launch']],
    thoughts: [],
    summary: { seconds: '3.9', calls: 1 },
  },
];

/**
 * Where the pointer goes: [arrive-by, target]. Targets are `data-demo`
 * attributes on the elements; the pointer eases between consecutive ones.
 * Clicks are separate so a hover can precede one.
 */
export const CURSOR_PATH: ReadonlyArray<readonly [number, string]> = [
  [1.0, 'enter'],
  [1.7, 'pill'],
  [2.25, 'input'],
  [4.6, 'input'],
  [4.95, 'send'],
  [11.8, 'send'],
  [12.8, 'opt-q0-0'],
  [13.3, 'opt-q0-0'],
  [13.9, 'select'],
  [14.05, 'select'],
  [14.3, 'menu-1'],
  [14.7, 'menu-4'],
  [15.0, 'menu-5'],
  [15.35, 'menu-0'],
  [15.7, 'menu-0'],
  [16.7, 'opt-q2-2'],
  [16.9, 'opt-q2-2'],
  [17.4, 'answer'],
  [17.6, 'answer'],
  [20.6, 'answer'],
  [21.2, 'opt-p-0'],
  [21.35, 'opt-p-0'],
  [21.75, 'answer'],
  [21.9, 'answer'],
  [23.6, 'study-link'],
  [23.75, 'study-link'],
  [24.4, 'exit'],
];

export const CLICKS: readonly number[] = [
  T.pillHover + 0.2,
  2.25,
  T.send,
  T.pickObjective,
  T.menuOpen,
  T.menuPick,
  T.pickTrials,
  T.submitQ,
  T.pickConfirm,
  T.submitPermission,
  T.openStudy,
];

export { groupDigits } from '../../lib/groupDigits';

/** 0 → 1 across [a, b], clamped. */
export const span = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
export const ease = (x: number) => x * x * (3 - 2 * x);
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

/** The last entry at or before t, or undefined. */
export const latest = <V>(entries: ReadonlyArray<readonly [number, V]>, t: number): V | undefined => {
  let out: V | undefined;
  for (const [at, v] of entries) if (at <= t) out = v;
  return out;
};

/** The turn whose feed the Thinking panel shows at t. */
export const currentTurn = (t: number): number => {
  let out = -1;
  TURNS.forEach((turn, i) => {
    if (t >= turn.start) out = i;
  });
  return out;
};
