import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { MEASURE } from '../primitives/SectionHeader';
import { MediaPlate } from '../primitives/MediaPlate';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { ChapterVisual } from './ChapterVisuals';
import { quietLinkSx } from '../../theme/neu';
import { fonts, soft } from '../../theme/tokens';
import type { Audience } from '../../lib/audience';
import type { MediaBadge, SolutionChapter } from '../../solutions/registry';

const chapterId = (key: string) => `chapter-${key}`;

interface ChapterPoint {
  title: string;
  body: string;
}

/** What a visual is, under it: an app capture, an illustration or a diagram. */
export const MediaBadgeChip = ({ badge }: { badge: MediaBadge }) => {
  const { t } = useTranslation('solutions');
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        fontFamily: fonts.mono,
        fontSize: '0.7rem',
        lineHeight: 1.4,
        letterSpacing: '0.01em',
        color: soft.textSecondary,
        border: '1px solid rgba(18, 20, 26, 0.16)',
        borderRadius: '6px',
        px: 0.875,
        py: 0.25,
        whiteSpace: 'nowrap',
      }}
    >
      {t(`common.badges.${badge}`)}
    </Box>
  );
};

/** The chapter's proof: a mono line led by a short accent dash, as in HowItWorks. */
const ProofLine = ({ children }: { children: string }) => (
  <Typography
    sx={{ display: 'flex', alignItems: 'baseline', gap: 1, fontFamily: fonts.mono, fontSize: '0.82rem', lineHeight: 1.5, color: soft.text }}
  >
    <Box component="span" aria-hidden sx={{ width: 16, height: 2, flexShrink: 0, borderRadius: '1px', background: soft.linkAccent, transform: 'translateY(-4px)' }} />
    {children}
  </Typography>
);

/** Named for where it lands: four "Read the docs" to four pages tell neither a link list nor a crawler apart. */
const DocsLink = ({ to, children }: { to: string; children: string }) => (
  <Box
    component={RouterLink}
    to={to}
    sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.9rem', fontWeight: 600, color: soft.linkAccent }]}
  >
    {children}
    <ArrowForwardIcon sx={{ fontSize: 15 }} />
  </Box>
);

/** H3, sentence, proof line, docs link: the words of every chapter, whatever sits beside them. */
const ChapterText = ({ chapter, audience, size }: { chapter: SolutionChapter; audience: Audience; size: 'band' | 'cell' }) => {
  const { t } = useTranslation('solutions');
  const k = `${audience}.chapters.${chapter.key}`;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, minWidth: 0 }}>
      <Typography
        component="h3"
        sx={{
          fontSize: size === 'band' ? { xs: '1.45rem', md: '1.75rem' } : { xs: '1.25rem', md: '1.35rem' },
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: soft.text,
          textWrap: 'balance',
        }}
      >
        {t(`${k}.title`)}
      </Typography>
      <Typography sx={{ fontSize: size === 'band' ? { xs: '1rem', md: '1.08rem' } : '0.98rem', lineHeight: 1.6, color: soft.textSecondary, maxWidth: MEASURE }}>
        {t(`${k}.sentence`)}
      </Typography>
      <ProofLine>{t(`${k}.proof`)}</ProofLine>
      <Box sx={{ mt: 0.5 }}>
        <DocsLink to={chapter.docs}>{t(`${k}.docsLabel`)}</DocsLink>
      </Box>
    </Box>
  );
};

/** A chapter with a visual: text first on a phone, side by side from md, sides alternating. */
const ChapterBand = ({ chapter, audience, index }: { chapter: SolutionChapter; audience: Audience; index: number }) => {
  const { t } = useTranslation('solutions');
  const { media } = chapter;
  if (media.kind !== 'component') return null;
  const k = `${audience}.chapters.${chapter.key}`;
  const visualLeft = index % 2 === 1;
  return (
    <Box
      component="article"
      id={chapterId(chapter.key)}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: visualLeft ? 'minmax(0, 7fr) minmax(0, 5fr)' : 'minmax(0, 5fr) minmax(0, 7fr)' },
        gap: { xs: 3, md: 6 },
        alignItems: 'center',
        scrollMarginTop: 140,
      }}
    >
      <Box sx={{ order: { xs: 1, md: visualLeft ? 2 : 1 }, minWidth: 0 }}>
        <AnimateOnScroll>
          <ChapterText chapter={chapter} audience={audience} size="band" />
        </AnimateOnScroll>
      </Box>
      <Box sx={{ order: { xs: 2, md: visualLeft ? 1 : 2 }, minWidth: 0 }}>
        <AnimateOnScroll delay={100}>
          <MediaPlate
            caption={
              // Caption and badge share a line where there is room and stack on a phone, so the caption never runs down a narrow column.
              <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 2, rowGap: 1 }}>
                <Box component="span" sx={{ flex: '1 1 220px', minWidth: 0 }}>
                  {t(`${k}.caption`)}
                </Box>
                <MediaBadgeChip badge={media.badge} />
              </Box>
            }
          >
            <ChapterVisual id={media.id} label={t(`${k}.mediaAlt`, { defaultValue: t(`${k}.caption`) })} />
          </MediaPlate>
        </AnimateOnScroll>
      </Box>
    </Box>
  );
};

/** A text-only chapter, set like the home page's trust anchors: an ink rule, then the words. */
const ChapterCell = ({ chapter, audience }: { chapter: SolutionChapter; audience: Audience }) => (
  <Box component="article" id={chapterId(chapter.key)} sx={{ borderTop: `1px solid ${soft.text}`, pt: 2.5, scrollMarginTop: 140, minWidth: 0 }}>
    <ChapterText chapter={chapter} audience={audience} size="cell" />
  </Box>
);

/** A text-only chapter that lists controls: the words, then its points on ink rules, four across. */
const ChapterPoints = ({ chapter, audience, points }: { chapter: SolutionChapter; audience: Audience; points: ChapterPoint[] }) => {
  const { t } = useTranslation('solutions');
  const k = `${audience}.chapters.${chapter.key}`;
  return (
    <Box component="article" id={chapterId(chapter.key)} sx={{ scrollMarginTop: 140, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography component="h3" sx={{ fontSize: { xs: '1.45rem', md: '1.75rem' }, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, color: soft.text }}>
          {t(`${k}.title`)}
        </Typography>
        <Typography sx={{ fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.6, color: soft.textSecondary, maxWidth: MEASURE }}>
          {t(`${k}.sentence`)}
        </Typography>
      </Box>
      <Box
        component="ul"
        role="list"
        sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, columnGap: 4, rowGap: 3 }}
      >
        {points.map((p) => (
          <Box component="li" key={p.title} sx={{ borderTop: `1px solid ${soft.text}`, pt: 2, minWidth: 0 }}>
            <Typography component="h4" sx={{ fontSize: '1.02rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, color: soft.text, mb: 0.75 }}>
              {p.title}
            </Typography>
            <Typography sx={{ fontSize: '0.93rem', lineHeight: 1.6, color: soft.textSecondary }}>{p.body}</Typography>
          </Box>
        ))}
      </Box>
      <Box>
        <DocsLink to={chapter.docs}>{t(`${k}.docsLabel`)}</DocsLink>
      </Box>
    </Box>
  );
};

type Block =
  | { kind: 'cells'; chapters: SolutionChapter[] }
  | { kind: 'band'; chapter: SolutionChapter; index: number }
  | { kind: 'points'; chapter: SolutionChapter; points: ChapterPoint[] };

/**
 * The page's three or four chapters, one idea each. A chapter with a visual
 * is a band; text-only chapters next to each other share a row, so no chapter
 * leaves an empty image cell; a chapter with points (the hedge-funds
 * safeguards) lists them across. Each is `#chapter-<key>`, the target of its
 * "What changes" row.
 */
export const SolutionChapters = ({ chapters, audience }: { chapters: SolutionChapter[]; audience: Audience }) => {
  const { t } = useTranslation('solutions');
  const blocks: Block[] = [];
  let bands = 0;
  for (const chapter of chapters) {
    const points = t(`${audience}.chapters.${chapter.key}.points`, { returnObjects: true, defaultValue: [] }) as ChapterPoint[] | string;
    if (Array.isArray(points) && points.length > 0) {
      blocks.push({ kind: 'points', chapter, points });
    } else if (chapter.media.kind === 'none') {
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'cells') last.chapters.push(chapter);
      else blocks.push({ kind: 'cells', chapters: [chapter] });
    } else {
      blocks.push({ kind: 'band', chapter, index: bands });
      bands += 1;
    }
  }

  return (
    <Section id="chapters" size="lg" sx={{ pt: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 8, md: 11 } }}>
        {blocks.map((block) => {
          if (block.kind === 'band') return <ChapterBand key={block.chapter.key} chapter={block.chapter} audience={audience} index={block.index} />;
          if (block.kind === 'points') return <ChapterPoints key={block.chapter.key} chapter={block.chapter} audience={audience} points={block.points} />;
          const n = block.chapters.length;
          return (
            <Box
              key={block.chapters.map((c) => c.key).join('-')}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: n === 1 ? 'minmax(0, 1fr)' : `repeat(${Math.min(n, 3)}, minmax(0, 1fr))` },
                columnGap: { md: 5 },
                rowGap: 5,
                maxWidth: n === 1 ? 720 : 'none',
              }}
            >
              {block.chapters.map((c, i) => (
                <AnimateOnScroll key={c.key} delay={i * 70}>
                  <ChapterCell chapter={c} audience={audience} />
                </AnimateOnScroll>
              ))}
            </Box>
          );
        })}
      </Box>
    </Section>
  );
};
