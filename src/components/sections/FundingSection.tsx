import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { StrategyArrowLink, StrategyButton } from '../strategies/StrategyCta';
import { fonts, soft } from '../../theme/tokens';
import { FUNDING_ANCHOR, STRATEGY_LINKS } from '../../strategies/links';

/** Publish, evaluation, fund allocation: a real sequence, so it is numbered. */
const STEP_KEYS = ['publish', 'evaluation', 'allocation'] as const;
const FACT_KEYS = ['terms', 'capital'] as const;

/**
 * Fintela Funding: the invitation that follows the board. Three steps, the
 * two conditions (negotiated terms, third-party capital) and
 * the calls to action. The copy promises no funding, names no fund and quotes
 * no amount.
 */
export const FundingSection = () => {
  const { t } = useTranslation('pages');
  return (
    // scrollMarginTop clears the sticky header when the "Get it funded" link jumps here.
    <Section id={FUNDING_ANCHOR} size="lg" sx={{ scrollMarginTop: 72 }}>
      <Box sx={{ maxWidth: 820 }}>
        <SectionHeader
          hero
          align="left"
          eyebrow={t('strategies.funding.eyebrow')}
          title={t('strategies.funding.title')}
          titleAccent={t('strategies.funding.titleAccent')}
          description={t('strategies.funding.description')}
        />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2.5, rowGap: 1.5, mt: { xs: 3, md: 4 } }}>
        <StrategyButton tone="accent" target={STRATEGY_LINKS.create} placement="funding_create">
          {t('strategies.funding.cta.create')}
        </StrategyButton>
        <StrategyButton tone="raised" target={STRATEGY_LINKS.import} placement="funding_import">
          {t('strategies.funding.cta.import')}
        </StrategyButton>
        <StrategyArrowLink target={STRATEGY_LINKS.applyForFunding} placement="funding_apply">
          {t('strategies.funding.cta.apply')}
        </StrategyArrowLink>
      </Box>

      <Box
        component="ol"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          mt: { xs: 5, md: 7 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: { xs: 2, md: 2.5 },
        }}
      >
        {STEP_KEYS.map((key, i) => (
          <Box component="li" key={key} sx={{ minWidth: 0 }}>
            <AnimateOnScroll delay={i * 80} stretch>
              <NeuPanel variant="tile" sx={{ height: '100%', p: { xs: 2.5, md: 3 }, display: 'grid', gap: 1, alignContent: 'start' }}>
                <Typography component="span" sx={{ fontFamily: fonts.mono, fontSize: '0.8rem', color: soft.textSecondary }}>
                  {String(i + 1).padStart(2, '0')}
                </Typography>
                <Typography component="h3" sx={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', color: soft.text }}>
                  {t(`strategies.funding.steps.items.${key}.title`)}
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: soft.textSecondary }}>
                  {t(`strategies.funding.steps.items.${key}.body`)}
                </Typography>
              </NeuPanel>
            </AnimateOnScroll>
          </Box>
        ))}
      </Box>

      <Box
        component="ul"
        role="list"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          mt: { xs: 5, md: 7 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          columnGap: 5,
          rowGap: 3.5,
        }}
      >
        {FACT_KEYS.map((key, i) => (
          <Box component="li" key={key} sx={{ minWidth: 0 }}>
            <AnimateOnScroll delay={i * 60} stretch>
              <Box sx={{ height: '100%', borderTop: `1px solid ${soft.text}`, pt: 2.5 }}>
                <Typography component="h3" sx={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, color: soft.text, mb: 1 }}>
                  {t(`strategies.funding.facts.${key}.title`)}
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: soft.textSecondary }}>
                  {t(`strategies.funding.facts.${key}.body`)}
                </Typography>
              </Box>
            </AnimateOnScroll>
          </Box>
        ))}
      </Box>

      <Typography sx={{ mt: { xs: 4, md: 5 }, fontSize: '0.8rem', lineHeight: 1.6, color: soft.textSecondary, maxWidth: '84ch' }}>
        {t('strategies.funding.fine')}
      </Typography>
    </Section>
  );
};
