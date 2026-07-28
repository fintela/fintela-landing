import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import AltRouteOutlinedIcon from '@mui/icons-material/AltRouteOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import type { ReactNode } from 'react';
import { DocsLayout } from '../DocsLayout';
import { gradients } from '../../theme/tokens';

interface QuickStart {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  accent: string;
  badge?: string;
}

const quickStarts: QuickStart[] = [
  {
    icon: <MapOutlinedIcon />,
    title: 'Platform tour',
    description: 'A map of every screen — Registry, Analytics, Agents, and how they connect.',
    href: '/documentation/platform',
    accent: '#667eea',
    badge: '5 min',
  },
  {
    icon: <RocketLaunchOutlinedIcon />,
    title: 'Quickstart',
    description: 'Create a strategy, run an optimization study, and review results — step by step.',
    href: '/documentation/quickstart',
    accent: '#10b981',
    badge: '10 min',
  },
  {
    icon: <HubOutlinedIcon />,
    title: 'Core concepts',
    description: 'Strategies, fitness functions, risk managers, studies, portfolios — the building blocks explained.',
    href: '/documentation/concepts',
    accent: '#f093fb',
  },
  {
    icon: <AltRouteOutlinedIcon />,
    title: 'External strategies',
    description: 'Host your signal generator behind your own HTTPS endpoint.',
    href: '/documentation/modes/external-strategies',
    accent: '#fbbf24',
  },
];

interface WorkflowLink {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
}

const workflowLinks: WorkflowLink[] = [
  {
    icon: <TuneOutlinedIcon />,
    title: 'Managing strategies',
    description: 'Create, validate, and sandbox internal and external strategies.',
    href: '/documentation/workflows/strategies',
  },
  {
    icon: <ShieldOutlinedIcon />,
    title: 'Managing risk managers',
    description: 'Create, version, share, and test the governance layer that protects a portfolio.',
    href: '/documentation/workflows/risk-managers',
  },
  {
    icon: <RocketLaunchOutlinedIcon />,
    title: 'Running optimizations',
    description: 'Configure the 5-step study creation wizard and monitor running trials.',
    href: '/documentation/workflows/studies',
  },
  {
    icon: <BarChartOutlinedIcon />,
    title: 'Analyzing results',
    description: 'Navigate the portfolio dashboard, equity charts, trades, and pivot table.',
    href: '/documentation/workflows/results',
  },
  {
    icon: <ShowChartOutlinedIcon />,
    title: 'Live trading',
    description: 'Connect your brokerage, promote a portfolio, and run an operation on a basket.',
    href: '/documentation/workflows/live-trading',
  },
];

interface TopicGroup {
  title: string;
  description: string;
  icon: ReactNode;
  links: { label: string; href: string; description: string }[];
}

const topics: TopicGroup[] = [
  {
    title: 'Configuration',
    description: 'Internal vs. external execution, sampler selection, and study lifecycle.',
    icon: <AltRouteOutlinedIcon />,
    links: [
      { label: 'Modes overview', href: '/documentation/modes', description: 'The 2×2 mode matrix' },
      { label: 'External strategies', href: '/documentation/modes/external-strategies', description: 'POST /simulate contract' },
      { label: 'External fitness', href: '/documentation/modes/external-fitness', description: 'POST /evaluate contract' },
      { label: 'Sampler selection', href: '/documentation/optimizer/samplers', description: 'TPE, CMA-ES, Random, QMC, NSGA-II' },
      { label: 'Additional data', href: '/documentation/configuration/additional-data', description: 'Groupings, collections, basket holdings' },
    ],
  },
  {
    title: 'Integration Guides',
    description: 'End-to-end recipes for the most common stacks.',
    icon: <IntegrationInstructionsOutlinedIcon />,
    links: [
      { label: 'Python · FastAPI', href: '/documentation/guides/python', description: '50 lines, ready to deploy' },
      { label: 'Node.js · Express', href: '/documentation/guides/node', description: 'JavaScript ecosystem' },
    ],
  },
  {
    title: 'API Reference',
    description: 'Read-only endpoints for retrieving results programmatically.',
    icon: <CodeOutlinedIcon />,
    links: [
      { label: 'API overview', href: '/documentation/api', description: 'Auth, base URL, rate limits' },
      { label: 'Strategies', href: '/documentation/api/strategies', description: 'Definitions, params, versions' },
      { label: 'Studies', href: '/documentation/api/studies', description: 'Progress, health, history' },
      { label: 'Trials & portfolios', href: '/documentation/api/trials-portfolios', description: 'Trials and promoted portfolios' },
      { label: 'Baskets', href: '/documentation/api/baskets', description: 'Operations, allocations, orders' },
      { label: 'Fitness & data', href: '/documentation/api/fitness-data', description: 'Fitness functions, asset groups' },
      { label: 'Errors', href: '/documentation/api/errors', description: 'HTTP codes, trial failures' },
    ],
  },
];

export const DocsHomePage = () => {
  return (
    <DocsLayout pageId="overview" breadcrumbs={[{ label: 'Overview' }]} toc={[]}>
      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          mb: { xs: 5, md: 7 },
          p: { xs: 3.5, md: 5 },
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
          border: '1px solid',
          borderColor: 'rgba(102,126,234,0.18)',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -120,
            right: -100,
            width: 360,
            height: 360,
            background: 'radial-gradient(circle, rgba(240,147,251,0.16) 0%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 280,
            height: 280,
            background: 'radial-gradient(circle, rgba(102,126,234,0.18) 0%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ position: 'relative' }}>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#667eea',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              mb: 1.25,
            }}
          >
            Fintela documentation
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2rem', md: '2.75rem' },
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'text.primary',
              mb: 2,
            }}
          >
            From strategy idea{' '}
            <Box
              component="span"
              sx={{
                background: gradients.brand,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              to live portfolio.
            </Box>
          </Typography>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '1rem', md: '1.1rem' },
              lineHeight: 1.6,
              maxWidth: 600,
              mb: 3,
            }}
          >
            Write a strategy, run a Bayesian parameter search, review the results,
            and connect a broker agent — all from the Fintela UI. The API and external
            modes are there when you need them.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
            <Box
              component={RouterLink}
              to="/documentation/platform"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2.5,
                py: 1.2,
                borderRadius: 2,
                background: gradients.brand,
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.92rem',
                textDecoration: 'none',
                boxShadow: '0 12px 28px rgba(102,126,234,0.28)',
                transition: 'transform 0.18s, box-shadow 0.18s',
                '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 16px 32px rgba(102,126,234,0.36)' },
              }}
            >
              Take the platform tour
              <ArrowForwardIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box
              component={RouterLink}
              to="/documentation/quickstart"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2.5,
                py: 1.2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#fff',
                color: 'text.primary',
                fontWeight: 600,
                fontSize: '0.92rem',
                textDecoration: 'none',
                transition: 'border-color 0.18s',
                '&:hover': { borderColor: 'rgba(102,126,234,0.4)' },
              }}
            >
              Start the quickstart
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Start here grid */}
      <Box sx={{ mb: { xs: 5, md: 7 } }}>
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'text.disabled',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            mb: 1.5,
          }}
        >
          Start here
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          {quickStarts.map((q) => (
            <QuickStartCard key={q.title} {...q} />
          ))}
        </Box>
      </Box>

      {/* Workflows — primary section */}
      <Box sx={{ mb: { xs: 5, md: 7 } }}>
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'text.disabled',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            mb: 0.5,
          }}
        >
          Workflows
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', mb: 2 }}>
          Step-by-step guides for every major task in the UI.
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 1.5,
          }}
        >
          {workflowLinks.map((w) => (
            <WorkflowCard key={w.href} {...w} />
          ))}
        </Box>
      </Box>

      {/* Browse by topic */}
      <Box sx={{ mb: { xs: 4, md: 6 } }}>
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'text.disabled',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            mb: 1.5,
          }}
        >
          Reference
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {topics.map((t) => (
            <TopicCard key={t.title} {...t} />
          ))}
        </Box>
      </Box>
    </DocsLayout>
  );
};

const QuickStartCard = ({ icon, title, description, href, accent, badge }: QuickStart) => (
  <Box
    component={RouterLink}
    to={href}
    sx={{
      position: 'relative',
      p: 2.5,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: '#fff',
      textDecoration: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.25,
      transition: 'transform 0.18s, border-color 0.18s, box-shadow 0.18s',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(120% 80% at 100% 0%, ${accent}10 0%, transparent 60%)`,
        opacity: 0,
        transition: 'opacity 0.22s',
        pointerEvents: 'none',
      },
      '&:hover': {
        borderColor: `${accent}66`,
        transform: 'translateY(-2px)',
        boxShadow: `0 14px 32px ${accent}22`,
        '&::before': { opacity: 1 },
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          background: `${accent}15`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${accent}25`,
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary', flex: 1, letterSpacing: '-0.01em' }}>
        {title}
      </Typography>
      {badge && (
        <Box sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {badge}
        </Box>
      )}
    </Box>
    <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.55 }}>
      {description}
    </Typography>
  </Box>
);

const WorkflowCard = ({ icon, title, description, href }: WorkflowLink) => (
  <Box
    component={RouterLink}
    to={href}
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.75,
      p: 2,
      borderRadius: 2.5,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: '#fff',
      textDecoration: 'none',
      transition: 'border-color 0.18s, background 0.18s',
      '&:hover': {
        borderColor: 'rgba(102,126,234,0.3)',
        bgcolor: 'rgba(102,126,234,0.02)',
      },
      '&:hover .wf-arrow': { transform: 'translateX(3px)', color: '#667eea' },
    }}
  >
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: 1.25,
        background: 'rgba(102,126,234,0.08)',
        color: '#667eea',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid rgba(102,126,234,0.18)',
        '& svg': { fontSize: 18 },
        mt: 0.125,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: 'text.primary', mb: 0.25 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.5 }}>
        {description}
      </Typography>
    </Box>
    <ArrowForwardIcon
      className="wf-arrow"
      sx={{ fontSize: 16, color: 'text.disabled', transition: 'transform 0.18s, color 0.18s', mt: 0.5, flexShrink: 0 }}
    />
  </Box>
);

const TopicCard = ({ title, description, icon, links }: TopicGroup) => (
  <Box
    sx={{
      p: { xs: 2.5, md: 3 },
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: '#fff',
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '240px 1fr' },
      gap: { xs: 2, md: 4 },
    }}
  >
    <Box>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          background: 'rgba(102,126,234,0.08)',
          color: '#667eea',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.25,
          border: '1px solid rgba(102,126,234,0.18)',
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.05rem', letterSpacing: '-0.015em' }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.55, mt: 0.5 }}>
        {description}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      {links.map((l) => (
        <Box
          key={l.href}
          component={RouterLink}
          to={l.href}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.25,
            py: 1.25,
            borderRadius: 1.5,
            textDecoration: 'none',
            color: 'text.primary',
            transition: 'background 0.18s',
            '&:hover': { bgcolor: 'rgba(102,126,234,0.04)' },
            '&:hover .topic-arrow': { transform: 'translateX(3px)', color: '#667eea' },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.92rem' }}>{l.label}</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.5 }}>
              {l.description}
            </Typography>
          </Box>
          <ArrowForwardIcon
            className="topic-arrow"
            sx={{
              fontSize: 16,
              color: 'text.disabled',
              transition: 'transform 0.18s, color 0.18s',
            }}
          />
        </Box>
      ))}
    </Box>
  </Box>
);
