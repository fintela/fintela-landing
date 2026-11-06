import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BusinessIcon from '@mui/icons-material/Business';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Section } from '../primitives/Section';
import { NeuPanel } from '../primitives/NeuPanel';
import { IconWell } from '../primitives/IconWell';
import { MediaWell } from '../primitives/MediaWell';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { clippedGradientSx, neuGrid, quietLinkSx } from '../../theme/neu';
import { gradients, motion, palette, soft } from '../../theme/tokens';
import type { Audience } from '../../lib/audience';
import { STILLS } from '../../media/registry';
import { SOLUTION_PATHS, USE_CASE_KEY } from '../../solutions/registry';

/** Left to right in the 4×1 row: independent quants lead, then funds, research teams and advisors. */
const CARD_ORDER: readonly Audience[] = ['independents', 'funds', 'teams', 'advisors'];

/**
 * The row is four across from `lg` up, 2×2 on tablet and one column on a
 * phone. Four rich cards in a row are ~264px wide at the 1200px container, and
 * below that the copy would break into slivers, so `md` stays 2-up.
 */
const CARD_COLUMNS = { xs: neuGrid.columns(1), sm: neuGrid.columns(2), lg: neuGrid.columns(4) } as const;

/** Tight at lg, where a card is ~264px wide; the roomier 2-up and 1-up layouts keep the larger inset. */
const CARD_PAD = { xs: 3, lg: 2.75 } as const;

/**
 * The gold ring (the PricingPage plan-card treatment): an opaque white
 * padding-box layer over the brand gradient painted to the border-box, so only
 * the card's 1.5px transparent border reads the gradient. Painted on the card
 * itself, never a wrapper, so it cannot square off the rounded corners.
 */
const goldRingSx = {
  backgroundImage: `linear-gradient(${soft.surfaceRaised}, ${soft.surfaceRaised}), ${gradients.gold}`,
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
} as const;

const AUDIENCE_ICON: Record<Audience, ReactNode> = {
  funds: <BusinessIcon />,
  independents: <PersonOutlineIcon />,
  teams: <GroupsIcon />,
  advisors: <HandshakeOutlinedIcon />,
};

const ADVANTAGES = [
  { key: 'infra', icon: <CloudOffOutlinedIcon /> },
  { key: 'concurrent', icon: <LayersOutlinedIcon /> },
  { key: 'provenance', icon: <VerifiedUserOutlinedIcon /> },
  { key: 'reports', icon: <DescriptionOutlinedIcon /> },
] as const;

/**
 * The band's centered header on the soft ground. Mirrors `SectionHeader`'s
 * centered layout (a gold rule flanking the eyebrow on both sides).
 */
const AudiencesHeaderBand = ({
  eyebrow,
  title,
  titleAccent,
  description,
}: {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
}) => {
  const rule = (
    <Box aria-hidden sx={{ width: 28, height: 3, borderRadius: '2px', background: gradients.gold, flexShrink: 0 }} />
  );
  return (
    <Box sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto', mb: { xs: 5, md: 8 } }}>
      <AnimateOnScroll delay={40}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2.5 }}>
          {rule}
          <Typography
            component="span"
            sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: soft.textSecondary }}
          >
            {eyebrow}
          </Typography>
          {rule}
        </Box>
      </AnimateOnScroll>
      <AnimateOnScroll delay={90}>
        <Typography
          component="h2"
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' },
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: soft.text,
            mb: 2.5,
            textWrap: 'balance',
          }}
        >
          {title}{' '}
          <Box component="span" sx={clippedGradientSx(gradients.goldText)}>
            {titleAccent}
          </Box>
        </Typography>
      </AnimateOnScroll>
      <AnimateOnScroll delay={150}>
        <Typography sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.65, color: soft.textSecondary, maxWidth: 640, mx: 'auto' }}>
          {description}
        </Typography>
      </AnimateOnScroll>
    </Box>
  );
};

/**
 * The band's content column. The band sits on the page's own soft ground:
 * neumorphic panels pair a white highlight with the ground's hue, so they
 * never go on an ink surface.
 */
const AudiencesBand = ({ children }: { children: ReactNode }) => <Box>{children}</Box>;

/**
 * Band 3, right after the pipeline. The four seats as dossier cards in a 4×1
 * row (2×2 on tablet, stacked on a phone). Every card is a link to that seat's
 * `/solutions/*` page: it lifts and takes a gold ring on hover and focus, and
 * the whole surface is the click target. The platform advantages sit beneath.
 */
export const InstitutionalSection = () => {
  const { t } = useTranslation('home');

  return (
    <Section id="for-funds" size="lg" tone="ink">
      <AudiencesBand>
        <AudiencesHeaderBand
          eyebrow={t('audiences.eyebrow')}
          title={t('audiences.title')}
          titleAccent={t('audiences.titleAccent')}
          description={t('audiences.description')}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: CARD_COLUMNS,
            gap: neuGrid.gap,
            alignItems: 'stretch',
            mb: { xs: 3, md: 4 },
          }}
        >
          {CARD_ORDER.map((audience, idx) => (
            <AnimateOnScroll key={audience} delay={idx * 90} stretch>
              <AudienceCard audience={audience} />
            </AnimateOnScroll>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: neuGrid.columns(2), md: neuGrid.columns(4) },
            gap: neuGrid.gap,
          }}
        >
          {ADVANTAGES.map((a, idx) => (
            <AnimateOnScroll key={a.key} delay={idx * 70}>
              <NeuPanel
                variant="tile"
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1, p: { xs: 2.25, md: 2.5 }, height: '100%' }}
              >
                <IconWell size={40}>{a.icon}</IconWell>
                <Box>
                  {/* A sub-topic of the band, so a heading — the size is the tile's own. */}
                  <Typography component="h3" sx={{ fontWeight: 700, color: soft.text, mb: 0.5, fontSize: '0.98rem' }}>
                    {t(`audiences.advantages.${a.key}.title`)}
                  </Typography>
                  <Typography sx={{ color: soft.textSecondary, fontSize: '0.86rem', lineHeight: 1.55 }}>
                    {t(`audiences.advantages.${a.key}.desc`)}
                  </Typography>
                </Box>
              </NeuPanel>
            </AnimateOnScroll>
          ))}
        </Box>
      </AudiencesBand>
    </Section>
  );
};

/**
 * One seat. The card is an <article>, not an <a>, because the fund seat also
 * carries a pricing link and anchors cannot nest. Instead the title's link
 * stretches over the whole card (its ::after fills the article) and the
 * pricing link is lifted above that overlay.
 */
const AudienceCard = ({ audience }: { audience: Audience }) => {
  const { t } = useTranslation('home');
  const useCase = USE_CASE_KEY[audience];

  return (
    <NeuPanel
      component="article"
      interactive
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        overflow: 'hidden',
        maxWidth: { xs: 560, lg: 'none' },
        mx: { xs: 'auto', lg: 0 },
        width: '100%',
        height: '100%',
        // 1.5px transparent at rest (NeuPanel's own raisedPanelSx is 1px), so
        // the gold ring that appears on hover/focus never shifts the card's size.
        border: '1.5px solid transparent',
        transition: `box-shadow ${motion.base}, transform ${motion.base}, background-image ${motion.fast}`,
        '@media (hover: hover)': {
          '&:hover': goldRingSx,
          // Hovering the card nudges the arrow and slowly pushes in on the photo.
          '&:hover .audience-arrow': { transform: 'translateX(4px)', color: soft.accent },
          '&:hover .audience-photo img': { transform: 'scale(1.05)' },
        },
        // Keyboard: the stretched link's focus ring is the card's, outside it.
        // It is painted straight on the band's ink ground, where an ink-reset
        // card cannot use soft.linkAccent (the card resets that var to near-black
        // on itself), so it is the red that var takes on ink (see index.css).
        '&:has(.audience-link:focus-visible)': { ...goldRingSx, outline: `2px solid ${palette.red}`, outlineOffset: 4 },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': { transform: 'none' },
          '& .audience-arrow, & .audience-photo img': { transition: 'none', transform: 'none !important' },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', p: CARD_PAD, pb: 0, flex: '0 0 auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.75 }}>
          <IconWell size={40}>{AUDIENCE_ICON[audience]}</IconWell>
          <ArrowForwardIcon
            aria-hidden
            className="audience-arrow"
            sx={{ fontSize: 20, color: soft.textSecondary, transition: `transform ${motion.base}, color ${motion.fast}` }}
          />
        </Box>
        <Typography
          component="h3"
          sx={{ fontSize: { xs: '1.15rem', lg: '1.1rem' }, fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em', color: soft.text, mb: 1.25 }}
        >
          <Box
            component={RouterLink}
            to={SOLUTION_PATHS[audience]}
            className="audience-link"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              // The stretched hit area: the nearest positioned ancestor is the card.
              '&::after': { content: '""', position: 'absolute', inset: 0, zIndex: 1 },
              // The card draws the focus ring (see :has above), not the link.
              '&:focus-visible': { outline: 'none' },
            }}
          >
            {t(`useCases.audiences.${useCase}.title`)}
          </Box>
        </Typography>
        <Typography sx={{ fontSize: { xs: '0.9rem', lg: '0.86rem' }, lineHeight: 1.6, color: soft.textSecondary }}>
          {t(`useCases.audiences.${useCase}.description`)}
        </Typography>
        {/* The fund seat is the one bought on a custom plan, so its card is
            where the pricing page earns a contextual link. It sits above the
            card-wide link (zIndex) so it stays its own target. */}
        {audience === 'funds' && (
          <Box
            component={RouterLink}
            to="/pricing"
            sx={[
              quietLinkSx,
              {
                position: 'relative',
                zIndex: 2,
                mt: 1.75,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.86rem',
                fontWeight: 600,
                color: soft.accent,
                alignSelf: 'flex-start',
              },
            ]}
          >
            {t('audiences.items.funds.pricingLink')}
            <ArrowForwardIcon sx={{ fontSize: 14 }} />
          </Box>
        )}
      </Box>

      {/* The photo fills whatever height the card has left, from a floor up,
          and is cropped to it: laid out absolutely, so the portrait files'
          own height never drives the card's. The floor is low at lg, where the
          copy sets the card's height, and roomier when the cards are wider. */}
      <Box
        className="audience-photo"
        sx={{
          position: 'relative',
          flex: '1 1 auto',
          minHeight: { xs: 220, sm: 260, lg: 170 },
          mt: 2.5,
          overflow: 'hidden',
          '& img': { transition: `transform ${motion.slow}` },
        }}
      >
        <MediaWell
          tone="plain"
          flush
          src={STILLS.audiences[audience]}
          alt={t(`audiences.items.${audience}.imageAlt`)}
          sizes="(min-width: 1200px) 280px, (min-width: 600px) 50vw, 100vw"
          sx={{
            position: 'absolute',
            inset: 0,
            aspectRatio: 'auto',
            borderRadius: 0,
            boxShadow: 'none',
            '&::after': { display: 'none' },
          }}
        />
      </Box>
    </NeuPanel>
  );
};
