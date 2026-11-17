import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { MediaWell } from '../primitives/MediaWell';
import { quietLinkSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import { STILLS } from '../../media/registry';
import { AWARD_POST } from '../../lib/award';
import winnerBadge from '../../assets/awards/hedgeweek-2026-winner-white.png';

/**
 * The Hedgeweek award, once and compact: the ceremony photo, the organiser's
 * winner badge, one sentence and the announcement as the way out. The hero
 * carries the award as a line of text; the long story lives in the post.
 *
 * The badge is Hedgeweek's own artwork, shown unaltered: never recoloured or
 * cropped.
 */
export const AwardBand = () => {
  const { t } = useTranslation('home');

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 5fr) minmax(0, 7fr)' },
        columnGap: { sm: 4, md: 6 },
        rowGap: 3,
        alignItems: 'center',
        maxWidth: 880,
        mx: 'auto',
      }}
    >
      <MediaWell
        ratio="4/3"
        tone="plain"
        src={STILLS.awardCeremony}
        alt={t('proof.award.photoAlt')}
        sizes="(min-width: 900px) 360px, (min-width: 600px) 40vw, calc(100vw - 32px)"
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <Box
          component="img"
          src={winnerBadge}
          alt={t('proof.award.badgeAlt')}
          width={960}
          height={365}
          loading="lazy"
          decoding="async"
          sx={{ display: 'block', width: '100%', maxWidth: 260, height: 'auto', borderRadius: '8px' }}
        />
        <Typography sx={{ fontSize: { xs: '1rem', md: '1.0625rem' }, lineHeight: 1.6, color: soft.text, maxWidth: '46ch' }}>
          {t('proof.award.sentence')}
        </Typography>
        <Box
          component={RouterLink}
          to={AWARD_POST}
          sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.92rem', fontWeight: 600, color: soft.linkAccent }]}
        >
          {t('proof.award.link')}
          <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </Box>
      </Box>
    </Box>
  );
};
