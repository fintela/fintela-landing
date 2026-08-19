import { useState } from 'react';
import { Box, Button, Chip, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { GradientText } from '../components/primitives/GradientText';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { gradients, palette, shadows } from '../theme/tokens';

const APP_URL = 'https://app.fintela.io';

/** One purchasable pack: the tokens it credits, and what it costs in USD. */
type Pack = { tokens: number; priceUsd: number };

/**
 * The published pack prices — the only hard numbers on this page.
 *
 * Everything else shown (effective rate, volume discount, how many trials a pack
 * buys) is derived from these two fields at render time, so the arithmetic can
 * never drift out of sync with a price change.
 */
const COMPUTE_PACKS: readonly Pack[] = [
  { tokens: 1_000, priceUsd: 50 },
  { tokens: 5_000, priceUsd: 225 },
  { tokens: 20_000, priceUsd: 800 },
  { tokens: 100_000, priceUsd: 3_500 },
];

const AI_PACKS: readonly Pack[] = [
  { tokens: 1_000, priceUsd: 49 },
  { tokens: 5_000, priceUsd: 149 },
  { tokens: 20_000, priceUsd: 399 },
];

/** What each metered action costs, in Fintela tokens. */
const TRIAL_COST = 0.3;
const BUG_TEST_COST = 1;

/** Rates are quoted per this many tokens — 1,000 keeps every tier exact. */
const RATE_UNIT = 1_000;

const ratePerUnit = (pack: Pack) => (pack.priceUsd / pack.tokens) * RATE_UNIT;

/** Discount against the entry pack, which sets the list rate for its balance. */
const savingsPercent = (pack: Pack, base: Pack) =>
  Math.round((1 - ratePerUnit(pack) / ratePerUnit(base)) * 100);

const money = (lng: string, value: number) =>
  new Intl.NumberFormat(lng, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const count = (lng: string, value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat(lng, { maximumFractionDigits }).format(value);

interface PackCardProps {
  pack: Pack;
  /** Entry pack of the same balance — the baseline the discount is measured from. */
  base: Pack;
  unitLabel: string;
  accent: string;
  /** Marks the cheapest per-token pack of its group. */
  featured?: boolean;
  /** Optional line spelling out what the pack buys in platform actions. */
  equivalent?: string;
}

const PackCard = ({
  pack,
  base,
  unitLabel,
  accent,
  featured = false,
  equivalent,
}: PackCardProps) => {
  const { t, i18n } = useTranslation('pages');
  const lng = i18n.language;
  const saved = savingsPercent(pack, base);

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 3, md: 3.5 },
        bgcolor: '#fff',
        border: '1px solid',
        borderColor: featured ? `${accent}59` : 'divider',
        borderRadius: 3,
        boxShadow: featured ? shadows.lg : 'none',
        overflow: 'hidden',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 80% at 100% 0%, ${accent}0d 0%, transparent 60%)`,
          opacity: featured ? 1 : 0,
          transition: 'opacity 0.22s ease',
          pointerEvents: 'none',
        },
        '&:hover': {
          borderColor: `${accent}66`,
          boxShadow: `0 4px 14px ${accent}1a`,
          transform: 'translateY(-2px)',
          '&::before': { opacity: 1 },
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* The badge gets a row of its own — reserved on every card, filled on one.
            Sharing a row with the label made the label wrap once the translated
            badge grew ("Best rate" → "Mejor tarifa"), which knocked this card's
            whole body out of line with its neighbours. */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', minHeight: 22, mb: 1 }}>
          {featured && (
            <Chip
              size="small"
              label={t('pricing.packs.bestRate')}
              sx={{
                height: 22,
                fontSize: '0.68rem',
                background: gradients.brand,
                color: '#fff',
              }}
            />
          )}
        </Box>

        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'text.disabled',
            mb: 1,
          }}
        >
          {unitLabel}
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: '1.75rem', md: '2rem' },
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'text.primary',
            lineHeight: 1.1,
          }}
        >
          {count(lng, pack.tokens)}
        </Typography>

        <Typography
          sx={{
            mt: 1.75,
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'text.primary',
            letterSpacing: '-0.02em',
          }}
        >
          {money(lng, pack.priceUsd)}
        </Typography>

        <Typography sx={{ mt: 0.75, fontSize: '0.86rem', color: 'text.secondary' }}>
          {t('pricing.packs.rate', {
            price: money(lng, ratePerUnit(pack)),
            amount: count(lng, RATE_UNIT),
          })}
        </Typography>

        {/* The entry pack sets the baseline, so it has no discount to show. Its
            chip is still laid out — hidden, not removed — so the divider and the
            body copy below line up across every card in the row. */}
        <Box sx={{ mt: 1, visibility: saved > 0 ? 'visible' : 'hidden' }}>
          <Chip
            size="small"
            label={t('pricing.packs.save', { percent: count(lng, saved > 0 ? saved : 0) })}
            sx={{
              height: 20,
              fontSize: '0.68rem',
              bgcolor: 'rgba(16,185,129,0.1)',
              color: palette.success,
            }}
          />
        </Box>

        {equivalent && (
          <Typography
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              fontSize: '0.86rem',
              color: 'text.secondary',
              lineHeight: 1.6,
            }}
          >
            {equivalent}
          </Typography>
        )}

        <Box sx={{ flexGrow: 1, minHeight: 16 }} />

        <Button
          href={APP_URL}
          fullWidth
          variant={featured ? 'contained' : 'outlined'}
          sx={featured ? { background: gradients.brand, color: '#fff' } : undefined}
        >
          {t('pricing.packs.buy')}
        </Button>
      </Box>
    </Box>
  );
};

interface BalanceCardProps {
  icon: React.ReactNode;
  accent: string;
  name: string;
  tagline: string;
  description: string;
  meters: string[];
}

const BalanceCard = ({ icon, accent, name, tagline, description, meters }: BalanceCardProps) => (
  <Box
    sx={{
      height: '100%',
      p: { xs: 3, md: 4 },
      bgcolor: '#fff',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, mb: 2 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${accent}14`,
          color: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
          {name}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: accent,
          }}
        >
          {tagline}
        </Typography>
      </Box>
    </Box>

    <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', lineHeight: 1.7 }}>
      {description}
    </Typography>

    <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {meters.map((meter) => (
        <Box key={meter} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
          <Box
            sx={{
              width: 5,
              height: 5,
              mt: '0.55rem',
              borderRadius: '50%',
              bgcolor: accent,
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontSize: '0.9rem', color: 'text.primary', lineHeight: 1.6 }}>
            {meter}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

const noteKeys = ['balance', 'volume', 'reads', 'help'] as const;

/**
 * Public pricing for the two prepaid balances the platform meters against:
 * Fintela tokens (compute — trials, bug tests) and Fintela AI tokens
 * (Fintelligent conversations).
 */
export const PricingPage = () => {
  const { t, i18n } = useTranslation('pages');
  const lng = i18n.language;
  const [activeSection, setActiveSection] = useState('pricing');

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    if (section === 'home') window.location.href = '/';
  };

  const computeBase = COMPUTE_PACKS[0];
  const aiBase = AI_PACKS[0];

  // Passed to every note; the volume note is the only one that reads them, but
  // i18next ignores interpolation values a string does not use.
  const noteValues = {
    computeSave: count(lng, savingsPercent(COMPUTE_PACKS[COMPUTE_PACKS.length - 1], computeBase)),
    aiSave: count(lng, savingsPercent(AI_PACKS[AI_PACKS.length - 1], aiBase)),
  };

  const meterRows = [
    {
      key: 'trial',
      cost: t('pricing.meter.rows.trial.cost', { amount: count(lng, TRIAL_COST, 1) }),
    },
    {
      key: 'bugTest',
      cost: t('pricing.meter.rows.bugTest.cost', { amount: count(lng, BUG_TEST_COST) }),
    },
    {
      key: 'chat',
      cost: t('pricing.meter.rows.chat.cost'),
    },
  ] as const;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 7, md: 11 },
          pb: { xs: 7, md: 10 },
          background: 'linear-gradient(180deg, #ffffff 0%, #fafbff 60%, #ffffff 100%)',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -140,
            right: -120,
            width: 480,
            height: 480,
            background: 'radial-gradient(circle, rgba(47,99,149,0.13) 0%, transparent 65%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            bottom: -180,
            left: -140,
            width: 480,
            height: 480,
            background: 'radial-gradient(circle, rgba(239,192,60,0.13) 0%, transparent 65%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto' }}>
            <AnimateOnScroll delay={40}>
              <Chip
                label={t('pricing.hero.chip')}
                sx={{
                  mb: 3,
                  bgcolor: 'rgba(47,99,149,0.08)',
                  color: 'primary.main',
                  fontSize: '0.8rem',
                }}
              />
            </AnimateOnScroll>

            <AnimateOnScroll delay={90}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.25rem', sm: '3rem', md: '3.9rem' },
                  color: 'text.primary',
                  mb: 2.5,
                }}
              >
                {t('pricing.hero.title')} <GradientText>{t('pricing.hero.titleAccent')}</GradientText>
              </Typography>
            </AnimateOnScroll>

            <AnimateOnScroll delay={150}>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '1.05rem', md: '1.2rem' },
                  lineHeight: 1.65,
                  maxWidth: 640,
                  mx: 'auto',
                  mb: 4.5,
                }}
              >
                {t('pricing.hero.subtitle')}
              </Typography>
            </AnimateOnScroll>

            <AnimateOnScroll delay={200}>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  href={APP_URL}
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ background: gradients.brand, color: '#fff', px: 3 }}
                >
                  {t('pricing.hero.ctaPrimary')}
                </Button>
                <Button component={RouterLink} to="/contact" variant="outlined" size="large" sx={{ px: 3 }}>
                  {t('pricing.hero.ctaSecondary')}
                </Button>
              </Box>
            </AnimateOnScroll>
          </Box>
        </Container>
      </Box>

      {/* The two balances */}
      <Section id="balances" tone="default" size="md">
        <SectionHeader
          title={t('pricing.balances.title')}
          titleAccent={t('pricing.balances.titleAccent')}
          description={t('pricing.balances.description')}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          <AnimateOnScroll delay={60}>
            <BalanceCard
              icon={<BoltOutlinedIcon />}
              accent={palette.blue}
              name={t('pricing.balances.compute.name')}
              tagline={t('pricing.balances.compute.tagline')}
              description={t('pricing.balances.compute.description')}
              meters={[
                t('pricing.balances.compute.meters.trial', { amount: count(lng, TRIAL_COST, 1) }),
                t('pricing.balances.compute.meters.bugTest', { amount: count(lng, BUG_TEST_COST) }),
              ]}
            />
          </AnimateOnScroll>
          <AnimateOnScroll delay={140}>
            <BalanceCard
              icon={<AutoAwesomeOutlinedIcon />}
              accent={palette.crimson}
              name={t('pricing.balances.ai.name')}
              tagline={t('pricing.balances.ai.tagline')}
              description={t('pricing.balances.ai.description')}
              meters={[
                t('pricing.balances.ai.meters.messages'),
                t('pricing.balances.ai.meters.factor'),
              ]}
            />
          </AnimateOnScroll>
        </Box>
      </Section>

      {/* Packs */}
      <Section id="packs" tone="muted" size="lg">
        <SectionHeader
          title={t('pricing.packs.title')}
          titleAccent={t('pricing.packs.titleAccent')}
          description={t('pricing.packs.description')}
        />

        <Box sx={{ mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="h4"
            sx={{ fontSize: { xs: '1.35rem', md: '1.6rem' }, mb: 0.75, color: 'text.primary' }}
          >
            {t('pricing.packs.compute.heading')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', mb: 3.5, maxWidth: 640 }}>
            {t('pricing.packs.compute.subheading')}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: { xs: 2, md: 2.5 },
            }}
          >
            {COMPUTE_PACKS.map((pack, idx) => (
              <AnimateOnScroll key={pack.tokens} delay={(idx % 4) * 70}>
                <PackCard
                  pack={pack}
                  base={computeBase}
                  accent={palette.blue}
                  unitLabel={t('pricing.packs.compute.unit')}
                  featured={idx === COMPUTE_PACKS.length - 1}
                  equivalent={t('pricing.packs.compute.equivalent', {
                    trials: count(lng, Math.floor(pack.tokens / TRIAL_COST)),
                    bugTests: count(lng, Math.floor(pack.tokens / BUG_TEST_COST)),
                  })}
                />
              </AnimateOnScroll>
            ))}
          </Box>
        </Box>

        <Box>
          <Typography
            variant="h4"
            sx={{ fontSize: { xs: '1.35rem', md: '1.6rem' }, mb: 0.75, color: 'text.primary' }}
          >
            {t('pricing.packs.ai.heading')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', mb: 3.5, maxWidth: 640 }}>
            {t('pricing.packs.ai.subheading')}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: { xs: 2, md: 2.5 },
            }}
          >
            {AI_PACKS.map((pack, idx) => (
              <AnimateOnScroll key={pack.tokens} delay={(idx % 3) * 70}>
                <PackCard
                  pack={pack}
                  base={aiBase}
                  accent={palette.crimson}
                  unitLabel={t('pricing.packs.ai.unit')}
                  featured={idx === AI_PACKS.length - 1}
                />
              </AnimateOnScroll>
            ))}
          </Box>
        </Box>
      </Section>

      {/* What consumes tokens */}
      <Section id="metering" tone="default" size="lg">
        <SectionHeader
          title={t('pricing.meter.title')}
          titleAccent={t('pricing.meter.titleAccent')}
          description={t('pricing.meter.description')}
        />

        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
              gap: { xs: 0.5, sm: 3 },
              px: { xs: 0, sm: 1 },
              pb: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'text.disabled',
              }}
            >
              {t('pricing.meter.columns.action')}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'text.disabled',
                textAlign: { xs: 'left', sm: 'right' },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {t('pricing.meter.columns.cost')}
            </Typography>
          </Box>

          {meterRows.map((row, idx) => (
            <AnimateOnScroll key={row.key} delay={idx * 60}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
                  alignItems: 'baseline',
                  gap: { xs: 0.75, sm: 3 },
                  px: { xs: 0, sm: 1 },
                  py: 2.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '1rem', md: '1.05rem' },
                      color: 'text.primary',
                      letterSpacing: '-0.01em',
                      mb: 0.5,
                    }}
                  >
                    {t(`pricing.meter.rows.${row.key}.action`)}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.9rem',
                      lineHeight: 1.65,
                      maxWidth: 620,
                    }}
                  >
                    {t(`pricing.meter.rows.${row.key}.detail`)}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'text.primary',
                    whiteSpace: { sm: 'nowrap' },
                    textAlign: { xs: 'left', sm: 'right' },
                  }}
                >
                  {row.cost}
                </Typography>
              </Box>
            </AnimateOnScroll>
          ))}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: { xs: 2, md: 3 },
              mt: { xs: 5, md: 7 },
            }}
          >
            {noteKeys.map((key, idx) => (
              <AnimateOnScroll key={key} delay={(idx % 2) * 70}>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.98rem',
                      color: 'text.primary',
                      mb: 0.5,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {t(`pricing.notes.items.${key}.title`)}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {t(`pricing.notes.items.${key}.description`, noteValues)}
                  </Typography>
                </Box>
              </AnimateOnScroll>
            ))}
          </Box>
        </Box>
      </Section>

      {/* Closing CTA */}
      <Section tone="ink" size="md" maxWidth="md">
        <Box sx={{ textAlign: 'center' }}>
          <AnimateOnScroll delay={40}>
            <Typography
              variant="h3"
              sx={{ color: '#fff', fontSize: { xs: '1.75rem', md: '2.4rem' }, mb: 2 }}
            >
              {t('pricing.cta.title')}
            </Typography>
          </AnimateOnScroll>
          <AnimateOnScroll delay={100}>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.72)',
                fontSize: { xs: '1rem', md: '1.1rem' },
                lineHeight: 1.65,
                maxWidth: 560,
                mx: 'auto',
                mb: 4,
              }}
            >
              {t('pricing.cta.description')}
            </Typography>
          </AnimateOnScroll>
          <AnimateOnScroll delay={150}>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                href={APP_URL}
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ background: gradients.brand, color: '#fff', px: 3 }}
              >
                {t('pricing.cta.primary')}
              </Button>
              <Button
                component={RouterLink}
                to="/contact"
                variant="outlined"
                size="large"
                sx={{
                  px: 3,
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.28)',
                  '&:hover': {
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.6)',
                    background: 'rgba(255,255,255,0.06)',
                  },
                }}
              >
                {t('pricing.cta.secondary')}
              </Button>
            </Box>
          </AnimateOnScroll>
        </Box>
      </Section>

      <Footer />
    </Box>
  );
};
