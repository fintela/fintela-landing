import { FlatStage } from '../isoKit/FlatStage';
import { usePlayOnce } from '../isoKit/usePlayOnce';
import { BEATS } from './beats';

const loadScene = () => import('./Scene');

interface CreateAssetGroupProps {
  /** The group's name, through i18next on the landing. */
  label: string;
  /** False shows the finished group and never plays. */
  autoplay?: boolean;
  /** True forces the finished group. The visitor's own setting always applies as well. */
  reducedMotion?: boolean;
}

/**
 * Step 1: a cursor clicks six tickers on a panel, they drop into a box that closes, and
 * the box comes to rest on a card that names the group and previews the six. Plays once
 * when scrolled into view, then stays still.
 */
export const CreateAssetGroup = ({ label, autoplay, reducedMotion }: CreateAssetGroupProps) => {
  const { ref, phase, still, Scene, live } = usePlayOnce({
    beats: BEATS,
    autoplay,
    reducedMotion,
    load: loadScene,
  });

  return (
    <FlatStage ref={ref}>
      {/* Remounting with `initial={false}` paints the settled state with no animation at all. */}
      {Scene && <Scene key={still ? 'still' : 'live'} phase={phase} live={live} label={label} />}
    </FlatStage>
  );
};
