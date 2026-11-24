import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { StrategyBoard } from '../strategies/StrategyBoard';
import { ActivityStrip } from '../strategies/StrategyHighlights';
import { StrategyButton } from '../strategies/StrategyCta';
import { soft } from '../../theme/tokens';
import { STRATEGY_LINKS } from '../../strategies/links';
import { rankStrategies, summarizeActivity } from '../../strategies/ranking';
import type { StrategiesState } from '../../strategies/types';

/**
 * The Community section: header with its two calls to action (publish a
 * strategy, request funding for one), the activity strip, then the grid of
 * strategy cards. Self-contained, so it can head `/community` (`level="h1"`)
 * or sit on another page as an ordinary `h2` section.
 */
export const CommunitySection = ({ state, level = 'h2' }: { state: StrategiesState; level?: 'h1' | 'h2' }) => {
  const { t } = useTranslation('pages');
  const snapshot = state.status === 'ready' ? state.snapshot : null;
  const ranked = useMemo(() => (snapshot ? rankStrategies(snapshot) : []), [snapshot]);
  const activity = useMemo(() => (snapshot ? summarizeActivity(snapshot) : null), [snapshot]);

  return (
    <Section id="community" size="lg">
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', columnGap: 4, rowGap: 3, mb: { xs: 4, md: 5 } }}>
        <Box sx={{ maxWidth: 820, minWidth: 0 }}>
          <SectionHeader
            level={level}
            hero
            align="left"
            eyebrow={t('strategies.eyebrow')}
            title={t('strategies.title')}
            titleAccent={t('strategies.titleAccent')}
            description={t('strategies.description')}
          />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2.5, rowGap: 1 }}>
          <StrategyButton tone="accent" target={STRATEGY_LINKS.create} placement="community_header_publish">
            {t('strategies.cta.publish')}
          </StrategyButton>
          <StrategyButton tone="raised" target={STRATEGY_LINKS.requestFunding} placement="community_header_request_funding">
            {t('strategies.cta.requestFunding')}
          </StrategyButton>
        </Box>
      </Box>

      {state.status === 'loading' && (
        <Typography role="status" sx={{ color: soft.textSecondary }}>
          {t('strategies.loading')}
        </Typography>
      )}
      {state.status === 'error' && (
        <Typography role="alert" sx={{ color: soft.textSecondary }}>
          {t('strategies.error')}
        </Typography>
      )}
      {snapshot && snapshot.strategies.length === 0 && (
        <Typography role="status" sx={{ color: soft.textSecondary, maxWidth: 620 }}>
          {t('strategies.empty')}
        </Typography>
      )}
      {snapshot && snapshot.strategies.length > 0 && activity && (
        <Box sx={{ display: 'grid', gap: { xs: 3.5, md: 4.5 } }}>
          <ActivityStrip activity={activity} />
          <StrategyBoard strategies={ranked} asOf={snapshot.asOf} />
        </Box>
      )}
    </Section>
  );
};
