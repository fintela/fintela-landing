// Shared content for the "optimizer / trial & study lifecycle" concept block.
import type { LifecycleContent } from '../types';

export const optimizerLifecycle: LifecycleContent = {
  summary:
    'State machine for studies and trials: QUEUED → RUNNING → COMPLETED / FAILED / PRUNED. Studies can be paused, resumed, and stopped at any point.',

  full: [
    'Both studies and individual trials follow a deterministic state machine. Understanding the state transitions helps you interpret the progress API and build reliable polling logic.',
    'A study reaches COMPLETED when it hits n_trials — or earlier, when its search space is finite (only integer, categorical, or fixed parameters, plus floats with a grid precision) and every distinct combination has been evaluated. A grid-exhausted study is COMPLETED with fewer completed trials than n_trials; polling logic should treat status, not progress reaching 1.0, as the completion signal.',
  ],

  // appliesTo + meaning are the authoritative (landing) descriptions; color is
  // the app tree's status-badge hint.
  states: [
    { state: 'QUEUED', appliesTo: 'Study · Trial', meaning: 'Waiting for an optimizer worker to pick it up', color: '#64748B' },
    { state: 'RUNNING', appliesTo: 'Study · Trial', meaning: 'Actively being evaluated — strategy called, fitness scored', color: '#3B82F6' },
    { state: 'COMPLETED', appliesTo: 'Study · Trial', meaning: 'Finished successfully; results available', color: '#22C55E' },
    { state: 'FAILED', appliesTo: 'Study · Trial', meaning: 'Unrecoverable error — see failure_reason on the trial', color: '#EF4444' },
    { state: 'PRUNED', appliesTo: 'Trial', meaning: 'Sampler or autostop early-terminated this parameter set', color: '#F59E0B' },
    { state: 'PAUSED', appliesTo: 'Study', meaning: 'Manually paused; can be resumed from the study page in the app', color: '#8B5CF6' },
    { state: 'STOPPED', appliesTo: 'Study', meaning: 'Manually stopped; cannot be resumed', color: '#6B7280' },
  ],

  tip:
    'Train fitness drives the optimizer: the train-window fitness value is the one the search algorithm maximizes — it is what steers which parameter regions to explore next. Validation, overall, and OOS values are stored for post-hoc analysis only.',

  compact:
    'Studies and trials follow a state machine: QUEUED → RUNNING → COMPLETED. Studies can also be PAUSED (resumable) or STOPPED (terminal); trials can be PRUNED early by the sampler.',

  inline:
    'State machine: QUEUED → RUNNING → COMPLETED / FAILED / PRUNED. Studies can also be paused and resumed.',
};
