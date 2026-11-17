import { FlatStage } from '../isoKit/FlatStage';
import { usePlayOnce } from '../isoKit/usePlayOnce';
import { BEATS } from './beats';

const loadScene = () => import('./Scene');

interface LaunchToLiveProps {
  /** Names on the selector. Translate any that are not brand names. */
  brokers: readonly string[];
  /** Index into `brokers` of the one the selector stops on. */
  landOn: number;
  /** The chip on the portfolio card, through i18next on the landing. */
  liveLabel: string;
  /** The label over the accumulated return, through i18next on the landing. */
  returnLabel: string;
  /** The label over the Sharpe ratio, through i18next on the landing. */
  sharpeLabel: string;
  /** Formats the figures and names the months on the axis. `i18n.language` on the landing. */
  locale: string;
  /** False shows the finished card, without ambient motion, and never plays. */
  autoplay?: boolean;
  /** True forces the finished card. The visitor's own setting always applies as well. */
  reducedMotion?: boolean;
}

/**
 * Step 4: the selector spins, slows and stops on a broker, and its window grows into a
 * portfolio card whose line draws upward, its return and Sharpe counting with the pen
 * and its months rolling out along the axis. Plays once when scrolled into view; the end
 * of the line then pulses and the Sharpe ticks while it is on screen.
 */
export const LaunchToLive = ({
  brokers,
  landOn,
  liveLabel,
  returnLabel,
  sharpeLabel,
  locale,
  autoplay,
  reducedMotion,
}: LaunchToLiveProps) => {
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
          still={still}
          live={live}
          brokers={brokers}
          landOn={landOn}
          liveLabel={liveLabel}
          returnLabel={returnLabel}
          sharpeLabel={sharpeLabel}
          locale={locale}
        />
      )}
    </FlatStage>
  );
};
