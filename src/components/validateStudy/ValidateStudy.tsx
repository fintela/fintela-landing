import { FlatStage } from '../isoKit/FlatStage';
import type { SceneTime } from '../isoKit/timeline';
import { useFlatTimeline } from '../isoKit/useFlatTimeline';
import { TOTAL } from './beats';

const loadScene = () => import('./Scene');

export interface ValidateCopy {
  title: string;
  train: string;
  validation: string;
  oos: string;
  best: string;
  robust: string;
  interval: string;
  /** Three statistics, each a label and its figure. Figures are illustrative. */
  stats: readonly { label: string; value: string }[];
  verdict: string;
}

interface ValidateStudyProps extends ValidateCopy {
  /** A playhead the page moves, such as the scroll. Without one it plays once in view. */
  time?: SceneTime;
  /** False shows the finished report and never plays. */
  autoplay?: boolean;
  /** True forces the finished report. The visitor's own setting always applies as well. */
  reducedMotion?: boolean;
}

/**
 * Step 3: a study report. The best in-sample trial and a steadier candidate are drawn across
 * the train, validation and out-of-sample windows; the first falls once it meets held-out
 * data. Overfitting statistics then tick in and a verdict is stamped. Follows `time` when
 * given; otherwise plays once when scrolled into view, then stays still.
 */
export const ValidateStudy = ({ time, autoplay, reducedMotion, ...copy }: ValidateStudyProps) => {
  const { ref, Scene, time: playhead } = useFlatTimeline({
    total: TOTAL,
    time,
    autoplay,
    reducedMotion,
    load: loadScene,
  });

  return <FlatStage ref={ref}>{Scene && <Scene time={playhead} {...copy} />}</FlatStage>;
};
