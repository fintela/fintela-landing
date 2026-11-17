import { FlatStage } from '../isoKit/FlatStage';
import type { SceneTime } from '../isoKit/timeline';
import { useFlatTimeline } from '../isoKit/useFlatTimeline';
import { TOTAL } from './beats';

const loadScene = () => import('./Scene');

interface OptimizeStudyProps {
  /** The study's name, through i18next on the landing. */
  label: string;
  /** The line under the name, such as the trial count, through i18next on the landing. */
  detail: string;
  /** A playhead the page moves, such as the scroll. Without one it plays once in view. */
  time?: SceneTime;
  /** False shows the finished card and never plays. */
  autoplay?: boolean;
  /** True forces the finished card. The visitor's own setting always applies as well. */
  reducedMotion?: boolean;
}

/**
 * Step 2: trials scatter over a heat map and search it, closing in on the optimal zone.
 * The grid is then framed into a box, which comes to rest as the badge on the study's
 * card. Follows `time` when given; otherwise plays once when scrolled into view.
 */
export const OptimizeStudy = ({ label, detail, time, autoplay, reducedMotion }: OptimizeStudyProps) => {
  const { ref, Scene, time: playhead } = useFlatTimeline({
    total: TOTAL,
    time,
    autoplay,
    reducedMotion,
    load: loadScene,
  });

  return (
    <FlatStage ref={ref}>
      {Scene && <Scene time={playhead} label={label} detail={detail} />}
    </FlatStage>
  );
};
