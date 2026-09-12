import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ArrowBack, CalendarToday, PersonOutline, SearchOff } from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { IconWell } from '../components/primitives/IconWell';
import { TierBadge } from '../components/primitives/TierBadge';
import { Groove } from '../components/primitives/Groove';
import { MarkdownContent } from '../blog/MarkdownContent';
import { formatContentDate } from '../content/format';
import { useBlogPost } from '../blog/useBlog';
import { noMotionPress, quietLinkSx } from '../theme/neu';
import { gradients, motion, soft } from '../theme/tokens';

/**
 * `/blog/:slug` — one post, rendered from the Markdown body in its `blog/<slug>.json`.
 *
 * A slug that isn't in the published set renders the not-found state rather than a
 * blank page: posts get renamed or unpublished, and links to them stay in the wild.
 */
export const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation('pages');
  const { status, post } = useBlogPost(slug);
  const [activeSection, setActiveSection] = useState('blog');

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    if (section === 'home') window.location.href = '/';
  };

  // The post title only becomes known after the fetch, so the tab title is set
  // here rather than in the static index.html.
  useEffect(() => {
    if (!post) return;
    const previous = document.title;
    document.title = `${post.title} — Fintela`;
    return () => {
      document.title = previous;
    };
  }, [post]);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header activeSection={activeSection} onNavigate={handleNavigate} />

      {/* No hero fade: the reading panel below must sit on flat ground. */}
      <Section size="md" maxWidth="md" sx={{ pt: { xs: 5, md: 8 }, pb: { xs: 5, md: 9 } }}>
        <BackToBlog label={t('blog.backToBlog')} />

        {status === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress size={28} sx={{ color: soft.accent }} />
          </Box>
        )}

        {(status === 'notFound' || status === 'error') && (
          <Box sx={{ textAlign: 'center', py: { xs: 8, md: 12 } }}>
            <IconWell size={72} round sx={{ mx: 'auto', mb: 3 }}>
              <SearchOff />
            </IconWell>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: soft.text }}>
              {status === 'notFound' ? t('blog.notFound.title') : t('blog.error.title')}
            </Typography>
            <Typography
              sx={{ color: soft.textSecondary, maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}
            >
              {status === 'notFound' ? t('blog.notFound.body') : t('blog.error.body')}
            </Typography>
          </Box>
        )}

        {status === 'ready' && post && (
          <NeuPanel component="article" sx={{ p: { xs: 3, md: 6 } }}>
            {/* Metadata header */}
            <Box sx={{ mb: 4 }}>
              {post.tags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                  {post.tags.map((tag) => (
                    <TierBadge key={tag}>{tag}</TierBadge>
                  ))}
                </Box>
              )}

              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  mb: 2.5,
                  color: soft.text,
                  fontSize: { xs: '1.9rem', sm: '2.4rem', md: '3rem' },
                  textWrap: 'balance',
                }}
              >
                {post.title}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: { xs: 1.5, sm: 2.5 },
                  color: soft.textSecondary,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PersonOutline sx={{ fontSize: '1.05rem' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {post.author}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CalendarToday sx={{ fontSize: '0.95rem' }} />
                  <Typography variant="body2">
                    {formatContentDate(post.date, i18n.language)}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {t('blog.readTime', { minutes: post.readingMinutes })}
                </Typography>
              </Box>
            </Box>

            <Box
              aria-hidden
              sx={{ width: 36, height: 3, borderRadius: '2px', background: gradients.gold, mb: 3 }}
            />

            <MarkdownContent markdown={post.markdown} />
          </NeuPanel>
        )}

        {/* Outside <article>: site navigation is not part of the post content. */}
        {status === 'ready' && post && (
          <>
            <Groove sx={{ mt: 6, mb: 4 }} />
            <BackToBlog label={t('blog.backToBlog')} />
          </>
        )}
      </Section>

      <Footer />
    </Box>
  );
};

const BackToBlog = ({ label }: { label: string }) => (
  <Box
    component={RouterLink}
    to="/blog"
    sx={[
      quietLinkSx,
      {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        mb: 4,
        fontSize: '0.9rem',
        fontWeight: 600,
        transition: `color ${motion.fast}, transform ${motion.fast}`,
        '@media (hover: hover)': {
          '&:hover': { color: soft.accent, transform: 'translateX(-3px)' },
        },
        ...noMotionPress,
      },
    ]}
  >
    <ArrowBack sx={{ fontSize: '1.05rem' }} />
    {label}
  </Box>
);
