import { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress, Container, Divider, Typography } from '@mui/material';
import { ArrowBack, CalendarToday, PersonOutline, SearchOff } from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { MarkdownContent } from '../blog/MarkdownContent';
import { formatContentDate } from '../content/format';
import { accentFor } from '../blog/format';
import { useBlogPost } from '../blog/useBlog';

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

  const accent = post ? accentFor(post.slug) : '#667eea';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header activeSection={activeSection} onNavigate={handleNavigate} />

      <Box sx={{ pt: { xs: 11, md: 14 }, pb: { xs: 5, md: 9 } }}>
        <Container maxWidth="md">
          <BackToBlog label={t('blog.backToBlog')} />

          {status === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
              <CircularProgress size={28} sx={{ color: '#667eea' }} />
            </Box>
          )}

          {(status === 'notFound' || status === 'error') && (
            <Box sx={{ textAlign: 'center', py: { xs: 8, md: 12 } }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  mx: 'auto',
                  mb: 3,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(102, 126, 234, 0.08)',
                  color: 'primary.main',
                  '& svg': { fontSize: '2rem' },
                }}
              >
                <SearchOff />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
                {status === 'notFound' ? t('blog.notFound.title') : t('blog.error.title')}
              </Typography>
              <Typography
                sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}
              >
                {status === 'notFound' ? t('blog.notFound.body') : t('blog.error.body')}
              </Typography>
            </Box>
          )}

          {status === 'ready' && post && (
            <Box component="article">
              {/* Metadata header */}
              <Box sx={{ mb: 4 }}>
                {post.tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                    {post.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          bgcolor: `${accent}1a`,
                          color: accent,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    ))}
                  </Box>
                )}

                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 2.5,
                    color: 'text.primary',
                    fontSize: { xs: '1.9rem', sm: '2.4rem', md: '3rem' },
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
                    color: 'text.secondary',
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

              <Divider
                sx={{
                  mb: 1,
                  borderColor: 'transparent',
                  height: 3,
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${accent}, ${accent}00)`,
                }}
              />

              <MarkdownContent markdown={post.markdown} />
            </Box>
          )}

          {/* Outside <article>: site navigation is not part of the post content. */}
          {status === 'ready' && post && (
            <>
              <Divider sx={{ mt: 6, mb: 4 }} />
              <BackToBlog label={t('blog.backToBlog')} />
            </>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

const BackToBlog = ({ label }: { label: string }) => (
  <Box
    component={RouterLink}
    to="/blog"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      mb: 4,
      color: 'text.secondary',
      textDecoration: 'none',
      fontSize: '0.9rem',
      fontWeight: 600,
      transition: 'color 0.18s, transform 0.18s',
      '&:hover': { color: 'primary.main', transform: 'translateX(-3px)' },
    }}
  >
    <ArrowBack sx={{ fontSize: '1.05rem' }} />
    {label}
  </Box>
);
