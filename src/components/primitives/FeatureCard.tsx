import { Box, Typography } from '@mui/material';
import { gradients, soft } from '../../theme/tokens';
import { NeuPanel } from './NeuPanel';

interface FeatureCardProps {
  title: string;
  description: string;
}

/** A static feature tile: a raised panel with the gold rule. Not interactive, so no hover. */
export const FeatureCard = ({ title, description }: FeatureCardProps) => (
  <NeuPanel sx={{ height: '100%', p: { xs: 3, md: 3.5 }, display: 'flex', flexDirection: 'column' }}>
    <Box aria-hidden sx={{ width: 28, height: 3, borderRadius: '2px', background: gradients.gold, mb: 2 }} />
    <Typography sx={{ fontWeight: 700, fontSize: '1.02rem', color: soft.text, mb: 0.75, letterSpacing: '-0.01em' }}>
      {title}
    </Typography>
    <Typography sx={{ color: soft.textSecondary, fontSize: '0.92rem', lineHeight: 1.6 }}>{description}</Typography>
  </NeuPanel>
);
