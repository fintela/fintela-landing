import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FlashOnOutlinedIcon from '@mui/icons-material/FlashOnOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { NeuButton } from '../components/primitives/NeuButton';
import { CheckWell } from '../components/primitives/CheckWell';
import { TierBadge } from '../components/primitives/TierBadge';
import { IconWell } from '../components/primitives/IconWell';
import { Groove } from '../components/primitives/Groove';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { cellGrooveSx, clippedGradientSx, quietLinkSx, raisedPanelSx, srOnly } from '../theme/neu';
import { gradients, motion, palette, radii, shadows, soft } from '../theme/tokens';
import { Seo } from '../seo/Seo';
import { breadcrumbList, homeCrumb, organization, webPage, webSite } from '../seo/jsonld';
import { absoluteUrl } from '../seo/site';
import { DOCS_HOME } from '../seo/routes';

const PRICING_OG_IMAGE = '/og/pricing.png';

/** Where "What is a token?" lands: the doc that defines the unit every plan is priced in. */
const TOKEN_DOCS = '/docs/tokens-and-billing';


type TierKey = 'trader' | 'quant' | 'institutional' | 'custom';

/** The three tiers, in display order. Institutional is arranged with the team. */
const PLAN_TIERS: ReadonlyArray<{ key: TierKey; icon: ReactNode; featured: boolean }> = [
  { key: 'trader', icon: <FlashOnOutlinedIcon />, featured: false },
  { key: 'quant', icon: <BusinessCenterOutlinedIcon />, featured: true },
  { key: 'institutional', icon: <ApartmentOutlinedIcon />, featured: false },
  { key: 'custom', icon: <TuneOutlinedIcon />, featured: false },
];

type CompareRow =
  | { key: string; kind: 'text' }
  | { key: string; kind: 'check'; tiers: readonly TierKey[] };

/**
 * Comparison rows, in display order. `text` rows read one value per tier from
 * the catalog. `check` rows show a CheckWell for every tier listed in
 * `tiers` and a muted dash for the rest.
 */
const COMPARE_ROWS: readonly CompareRow[] = [
  { key: 'price', kind: 'text' },
  { key: 'tokenPool', kind: 'text' },
  { key: 'storage', kind: 'text' },
  { key: 'overageRate', kind: 'text' },
  { key: 'aiAccess', kind: 'text' },
  { key: 'support', kind: 'text' },
  { key: 'connectBroker', kind: 'check', tiers: ['trader', 'quant', 'institutional', 'custom'] },
  { key: 'unlimitedStrategies', kind: 'check', tiers: ['trader', 'quant', 'institutional', 'custom'] },
  { key: 'builtIn', kind: 'check', tiers: ['trader', 'quant', 'institutional', 'custom'] },
  { key: 'advancedAllocation', kind: 'check', tiers: ['quant', 'institutional', 'custom'] },
  { key: 'customFitness', kind: 'check', tiers: ['quant', 'institutional', 'custom'] },
  { key: 'customRisk', kind: 'check', tiers: ['quant', 'institutional', 'custom'] },
  { key: 'moreOptimizer', kind: 'check', tiers: ['quant', 'institutional', 'custom'] },
  { key: 'advancedStats', kind: 'check', tiers: ['quant', 'institutional', 'custom'] },
  { key: 'unlimitedOptimizations', kind: 'check', tiers: ['quant', 'institutional', 'custom'] },
  { key: 'orgWorkspace', kind: 'check', tiers: ['institutional', 'custom'] },
  { key: 'customBranding', kind: 'check', tiers: ['institutional', 'custom'] },
  { key: 'whiteLabel', kind: 'check', tiers: ['institutional', 'custom'] },
  { key: 'advancedLlms', kind: 'check', tiers: ['institutional', 'custom'] },
  { key: 'handsOnEnablement', kind: 'check', tiers: ['institutional', 'custom'] },
  { key: 'ssoSeatManagement', kind: 'check', tiers: ['institutional', 'custom'] },
];

interface PlanCardProps {
  id: string;
  icon: ReactNode;
  name: string;
  price: string;
  /** e.g. "/mo"; empty for the Custom tier's bare "Custom" price. */
  period: string;
  badge: string;
  description: string;
  features: string[];
  overageRateLabel: string;
  overageRate: string;
  /** Label of the link under the overage rate, to the tokens doc. */
  tokenHelp: string;
  support: string;
  cta: string;
  /** Internal route for the CTA; without it the CTA points at the app. */
  ctaTo?: string;
  featured?: boolean;
}

const PlanCard = ({
  id,
  icon,
  name,
  price,
  period,
  badge,
  description,
  features,
  overageRateLabel,
  overageRate,
  tokenHelp,
  support,
  cta,
  ctaTo,
  featured = false,
}: PlanCardProps) => {
  // Geometry and type are identical on all four cards. Only the shadow depth,
  // the badge fill and the CTA fill are fixed by `featured`; the gold ring is
  // not — it is a hover/focus invitation any card can earn, not a permanent
  // badge of rank.
  return (
    <Box
      component="article"
      aria-labelledby={`plan-${id}-name`}
      sx={{
        ...raisedPanelSx,
        position: 'relative',
        // The featured card sits between the others, so without this its
        // neighbours' 34px spreads paint over its deeper shadow and flatten it.
        ...(featured && { zIndex: 1 }),
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 3, md: 4 },
        maxWidth: { xs: 560, md: 'none' },
        mx: { xs: 'auto', md: 0 },
        width: '100%',
        // Every card carries the same 1.5px transparent border at rest — not
        // just the featured one — so the ring below never shifts the card's
        // size when it appears; `raisedPanelSx`'s own 1px border is overridden
        // here to match.
        border: '1.5px solid transparent',
        boxShadow: {
          xs: shadows.neuRaisedMd,
          md: featured ? shadows.neuRaisedLg : shadows.neuRaised,
        },
        transition: `box-shadow ${motion.base}, background-image ${motion.fast}`,
        // On hover/focus (any card, not only the featured one): the same
        // two-layer background as before — an opaque white padding-box layer
        // on top of the brand gradient painted to the border-box, so only the
        // 1.5px ring reads the gradient and the card face stays white.
        '@media (hover: hover)': {
          '&:hover': {
            backgroundImage: `linear-gradient(${soft.surfaceRaised}, ${soft.surfaceRaised}), ${gradients.gold}`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          },
        },
        '&:focus-within': {
          backgroundImage: `linear-gradient(${soft.surfaceRaised}, ${soft.surfaceRaised}), ${gradients.gold}`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: shadows.neuRaisedXl,
        },
        '@media (forced-colors: active)': {
          boxShadow: 'none',
          borderColor: 'CanvasText',
        },
      }}
    >
      {/* Fixed height, not minHeight, so the row holds even on an empty badge. */}
      <Box sx={{ height: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
        {badge && <TierBadge featured={featured}>{badge}</TierBadge>}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minHeight: 48, mb: 2 }}>
        <IconWell>{icon}</IconWell>
        {/* The plan name is the card's heading: an h3 under the sr-only "Plans" h2. */}
        <Typography
          id={`plan-${id}-name`}
          component="h3"
          sx={{
            fontSize: { xs: '1.25rem', md: '1.375rem' },
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: soft.text,
          }}
        >
          {name}
        </Typography>
      </Box>

      {/* The reference's "≥19px-bold numerals on white" case — the one place
          on this card the gold display ramp is allowed on text. */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1.5 }}>
        <Typography
          component="span"
          sx={{
            fontSize: { xs: '2rem', md: '2.25rem' },
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            ...clippedGradientSx(gradients.goldText),
          }}
        >
          {price}
        </Typography>
        {period && (
          <Typography
            component="span"
            sx={{ fontSize: '0.95rem', fontWeight: 600, color: soft.textSecondary }}
          >
            {period}
          </Typography>
        )}
      </Box>

      {/* The md reserve is two lines, so the groove and the feature lists
          share a y-axis across cards whose one-line pitch wraps in es/pt. */}
      <Typography
        sx={{
          fontSize: '0.9rem',
          lineHeight: 1.65,
          color: soft.textSecondary,
          minHeight: { xs: 'auto', md: 48 },
          mb: 2.5,
        }}
      >
        {description}
      </Typography>

      <Groove sx={{ mb: 2.5 }} />

      {/* role="list" is required — Safari + VoiceOver drop list semantics when
          list-style is none. flexGrow here is what absorbs uneven list lengths. */}
      <Box
        component="ul"
        role="list"
        sx={{
          m: 0,
          p: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          flexGrow: 1,
        }}
      >
        {features.map((feature) => {
          // A line ending in ":" introduces the next tier's exclusives
          // ("Everything in Trader, plus:") — a section label, not a
          // checked feature, so it gets no CheckWell.
          const isLabel = feature.trim().endsWith(':');
          return (
            <Box
              component="li"
              key={feature}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.25,
                ...(isLabel && { mt: 0.5 }),
              }}
            >
              {!isLabel && (
                <Box sx={{ mt: '2px', display: 'inline-flex' }}>
                  <CheckWell />
                </Box>
              )}
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  overflowWrap: 'anywhere',
                  color: soft.text,
                  ...(isLabel && { fontWeight: 700 }),
                }}
              >
                {feature}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Groove sx={{ my: 2.5 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontSize: '0.8rem', color: soft.textSecondary }}>{overageRateLabel}</Typography>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: soft.text }}>
            {overageRate}
          </Typography>
        </Box>
        <Box
          component={RouterLink}
          to={TOKEN_DOCS}
          sx={[quietLinkSx, { alignSelf: 'flex-start', fontSize: '0.8rem', fontWeight: 600, color: soft.accent }]}
        >
          {tokenHelp}
        </Box>
        <Typography sx={{ fontSize: '0.8rem', color: soft.textSecondary }}>{support}</Typography>
      </Box>

      <NeuButton tone={featured ? 'accent' : 'raised'} to={ctaTo} fullWidth>
        {cta}
      </NeuButton>
    </Box>
  );
};

/**
 * The tier matrix. A real <table> for its semantics — row and column headers
 * announce together for every cell — dressed in grooves instead of rules.
 * Below md each row folds into a block: the label on top, the three tiers as
 * a strip beneath it, so every column stays visible on a phone and the page
 * never scrolls sideways. The explicit ARIA roles are what keep the table
 * semantics alive once `display` stops being table-*.
 */
const ComparisonTable = () => {
  const { t } = useTranslation('pages');

  const cellBase = {
    px: { xs: 1, md: 2.5 },
    py: { xs: 1.25, md: 2.25 },
    fontSize: { xs: '0.875rem', md: '0.9375rem' },
    lineHeight: 1.45,
    verticalAlign: 'middle',
    textAlign: 'center',
    // Every row-label column shares this width so the tier columns stay equal.
    '&[scope="row"], &[scope="col"]:first-of-type': {
      textAlign: 'left',
      width: { md: '22%' },
    },
  } as const;

  const tierName = (key: TierKey) => t(`pricing.individual.plans.${key}.name`);

  return (
    <Box sx={{ ...raisedPanelSx, p: { xs: 1.5, md: 2 } }}>
      <Box
        component="table"
        role="table"
        sx={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          display: { xs: 'block', md: 'table' },
          '& thead': { display: { xs: 'none', md: 'table-header-group' } },
          '& tbody': { display: { xs: 'block', md: 'table-row-group' } },
          '& tbody > tr': {
            display: { xs: 'grid', md: 'table-row' },
            gridTemplateColumns: `repeat(${PLAN_TIERS.length}, minmax(0, 1fr))`,
            columnGap: 1,
            px: { xs: 0.5, md: 0 },
            py: { xs: 1.25, md: 0 },
            '&:not(:first-of-type)': { xs: cellGrooveSx, md: {} },
          },
          '& tbody > tr > th': {
            gridColumn: '1 / -1',
            pb: { xs: 0.5, md: 2.25 },
          },
          '& tbody > tr > *': { md: cellGrooveSx },
        }}
      >
        <Box component="caption" sx={srOnly}>
          {t('pricing.compare.caption')}
        </Box>
        <thead>
          <tr role="row">
            <Box component="th" scope="col" role="columnheader" sx={cellBase}>
              <Typography
                component="span"
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.11em',
                  textTransform: 'uppercase',
                  color: soft.textSecondary,
                }}
              >
                {t('pricing.compare.featureColumn')}
              </Typography>
            </Box>
            {PLAN_TIERS.map((tier) => (
              <Box
                component="th"
                scope="col"
                role="columnheader"
                key={tier.key}
                sx={{
                  ...cellBase,
                  ...(tier.featured && {
                    background: gradients.brandFaint,
                    borderRadius: `${radii.neuInner}px ${radii.neuInner}px 0 0`,
                  }),
                }}
              >
                <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
                  <IconWell size={40}>{tier.icon}</IconWell>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '1.0625rem',
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                      color: soft.text,
                    }}
                  >
                    {tierName(tier.key)}
                  </Typography>
                  {/* Fixed-height slot on every tier so the names share a baseline. */}
                  <Box sx={{ height: 24, display: 'flex', alignItems: 'center' }}>
                    {tier.featured && (
                      <TierBadge featured>{t(`pricing.individual.plans.${tier.key}.badge`)}</TierBadge>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row, rowIdx) => {
            const last = rowIdx === COMPARE_ROWS.length - 1;
            return (
              <tr key={row.key} role="row">
                <Box
                  component="th"
                  scope="row"
                  role="rowheader"
                  sx={{ ...cellBase, fontWeight: 600, color: soft.text }}
                >
                  {t(`pricing.compare.rows.${row.key}.label`)}
                </Box>
                {PLAN_TIERS.map((tier) => {
                  const isIncluded = row.kind === 'check' && row.tiers.includes(tier.key);
                  return (
                  <Box
                    component="td"
                    role="cell"
                    key={tier.key}
                    sx={{
                      ...cellBase,
                      color: soft.text,
                      display: { xs: 'flex', md: 'table-cell' },
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: 0.75,
                      borderRadius: { xs: `${radii.neuWell}px`, md: 0 },
                      ...(tier.featured && {
                        background: gradients.brandFaint,
                        ...(last && {
                          borderRadius: {
                            xs: `${radii.neuWell}px`,
                            md: `0 0 ${radii.neuInner}px ${radii.neuInner}px`,
                          },
                        }),
                      }),
                    }}
                  >
                    {/* The column header stands in for this at md and above. */}
                    <Box
                      component="span"
                      sx={{
                        display: { xs: 'block', md: 'none' },
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: soft.textSecondary,
                      }}
                    >
                      {tierName(tier.key)}
                    </Box>
                    {row.kind === 'check' ? (
                      isIncluded ? (
                        <>
                          <CheckWell
                            size={24}
                            sx={{
                              borderRadius: `${radii.pill}px`,
                              bgcolor: palette.success,
                              '& svg': { fill: soft.white },
                            }}
                          />
                          <Box component="span" sx={srOnly}>
                            {t('pricing.compare.included')}
                          </Box>
                        </>
                      ) : (
                        <>
                          <CheckWell
                            size={24}
                            icon={<RemoveRoundedIcon />}
                            sx={{ '& svg': { fill: soft.textSecondary } }}
                          />
                          <Box component="span" sx={srOnly}>
                            {t('pricing.compare.notIncluded')}
                          </Box>
                        </>
                      )
                    ) : (
                      <Box component="span" sx={{ overflowWrap: 'break-word' }}>
                        {t(`pricing.compare.rows.${row.key}.${tier.key}`)}
                      </Box>
                    )}
                  </Box>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </Box>
    </Box>
  );
};

/**
 * Public pricing for Fintela: three tiers on one soft-UI ground, the full
 * tier matrix beneath them, and a way to reach the team. Trader and Quant
 * are self serve; Institutional is arranged with the team rather than
 * bought, so its CTA goes to /contact.
 */
export const PricingPage = () => {
  const { t } = useTranslation('pages');

  return (
    // The ground and colorScheme come from the theme (MuiCssBaseline).
    <Box sx={{ minHeight: '100vh' }}>
      {/* No Offer markup on purpose: the plans shown here and the Terms
          describe different commercial models, and structured data must not
          assert what the page cannot back. WebPage + breadcrumbs only. */}
      <Seo
        title={t('seo.pricing.title')}
        description={t('seo.pricing.description')}
        image={PRICING_OG_IMAGE}
        jsonLd={[
          organization(),
          webSite(),
          webPage({
            name: t('seo.pricing.title'),
            description: t('seo.pricing.description'),
            url: absoluteUrl('/pricing'),
            image: absoluteUrl(PRICING_OG_IMAGE),
          }),
          breadcrumbList([homeCrumb(), { name: 'Pricing' }]),
        ]}
      />
      <Header />

      <Box component="main" id="content">
        {/* Hero. Short on purpose: the cards are the content, so they start
            inside the first viewport instead of below a second display heading. */}
        <Section tone="hero" size="sm" sx={{ pt: { xs: 7, md: 11 }, pb: { xs: 5, md: 7 } }}>
          <SectionHeader
            level="h1"
            title={t('pricing.hero.title')}
            titleAccent={t('pricing.hero.titleAccent')}
            description={t('pricing.hero.subtitle')}
          />
        </Section>

        {/* Plans. The h1 already names this section, so its own heading is for
            the outline only. */}
        <Section id="plans" tone="ink" size="md" sx={{ pt: { xs: 2, md: 3 } }}>
          <Typography component="h2" sx={srOnly}>
            {t('pricing.individual.title')}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              // minmax(0, 1fr), not 1fr: a bare 1fr is minmax(auto, 1fr), so one
              // long token in an es/pt string would widen its column silently.
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
              alignItems: 'stretch',
              // 32px at md is load-bearing: neuRaised spreads ~34px, and at a
              // tighter gutter adjacent cards' shadows collide into a gray seam.
              gap: { xs: 3, md: 3, lg: 4 },
            }}
          >
            {PLAN_TIERS.map((tier, idx) => (
              <AnimateOnScroll key={tier.key} delay={idx * 80} stretch>
                <PlanCard
                  id={tier.key}
                  icon={tier.icon}
                  featured={tier.featured}
                  name={t(`pricing.individual.plans.${tier.key}.name`)}
                  price={t(`pricing.individual.plans.${tier.key}.price`)}
                  period={t(`pricing.individual.plans.${tier.key}.period`)}
                  badge={t(`pricing.individual.plans.${tier.key}.badge`)}
                  description={t(`pricing.individual.plans.${tier.key}.description`)}
                  features={
                    t(`pricing.individual.plans.${tier.key}.features`, {
                      returnObjects: true,
                    }) as string[]
                  }
                  overageRateLabel={t('pricing.individual.overageRateLabel')}
                  overageRate={t(`pricing.individual.plans.${tier.key}.overageRate`)}
                  tokenHelp={t('pricing.individual.tokenHelp')}
                  support={t(`pricing.individual.plans.${tier.key}.support`)}
                  cta={t(`pricing.individual.plans.${tier.key}.cta`)}
                  ctaTo={tier.key === 'custom' ? '/contact' : undefined}
                />
              </AnimateOnScroll>
            ))}
          </Box>
        </Section>

        {/* Compare */}
        <Section id="compare" tone="soft" size="md" sx={{ pt: 0 }}>
          <SectionHeader
            level="h2"
            title={t('pricing.compare.title')}
            titleAccent={t('pricing.compare.titleAccent')}
            description={t('pricing.compare.description')}
          />
          <AnimateOnScroll delay={60}>
            <ComparisonTable />
          </AnimateOnScroll>
        </Section>

        {/* Closing CTA */}
        <Section tone="ink" size="md" sx={{ pt: 0, pb: { xs: 10, md: 14 } }}>
          <AnimateOnScroll>
            <Box
              sx={{
                ...raisedPanelSx,
                maxWidth: 880,
                mx: 'auto',
                px: { xs: 3, md: 8 },
                py: { xs: 5, md: 7 },
                textAlign: 'center',
              }}
            >
              <Typography
                component="h2"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.025em',
                  color: soft.text,
                  textWrap: 'balance',
                }}
              >
                {t('pricing.cta.title')}
              </Typography>
              <Typography
                sx={{
                  mt: 1.5,
                  mx: 'auto',
                  maxWidth: 520,
                  fontSize: { xs: '0.9375rem', md: '1rem' },
                  lineHeight: 1.65,
                  color: soft.textSecondary,
                }}
              >
                {t('pricing.cta.description')}
              </Typography>
              <Box
                sx={{
                  mt: 3.5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 2,
                  '& > *': { flex: { xs: '1 1 100%', sm: '0 1 auto' } },
                }}
              >
                <NeuButton tone="accent" to="/contact">
                  {t('pricing.cta.primary')}
                </NeuButton>
                <NeuButton tone="raised" to={DOCS_HOME}>
                  {t('pricing.cta.secondary')}
                </NeuButton>
              </Box>
            </Box>
          </AnimateOnScroll>
        </Section>
      </Box>

      <Footer />
    </Box>
  );
};
