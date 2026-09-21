import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuButton } from '../primitives/NeuButton';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { fonts, gradients, palette, soft } from '../../theme/tokens';
import laptopFrame from '../../assets/media/agentic/laptop-frame.webp';
import fintelaMark from '../../assets/logos/fintela_logo_1.jpg';

const STEP_KEYS = ['model', 'score', 'allocation', 'backtest'] as const;

/**
 * The laptop photo's screen inset, measured in the source file (1050x700):
 * x 250-793, y 151-485. Percentages so the overlay tracks the <img> at any
 * rendered width.
 */
const SCREEN_RECT = {
  left: (250 / 1050) * 100,
  top: (151 / 700) * 100,
  width: ((793 - 250) / 1050) * 100,
  height: ((485 - 151) / 700) * 100,
};

/**
 * Band: the Agentic AI hero. The laptop mockup of the step builder sits on
 * the left; the "Agentic AI" pitch (shared with FintelligentSection's old
 * header) and its CTAs sit on the right.
 */
export const AlgoAgentBuilder = () => {
  const { t } = useTranslation('home');
  const [step, setStep] = useState(0);

  return (
    <Section id="algo-agent-builder" size="lg" sx={{ pb: { xs: 4, md: 6 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 8fr) minmax(0, 4fr)' },
          gridTemplateRows: { xs: 'repeat(4, auto)', md: 'auto auto' },
          columnGap: { xs: 0, md: 4 },
          rowGap: { xs: 3, md: 0 },
          alignItems: 'center',
        }}
      >
        <Box sx={{ gridColumn: '1', gridRow: '1' }}>
          <AnimateOnScroll direction="left" stretch>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 980,
                ml: { xs: 'auto', md: -6 },
                mr: 'auto',
              }}
            >
              <Box
                component="img"
                src={laptopFrame}
                alt=""
                aria-hidden
                sx={{ display: 'block', width: '100%', height: 'auto' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: `${SCREEN_RECT.left}%`,
                  top: `${SCREEN_RECT.top}%`,
                  width: `${SCREEN_RECT.width}%`,
                  height: `${SCREEN_RECT.height}%`,
                  overflow: 'hidden',
                  bgcolor: soft.white,
                  borderRadius: '2px',
                }}
                role="img"
                aria-label={t('algoAgentBuilder.deviceAlt')}
              >
                <BuilderScreen step={step} />
              </Box>
            </Box>
          </AnimateOnScroll>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', md: '2' }, gridRow: { xs: '2', md: '1' } }}>
          <AnimateOnScroll delay={80} direction="right">
            <SectionHeader
              align="left"
              gutter={false}
              eyebrow={t('fintelAgent.eyebrow')}
              title={t('fintelAgent.title')}
              titleAccent={t('fintelAgent.titleAccent')}
              description={t('fintelAgent.description')}
            />
          </AnimateOnScroll>
        </Box>

        {/* Row 2: the step nav sits at the same height as the CTA row beside it. */}
        <Box sx={{ gridColumn: '1', gridRow: { xs: '3', md: '2' } }}>
          <Box sx={{ maxWidth: 980, ml: { xs: 'auto', md: -6 }, mr: 'auto' }}>
            <StepNav step={step} setStep={setStep} />
          </Box>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', md: '2' }, gridRow: { xs: '4', md: '2' } }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <NeuButton tone="raised" to="/docs/fintelligent" endIcon={<ArrowForwardIcon />}>
              {t('fintelligent.exit')}
            </NeuButton>
            <NeuButton tone="accent" endIcon={<ArrowForwardIcon />}>
              {t('algoAgentBuilder.tryIt')}
            </NeuButton>
          </Box>
        </Box>
      </Box>
    </Section>
  );
};

interface BuilderScreenProps {
  step: number;
}

interface StepNavProps {
  step: number;
  setStep: (step: number) => void;
}

/** Fintela's own palette/type — this mockup reads as the real product, not a demo skin. */
const look = {
  bg: soft.white,
  panel: soft.ground,
  border: palette.border,
  accent: soft.accent,
  accentSoft: 'rgba(26, 26, 26, 0.06)',
  text: soft.text,
  textSecondary: soft.textSecondary,
};

const BuilderScreen = ({ step }: BuilderScreenProps) => {
  const { t } = useTranslation('home');
  const base = `algoAgentBuilder.steps.${STEP_KEYS[step]}`;
  const tags = t(`${base}.tags`, { returnObjects: true }) as string[];
  const bullets = t(`${base}.bullets`, { returnObjects: true }) as string[];

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: fonts.sans,
        color: look.text,
        bgcolor: look.bg,
        p: '2.6%',
        boxSizing: 'border-box',
        fontSize: 'clamp(4px, 1.4vw, 8px)',
      }}
    >
      {/* Top row: two-column preview / details */}
      <Box sx={{ display: 'flex', gap: '2%', flex: 1, minHeight: 0 }}>
        {/* Left: chat preview */}
        <Box
          sx={{
            flex: '0 1 52%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: look.panel,
            border: `1px solid ${look.border}`,
            borderRadius: '6px',
            p: '6%',
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6%',
              mb: '6%',
            }}
          >
            <Box
              role="img"
              aria-label="Fintela"
              sx={{
                width: '14%',
                aspectRatio: '1 / 1',
                borderRadius: '999px',
                bgcolor: soft.white,
                border: `1px solid ${look.border}`,
                backgroundImage: `url(${fintelaMark})`,
                backgroundSize: '64%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                flexShrink: 0,
              }}
            />
            <Typography
              component="p"
              sx={{
                fontSize: '1.15em',
                lineHeight: 1.45,
                color: look.text,
                m: 0,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {t(`${base}.chatText`)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4%', mb: 'auto' }}>
            {tags.map((tag) => (
              <Box
                key={tag}
                sx={{
                  px: '2.2%',
                  py: '1%',
                  borderRadius: '999px',
                  bgcolor: soft.surfaceRaised,
                  border: `1px solid ${look.border}`,
                  color: look.text,
                  fontSize: '0.95em',
                  fontFamily: fonts.mono,
                  whiteSpace: 'nowrap',
                }}
              >
                {tag}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right: step details */}
        <Box sx={{ flex: '0 1 48%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography
            component="p"
            sx={{ m: 0, fontSize: '1em', color: palette.goldDeep, fontFamily: fonts.mono, mb: '4%', fontWeight: 700 }}
          >
            {t('algoAgentBuilder.stepLabel', { num: String(step + 1).padStart(2, '0') })}
          </Typography>
          <Typography
            component="h3"
            sx={{ m: 0, fontSize: '1.5em', fontWeight: 800, lineHeight: 1.25, color: look.text, mb: '4%' }}
          >
            {t(`${base}.header`)}
          </Typography>
          <Typography
            component="p"
            sx={{
              m: 0,
              fontSize: '1.05em',
              lineHeight: 1.5,
              color: look.textSecondary,
              mb: '5%',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {t(`${base}.description`)}
          </Typography>
          <Box
            sx={{
              bgcolor: look.panel,
              border: `1px solid ${look.border}`,
              borderRadius: '6px',
              p: '5%',
              display: 'flex',
              flexDirection: 'column',
              gap: '4%',
              flex: 1,
              minHeight: 0,
            }}
          >
            {bullets.map((bullet) => (
              <Box key={bullet} sx={{ display: 'flex', alignItems: 'flex-start', gap: '4%' }}>
                <Box
                  sx={{
                    width: '5%',
                    aspectRatio: '1 / 1',
                    borderRadius: '999px',
                    background: gradients.gold,
                    mt: '0.5em',
                    flexShrink: 0,
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.98em',
                    lineHeight: 1.4,
                    color: look.textSecondary,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {bullet}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * The step tabs, rendered at real page scale below the laptop mockup rather
 * than shrunk to fit its screen. Clicking a tab selects that step directly,
 * so no separate back/continue controls are needed.
 */
const StepNav = ({ step, setStep }: StepNavProps) => {
  const { t } = useTranslation('home');

  return (
    <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap' }}>
      {STEP_KEYS.map((key, idx) => (
        <Box
          key={key}
          component="button"
          onClick={() => setStep(idx)}
          sx={{
            appearance: 'none',
            cursor: 'pointer',
            bgcolor: idx === step ? look.accentSoft : 'transparent',
            border: `1px solid ${idx === step ? look.accent : look.border}`,
            borderRadius: '999px',
            color: idx === step ? look.text : look.textSecondary,
            fontWeight: idx === step ? 700 : 600,
            fontSize: '0.85rem',
            fontFamily: fonts.sans,
            px: 2,
            py: 1,
            whiteSpace: 'nowrap',
            transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
          }}
        >
          {t(`algoAgentBuilder.steps.${key}.navLabel`)}
        </Box>
      ))}
    </Box>
  );
};
