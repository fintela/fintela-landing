import { FlatStage } from '../isoKit/FlatStage';
import { usePlayOnce } from '../isoKit/usePlayOnce';
import { BEATS } from './beats';

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
  /** False shows the finished report and never plays. */
  autoplay?: boolean;
  /** True forces the finished report. The visitor's own setting always applies as well. */
  reducedMotion?: boolean;
}

/**
 * Step 3: a study report. The best in-sample trial and a steadier candidate are drawn across
 * the train, validation and out-of-sample windows; the first falls once it meets held-out
 * data. Overfitting statistics then tick in and a verdict is stamped. Plays once when
 * scrolled into view, then stays still.
 */
export const ValidateStudy = ({ autoplay, reducedMotion, ...copy }: ValidateStudyProps) => {
  const { ref, phase, still, Scene } = usePlayOnce({
    beats: BEATS,
    autoplay,
    reducedMotion,
    load: loadScene,
  });

  return (
    <FlatStage ref={ref}>
      {Scene && <Scene key={still ? 'still' : 'live'} phase={phase} {...copy} />}
    </FlatStage>
  );
};
