import { FlatStage } from '../isoKit/FlatStage';
import type { SceneTime } from '../isoKit/timeline';
import { useFlatTimeline } from '../isoKit/useFlatTimeline';
import { TOTAL } from './beats';

const loadScene = () => import('./Scene');

interface CreateInvestingStrategyProps {
  /** Model names on the carousel. Product names, so not translated. */
  names: readonly string[];
  /** Index into `names` of the model the carousel stops on. */
  landOn: number;
  /** The strategy's name, through i18next on the landing. */
  label: string;
  /** What the card shows before it becomes the strategy. Code, so not translated. */
  formula?: string;
  /** A playhead the page moves, such as the scroll. Without one it plays once in view. */
  time?: SceneTime;
  /** False shows the finished card and never plays. */
  autoplay?: boolean;
  /** True forces the finished card. The visitor's own setting always applies as well. */
  reducedMotion?: boolean;
}

/**
 * Step 1: a carousel of models stops on one, whose window opens into an editor where
 * it writes the strategy's code. The code is squeezed into an f(x) box, which opens
 * out as the named strategy. Follows `time` when given; otherwise plays once when
 * scrolled into view, then stays still.
 */
export const CreateInvestingStrategy = ({
  names,
  landOn,
  label,
  formula = 'f(x)',
  time,
  autoplay,
  reducedMotion,
}: CreateInvestingStrategyProps) => {
  const { ref, Scene, time: playhead } = useFlatTimeline({
    total: TOTAL,
    time,
    autoplay,
    reducedMotion,
    load: loadScene,
  });

  return (
    <FlatStage ref={ref}>
      {Scene && (
        <Scene time={playhead} names={names} landOn={landOn} formula={formula} label={label} />
      )}
    </FlatStage>
  );
};
