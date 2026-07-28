import { useState, type ReactNode } from 'react';
import { Box, Chip, CircularProgress, Container, Typography } from '@mui/material';
import { AutoStories, WifiOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { BlogCard } from '../blog/BlogCard';
import { useBlogIndex } from '../blog/useBlog';

/**
 * `/blog` — the card grid.
 *
 * Posts are Markdown files in `landing/content/blog/`, published as static JSON
 * under `blog/` on the CDN by `blog-publish.yml` (see `BLOG.md`). Adding a
 * post is a sync of that one prefix, not a site deploy — which is why this page
 * fetches at runtime instead of reading posts bundled into the app.
 */
export const BlogPage = () => {
  const { t } = useTranslation('pages');
  const [activeSection, setActiveSection] = useState('blog');
  const { status, posts } = useBlogIndex();

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    if (section === 'home') {
      window.location.href = '/';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header activeSection={activeSection} onNavigate={scrollToSection} />

      {/* Hero */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 4, md: 8 },
          background:
            'linear-gradient(180deg, rgba(102, 126, 234, 0.05) 0%, rgba(240, 147, 251, 0.05) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Chip
              label={t('blog.hero.chip')}
              sx={{
                mb: 3,
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                color: 'text.primary',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              }}
            >
              {t('blog.hero.title')}
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto', lineHeight: 1.6 }}
            >
              {t('blog.hero.subtitle')}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Grid */}
      <Box sx={{ py: { xs: 4, md: 8 }, minHeight: '40vh' }}>
        <Container maxWidth="lg">
          {status === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress size={28} sx={{ color: '#667eea' }} />
            </Box>
          )}

          {status !== 'loading' && posts.length === 0 && (
            <EmptyState
              // An unreachable CDN payload and a genuinely empty blog look the same
              // to a visitor, but the copy should not pretend a failure is "no posts".
              icon={status === 'error' ? <WifiOff /> : <AutoStories />}
              title={status === 'error' ? t('blog.error.title') : t('blog.empty.title')}
              body={status === 'error' ? t('blog.error.body') : t('blog.empty.body')}
            />
          )}

          {posts.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 4,
              }}
            >
              {/* The generator already sorts newest-first. */}
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </Box>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

const EmptyState = ({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) => (
  <Box sx={{ textAlign: 'center', py: { xs: 6, md: 10 }, px: 2 }}>
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
      {icon}
    </Box>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
      {title}
    </Typography>
    <Typography sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
      {body}
    </Typography>
  </Box>
);
