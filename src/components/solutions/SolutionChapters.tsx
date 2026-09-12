import { Box, ButtonBase, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { CheckWell } from '../primitives/CheckWell';
import { MediaWell } from '../primitives/MediaWell';
import { MediaPlate } from '../primitives/MediaPlate';
import { VideoPlate } from '../primitives/VideoPlate';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { navPillSx, quietLinkSx, wellSx } from '../../theme/neu';
import { radii, shadows, soft } from '../../theme/tokens';
import { scrollToSection } from '../../lib/scrollToSection';
import type { Audience } from '../../lib/audience';
import { VIDEOS, TOUR_CHAPTERS, captionTracks } from '../../media/registry';
import type { SolutionChapter } from '../../solutions/registry';

const chapterId = (key: string) => `chapter-${key}`;

/**
 * The sticky sub-nav: pressed pills in a well, one per chapter, following the
 * chapter bands with the same scroll-spy the header uses.
 */
const ChapterNav = ({ chapters, audience }: { chapters: SolutionChapter[]; audience: Audience }) => {
  const { t } = useTranslation('solutions');
  const [active, setActive] = useState(chapters[0]?.key);

  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(chapterId(c.key))).filter((e): e is HTMLElement => e !== null);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id.replace(/^chapter-/, ''));
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [chapters]);

  return (
    <Box
      component="nav"
      aria-label={t('common.chaptersLabel')}
      sx={{
        position: { md: 'sticky' },
        top: { md: 80 },
        zIndex: 2,
        mb: { xs: 4, md: 6 },
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        component="ul"
        sx={{
          ...wellSx('sm'),
          borderRadius: `${radii.pill}px`,
          m: 0,
          p: 0.75,
          listStyle: 'none',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 0.5,
          maxWidth: '100%',
        }}
      >
        {chapters.map((c) => (
          <li key={c.key}>
            <ButtonBase
              onClick={() => scrollToSection(chapterId(c.key))}
              aria-current={active === c.key ? 'location' : undefined}
              className={active === c.key ? 'is-active' : undefined}
              sx={[
                navPillSx,
                {
                  height: 34,
                  px: 1.75,
                  borderRadius: `${radii.pill}px`,
                  fontSize: '0.84rem',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  '&.is-active, &.is-active:hover': { backgroundColor: soft.surfaceRaised, boxShadow: shadows.neuRaisedXs },
                },
              ]}
            >
              {t(`${audience}.chapters.${c.key}.title`)}
            </ButtonBase>
          </li>
        ))}
      </Box>
    </Box>
  );
};

const ChapterMedia = ({ chapter, audience }: { chapter: SolutionChapter; audience: Audience }) => {
  const { t } = useTranslation(['solutions', 'home']);
  const { media } = chapter;
  if (media.kind === 'image') {
    return (
      <MediaPlate>
        <MediaWell
          ratio={media.ratio}
          tone={media.tone}
          src={media.src}
          alt={t(`solutions:${audience}.chapters.${chapter.key}.mediaAlt`)}
          sizes="(min-width: 1200px) 640px, (min-width: 900px) 55vw, 90vw"
        />
      </MediaPlate>
    );
  }
  const video = VIDEOS[media.video];
  const chapters =
    media.video === 'platformHome'
      ? TOUR_CHAPTERS.map((c) => ({ ...c, label: t(`home:tour.chapters.${c.id}.label`) }))
      : [];
  return (
    <MediaPlate>
      <VideoPlate
        mode="player"
        src={video.src}
        poster={video.poster}
        posterAlt={t(`home:${video.posterAltKey}`)}
        captions={captionTracks(video)}
        silent={video.silent}
        chapters={chapters}
        ratio="16/9"
        label={t(`solutions:${audience}.chapters.${chapter.key}.title`)}
      />
    </MediaPlate>
  );
};

/**
 * One capability band: media on one side, three outcomes on the other, sides
 * alternating down the page so the anchors keep swapping. The docs link is
 * the band's exit.
 */
const ChapterBand = ({ chapter, audience, index }: { chapter: SolutionChapter; audience: Audience; index: number }) => {
  const { t } = useTranslation('solutions');
  const mediaLeft = index % 2 === 0;
  const outcomes = t(`${audience}.chapters.${chapter.key}.outcomes`, { returnObjects: true }) as string[];
  return (
    <Box
      component="article"
      id={chapterId(chapter.key)}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: mediaLeft ? 'minmax(0, 7fr) minmax(0, 5fr)' : 'minmax(0, 5fr) minmax(0, 7fr)' },
        gap: { xs: 3, md: 5 },
        alignItems: 'center',
        scrollMarginTop: 140,
        '& > :first-of-type': { order: { xs: 1, md: mediaLeft ? 1 : 2 } },
        '& > :last-of-type': { order: { xs: 2, md: mediaLeft ? 2 : 1 } },
      }}
    >
      <AnimateOnScroll direction={mediaLeft ? 'left' : 'right'}>
        <ChapterMedia chapter={chapter} audience={audience} />
      </AnimateOnScroll>
      <AnimateOnScroll delay={120} direction={mediaLeft ? 'right' : 'left'}>
        <Box>
          <Typography component="h3" sx={{ fontSize: { xs: '1.5rem', md: '1.85rem' }, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: soft.text, textWrap: 'balance' }}>
            {t(`${audience}.chapters.${chapter.key}.title`)}
          </Typography>
          <Typography sx={{ mt: 1.5, fontSize: { xs: '0.98rem', md: '1.05rem' }, lineHeight: 1.65, color: soft.textSecondary }}>
            {t(`${audience}.chapters.${chapter.key}.description`)}
          </Typography>
          <NeuPanel variant="tile" component="section" sx={{ mt: 3, p: { xs: 2.25, md: 2.5 } }}>
            <Box component="ul" role="list" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {outcomes.map((o) => (
                <Box component="li" key={o} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                  <Box sx={{ mt: '2px', display: 'inline-flex' }}>
                    <CheckWell size={20} icon={<CheckRoundedIcon />} />
                  </Box>
                  <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.6, color: soft.text }}>{o}</Typography>
                </Box>
              ))}
            </Box>
          </NeuPanel>
          <Box
            component={RouterLink}
            to={chapter.docs}
            sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 2.5, fontSize: '0.9rem', fontWeight: 600, color: soft.accent }]}
          >
            {t('common.readDocs')}
            <ArrowForwardIcon sx={{ fontSize: 16 }} />
          </Box>
        </Box>
      </AnimateOnScroll>
    </Box>
  );
};

export const SolutionChapters = ({ chapters, audience }: { chapters: SolutionChapter[]; audience: Audience }) => {
  const { t } = useTranslation('solutions');
  return (
    <Section id="chapters" size="lg">
      <SectionHeader
        eyebrow={t('common.chapters.eyebrow')}
        title={t(`${audience}.chaptersTitle`)}
        titleAccent={t(`${audience}.chaptersTitleAccent`)}
      />
      <ChapterNav chapters={chapters} audience={audience} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 8, md: 12 } }}>
        {chapters.map((c, idx) => (
          <ChapterBand key={c.key} chapter={c} audience={audience} index={idx} />
        ))}
      </Box>
    </Section>
  );
};
