/**
 * The hero chat's four storyboards. A visitor picks a question and its flow
 * plays on a clock that starts at the send; every row the transcript draws is
 * a pure function of that clock (seconds), the way the Fintelligent demos are
 * a function of their playhead. Nothing here is interactive beyond the pick:
 * the Confirm card confirms itself at `click`, standing in for the click the
 * product asks of a person.
 */

export type FlowId = 'strategy' | 'group' | 'study' | 'portfolio';

/** The order the starter cards and the chips list them in. */
export const FLOWS: readonly FlowId[] = ['strategy', 'group', 'study', 'portfolio'];

/** Narration bursts: [time, key under homeChat.narration.<flow>]; the live row shows the latest until `stage`. */
type Narration = ReadonlyArray<readonly [number, string]>;

/** Build a strategy: it writes the code live, validates, stages a Confirm card, saves. */
export const STRATEGY = {
  narration: [
    [0.9, 'read'],
    [1.9, 'write'],
    [5.0, 'validate'],
    [6.0, 'stage'],
  ] as Narration,
  /** The code streams into the preview card, which appears with it. */
  write: [1.9, 5.0],
  validate: [5.0, 6.2],
  /** The live row gives way to the answer and the Confirm card. */
  stage: 6.4,
  click: 8.6,
  saved: 9.8,
  final: 10.1,
  end: 10.5,
} as const;

/** Make an asset group: screen, rank, preview the names, stage, save. */
export const GROUP = {
  narration: [
    [0.9, 'screen'],
    [2.9, 'rank'],
    [4.4, 'stage'],
  ] as Narration,
  /** The first tickers pop into the preview while it ranks. */
  preview: 3.9,
  stage: 5.2,
  click: 7.4,
  saved: 8.6,
  final: 8.9,
  end: 9.3,
} as const;

/** Send a study: design, price it, confirm, then the run tracker streams it to its best trial. */
export const STUDY = {
  narration: [
    [0.9, 'design'],
    [2.5, 'space'],
    [3.7, 'cost'],
  ] as Narration,
  stage: 4.7,
  click: 7.1,
  /** Confirmed: the receipt lands and the tracker queues the run. */
  launched: 8.1,
  prepare: [
    [9.1, 'provisioning'],
    [9.6, 'dataLoading'],
    [10.1, 'preflight'],
  ] as ReadonlyArray<readonly [number, string]>,
  optimize: [10.6, 14.6],
  analyze: 14.6,
  done: 15.8,
  final: 16.1,
  end: 16.5,
  trials: 500,
  /** Run seconds shown per clock second: a three-and-a-half-minute run in eight. */
  pace: 28,
} as const;

/** Ask about a deployed portfolio: find it, read it, answer in a streamed paragraph and a table. */
export const PORTFOLIO = {
  narration: [
    [0.9, 'find'],
    [2.1, 'read'],
  ] as Narration,
  settle: 3.3,
  summary: [3.3, 5.5],
  table: 5.7,
  outlook: [6.1, 8.5],
  end: 8.8,
} as const;

/** Clock seconds at which each flow has said everything it will say. */
export const END: Record<FlowId, number> = {
  strategy: STRATEGY.end,
  group: GROUP.end,
  study: STUDY.end,
  portfolio: PORTFOLIO.end,
};
