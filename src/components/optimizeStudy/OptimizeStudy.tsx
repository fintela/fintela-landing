import { FlatStage } from '../isoKit/FlatStage';
import { usePlayOnce } from '../isoKit/usePlayOnce';
import { BEATS } from './beats';

const loadScene = () => import('./Scene');

interface OptimizeStudyProps {
  /** The study's name, through i18next on the landing. */
  label: string;
  /** The line under the name, such as the trial count, through i18next on the landing. */
  detail: string;
  /** False shows the finished card and never plays. */
  autoplay?: boolean;
  /** True forces the finished card. The visitor's own setting always applies as well. */
  reducedMotion?: boolean;
}

/**
 * Step 3: trials scatter over a heat map and search it, closing in on the optimal zone.
 * The grid is then framed into a box, which comes to rest as the badge on the study's
 * card. Plays once when scrolled into view, then stays still.
 */
export const OptimizeStudy = ({ label, detail, autoplay, reducedMotion }: OptimizeStudyProps) => {
  const { ref, phase, still, Scene } = usePlayOnce({
    beats: BEATS,
    autoplay,
    reducedMotion,
    load: loadScene,
  });

  return (
    <FlatStage ref={ref}>
      {/* Remounting with `initial={false}` paints the settled state with no animation at all. */}
      {Scene && (
        <Scene key={still ? 'still' : 'live'} phase={phase} label={label} detail={detail} />
      )}
    </FlatStage>
  );
};
