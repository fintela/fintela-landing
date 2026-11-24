import { Box } from '@mui/material';
import { palette, soft } from '../../theme/tokens';

const WIDTH = 112;
const HEIGHT = 30;
const PAD_X = 3;
const PAD_Y = 4;

/**
 * A strategy's cumulative return since publication. One scale places the
 * curve, the dashed zero line and the endpoint. Ink when the strategy is up,
 * the P&L red when it is down.
 */
export const Sparkline = ({ values, label }: { values: number[]; label: string }) => {
  if (values.length < 2) return null;
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const span = high - low || 1;
  const x = (i: number) => PAD_X + (i * (WIDTH - 2 * PAD_X)) / (values.length - 1);
  const y = (v: number) => PAD_Y + ((high - v) * (HEIGHT - 2 * PAD_Y)) / span;
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values.length - 1;
  const zero = y(0).toFixed(1);
  const down = values[last] < 0;

  return (
    <Box
      component="svg"
      role="img"
      aria-label={label}
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      sx={{ display: 'block', color: down ? palette.redDeep : soft.text }}
    >
      <line x1={PAD_X} x2={WIDTH - PAD_X} y1={zero} y2={zero} stroke={palette.borderStrong} strokeWidth={1} strokeDasharray="2 3" />
      <polygon points={`${x(0).toFixed(1)},${zero} ${points} ${x(last).toFixed(1)},${zero}`} fill="currentColor" fillOpacity={0.07} />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last).toFixed(1)} cy={y(values[last]).toFixed(1)} r={2.4} fill="currentColor" />
    </Box>
  );
};
