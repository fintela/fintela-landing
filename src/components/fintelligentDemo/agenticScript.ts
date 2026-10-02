/**
 * The Agentic AI page's storyboard: every beat of a 40-second loop, in
 * seconds on the playhead. One message asks for a universe, a strategy and a
 * study; the agent runs the asset-group, strategy and study playbooks the app's
 * prompts direct (services/ai-agent/app/prompts/system/create_asset_group.md,
 * create_strategy.md, create_study.md, mutating_actions.md):
 *
 *   screen the S&P 500 → write the strategy → validation catches a look-ahead
 *   → fix and re-validate → stage both writes on one Confirm card → (confirm)
 *   → design the study, pre-register its pass criteria, quote the spend →
 *   stage create_study with launch → (Save & Launch) → the Thinking panel's
 *   run tracker follows the study to its best trial.
 *
 * Time is compressed, but the order of tools, the Confirm gates and the
 * labels are the app's.
 */
import { step } from './script';
import type { Turn } from './script';

export const LOOP = 40;

/** The frame shown under prefers-reduced-motion: the finished run, its best trial, the pointer on "View study". */
export const STILL = 37.6;

export const CHAPTERS = [
  { key: 'prompt', start: 0, still: 5.6 },
  { key: 'build', start: 5.8, still: 16.7 },
  { key: 'design', start: 17.8, still: 22.1 },
  { key: 'run', start: 23, still: 31 },
] as const;

export const T = {
  fadeIn: [0, 0.35],
  fadeOut: [39.2, 39.8],

  pillHover: 1.25,
  composerOpen: 1.55,
  type: [1.9, 5.45],
  send: 5.8,
  panelOpen: 5.8,
  thinkingIn: 5.95,

  /** The first Confirm card: the asset group and the strategy. */
  card1: 16.0,
  confirm1: 17.1,
  saved1: 17.7,

  /** The second: the study, saved and launched. */
  card2: 21.5,
  confirm2: 22.5,
  launched: 23.0,
} as const;

/** The strategy as the agent writes it: attempt 1 streams, fails, attempt 2 streams the fix. */
export const AUTHORING = {
  start: 9.05,
  code1: [9.05, 10.85],
  validate1: [10.9, 11.8],
  code2: [12.1, 12.7],
  validate2: [12.75, 13.6],
  staged: 15.0,
} as const;

/** The asset group's preview pops in when it is staged. */
export const GROUP_STAGED = 14.7;

/** The study's draft preview, until the launch hands it to the run tracker. */
export const STUDY_STAGED = 20.85;

/**
 * The run, as the tracker reads its lifecycle: queue → prepare (its three
 * stages) → optimize → analyze → finished.
 */
export const RUN = {
  queued: T.launched,
  prepare: [
    [23.7, 'provisioning'],
    [24.3, 'dataLoading'],
    [24.9, 'preflight'],
  ] as ReadonlyArray<readonly [number, string]>,
  optimize: [25.4, 34.6],
  analyze: 34.6,
  done: 35.9,
  trials: 500,
  /** Run seconds shown per playhead second: the six-minute run in thirteen. */
  pace: 28,
} as const;

/** The best trial, as the analysis Overview ranks it on validation. */
export const BEST = {
  trial: 387,
  value: '1.62',
  params: [
    ['lookback', '252'],
    ['skip', '21'],
    ['top_n', '12'],
    ['vol_target', '0.12'],
  ],
} as const;

/** The screen's first five names (their logos pop in), out of the forty. */
export const TICKERS = ['MSFT', 'NVDA', 'GOOGL', 'META', 'V'] as const;
export const GROUP_SIZE = 40;

export const NAMES = {
  group: 'sp500_quality_40',
  strategy: 'quality_momentum_vt',
} as const;

/** The strategy's code: the fix moves volatility onto a rolling window (lines 6 and 11). */
const CODE_HEAD = `def quality_momentum_vt(
    data, start_date, end_date,
    lookback, skip, top_n, vol_target):
    rets = data.pct_change()
    mom = data.shift(skip) / data.shift(lookback)
`;
const CODE_TAIL = `    out = {}
    days = data.loc[start_date:end_date].index
    for ts in days[::21]:
        picks = mom.loc[ts].nlargest(top_n).index
WEIGHTS
        w /= w.sum()
        cov = rets.loc[:ts, picks].tail(63).cov()
        port_vol = np.sqrt(w @ cov @ w * 252)
        w *= min(1.0, vol_target / port_vol)
        out[ts.strftime("%Y-%m-%d")] = {
            str(t): {"position": "L",
                     "allocation": float(w[t])}
            for t in picks}
    return out`;

export const CODE_ATTEMPT_1 =
  CODE_HEAD + '    vol = rets.std() * np.sqrt(252)\n' + CODE_TAIL.replace('WEIGHTS', '        w = 1 / vol[picks]');
export const CODE_ATTEMPT_2 =
  CODE_HEAD +
  '    vol = rets.rolling(63).std() * np.sqrt(252)\n' +
  CODE_TAIL.replace('WEIGHTS', '        w = 1 / vol.loc[ts, picks]');

export const TURNS: readonly Turn[] = [
  {
    // Screen → strategy → validate (fails) → fix → validate → stage both writes.
    start: T.send,
    settle: 15.9,
    steps: [
      step('load_playbook', 6.15, 6.4, '284 ms'),
      step('get_screener_schema', 6.45, 6.75, '322 ms'),
      step('preview_screener_matches', 6.8, 7.25, '611 ms'),
      step('preview_screener_matches', 7.3, 7.7, '574 ms'),
      step('browse_screener_matches', 7.75, 8.1, '488 ms'),
      step('resolve_ticker_symbols', 8.1, 8.4, '356 ms'),
      step('get_data_source_catalog', 8.45, 8.7, '402 ms'),
      step('preview_validation_fixture', 8.7, 9.0, '451 ms'),
      step('validate_internal_strategy', AUTHORING.validate1[0], 11.5, '5.2 s'),
      step('get_job', 11.5, AUTHORING.validate1[1], '1.9 s'),
      step('validate_internal_strategy', AUTHORING.validate2[0], 13.3, '4.9 s'),
      step('get_job', 13.3, AUTHORING.validate2[1], '1.7 s'),
      step('create_asset_group', GROUP_STAGED, 15.0, '118 ms'),
      step('create_strategy', AUTHORING.staged, 15.3, '131 ms'),
    ],
    status: [
      [5.95, 'analyzing'],
      [6.45, 'exploring'],
      [AUTHORING.code1[0], 'writing'],
      [AUTHORING.validate1[0], 'validating'],
      [AUTHORING.code2[0], 'writing'],
      [AUTHORING.validate2[0], 'validating'],
      [14.0, 'configuring'],
      [15.9, 'confirm'],
    ],
    narration: [
      [6.45, 'narration.screen'],
      [8.45, 'narration.draft'],
      [AUTHORING.validate1[0], 'narration.validate'],
      [11.85, 'narration.fix'],
      [13.65, 'narration.stage'],
    ],
    thoughts: [
      [7.28, 'thoughts.screen'],
      [9.0, 'thoughts.design'],
      [11.85, 'thoughts.leak'],
      [14.2, 'thoughts.batch'],
    ],
    summary: { seconds: '58.4', calls: 14 },
  },
  {
    // Confirmed: design the study, pre-register, quote, stage create_study with launch.
    start: 17.8,
    settle: 21.4,
    steps: [
      step('list_fitness_functions', 18.05, 18.35, '402 ms', 'listFitness'),
      step('list_samplers', 18.05, 18.4, '233 ms'),
      step('get_date_coverage', 18.45, 18.75, '287 ms'),
      step('suggest_study_search_space', 18.8, 19.3, '644 ms'),
      step('preview_new_study_cost', 20.3, 20.65, '455 ms'),
      step('create_study', 20.7, 21.0, '903 ms', 'createStudy'),
    ],
    status: [
      [17.85, 'analyzing'],
      [18.05, 'configuring'],
      [18.45, 'exploring'],
      [19.35, 'configuring'],
      [21.4, 'confirm'],
    ],
    narration: [
      [18.05, 'narration.design'],
      [18.8, 'narration.space'],
      [20.3, 'narration.cost'],
    ],
    thoughts: [
      [18.78, 'thoughts.windows'],
      [19.35, 'thoughts.sampler'],
      [19.9, 'thoughts.criteria'],
    ],
    summary: { seconds: '24.1', calls: 6 },
  },
  {
    // Launched: check it picked up a worker.
    start: 23.1,
    settle: 24.3,
    steps: [step('get_study_status', 23.4, 23.8, '312 ms', 'studyStatus')],
    status: [
      [23.15, 'analyzing'],
      [23.4, 'running'],
      [24.3, 'finished'],
    ],
    narration: [[23.4, 'narration.launch']],
    thoughts: [],
    summary: { seconds: '4.2', calls: 1 },
  },
];

/**
 * Where the pointer goes: [arrive-by, target]. Targets are `data-demo`
 * attributes on the elements; a target that has left the screen (a decided
 * Confirm card) holds the pointer where it was.
 */
export const CURSOR_PATH: ReadonlyArray<readonly [number, string]> = [
  [0.6, 'enter'],
  [1.2, 'pill'],
  [1.8, 'input'],
  [5.4, 'input'],
  [5.75, 'send'],
  [16.2, 'send'],
  [16.95, 'confirm-1'],
  [17.25, 'confirm-1'],
  [21.7, 'confirm-1'],
  [22.35, 'confirm-2'],
  [22.65, 'confirm-2'],
  [24.0, 'tracker'],
  [36.6, 'tracker'],
  [37.3, 'view-study'],
  [37.9, 'view-study'],
  [38.6, 'exit'],
];

export const CLICKS: readonly number[] = [T.pillHover + 0.2, 1.85, T.send, T.confirm1, T.confirm2];
