import { FlatStage } from '../isoKit/FlatStage';
import { usePlayOnce } from '../isoKit/usePlayOnce';
import { BEATS } from './beats';

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
  /** False shows the finished card and never plays. */
  autoplay?: boolean;
  /** True forces the finished card. The visitor's own setting always applies as well. */
  reducedMotion?: boolean;
}

/**
 * Step 2: a carousel of models stops on one, whose window opens into an editor where
 * it writes the strategy's code. The code is squeezed into an f(x) box, which opens
 * out as the named strategy. Plays once when scrolled into view, then stays still.
 */
export const CreateInvestingStrategy = ({
  names,
  landOn,
  label,
  formula = 'f(x)',
  autoplay,
  reducedMotion,
}: CreateInvestingStrategyProps) => {
  const { ref, phase, still, live, Scene } = usePlayOnce({
    beats: BEATS,
    autoplay,
    reducedMotion,
    load: loadScene,
  });

  return (
    <FlatStage ref={ref}>
      {/* Remounting with `initial={false}` paints the settled state with no animation at all. */}
      {Scene && (
        <Scene
          key={still ? 'still' : 'live'}
          phase={phase}
          live={live}
          names={names}
          landOn={landOn}
          formula={formula}
          label={label}
        />
      )}
    </FlatStage>
  );
};
