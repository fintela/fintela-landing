import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import BarChartIcon from '@mui/icons-material/BarChart';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import type { ReactNode } from 'react';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead } from '../components/Prose';
import { Callout } from '../components/Callout';

const toc = [
  { id: 'navigation', title: 'Navigation structure', level: 2 as const },
  { id: 'analysis', title: 'Analysis', level: 2 as const },
  { id: 'registry', title: 'Registry', level: 2 as const },
  { id: 'workspace', title: 'Account settings', level: 2 as const },
  { id: 'ui-conventions', title: 'UI conventions', level: 2 as const },
];

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  accent: string;
  description: string;
  subsections: { label: string; desc: string }[];
  href: string;
}

const SectionCard = ({ icon, title, accent, description, subsections, href }: SectionCardProps) => (
  <Box
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2.5,
      overflow: 'hidden',
      mb: 0,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: 2.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: `${accent}08`,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          bgcolor: `${accent}18`,
          border: `1px solid ${accent}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.5 }}>
          {description}
        </Typography>
      </Box>
    </Box>
    <Box>
      {subsections.map((sub, idx) => (
        <Box
          key={idx}
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 2,
            px: 2.5,
            py: 1.25,
            borderBottom: idx < subsections.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: accent,
              minWidth: 140,
              flexShrink: 0,
            }}
          >
            {sub.label}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.5 }}>
            {sub.desc}
          </Typography>
        </Box>
      ))}
    </Box>
    <Box
      sx={{
        px: 2.5,
        py: 1.25,
        bgcolor: 'rgba(0,0,0,0.02)',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        component={RouterLink}
        to={href}
        sx={{
          fontSize: '0.8rem',
          color: accent,
          textDecoration: 'none',
          fontWeight: 600,
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        Learn more →
      </Box>
    </Box>
  </Box>
);

const UIConvention = ({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: string;
}) => (
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', py: 1 }}>
    <Box
      sx={{
        px: 1.25,
        py: 0.35,
        borderRadius: 1,
        bgcolor: `${color}18`,
        border: `1px solid ${color}33`,
        color,
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        flexShrink: 0,
        minWidth: 80,
        textAlign: 'center',
      }}
    >
      {label}
    </Box>
    <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6, pt: 0.2 }}>
      {children}
    </Typography>
  </Box>
);

export const PlatformTourPage = () => (
  <DocsLayout
    pageId="platform"
    breadcrumbs={[{ label: 'Getting Started' }, { label: 'Platform tour' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography
        sx={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#667eea',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Getting Started
      </Typography>
    </Box>

    <Heading id="platform-tour" level={1}>
      Platform tour
    </Heading>

    <Lead>
      A map of the Fintela UI — every section, what it contains, and how the pieces connect.
      Read this before the quickstart so you know where to click.
    </Lead>

    <Heading id="navigation" level={2}>
      Navigation structure
    </Heading>
    <P>
      The Fintela app is organized into three sections in the left sidebar —
      <strong> Analysis</strong>, <strong>Registry</strong>, and <strong>AI</strong>,
      the last of which appears only if your role grants access to the AI assistant.
      Team management isn't in the sidebar at all — it lives in Account settings. The
      sidebar collapses to icons on desktop and opens as a full drawer on mobile.
    </P>

    <Box
      component="pre"
      sx={{
        my: 3,
        p: 2.5,
        borderRadius: 2,
        bgcolor: '#0f1325',
        color: '#e6e8f0',
        fontSize: '0.82rem',
        fontFamily: '"JetBrains Mono", monospace',
        lineHeight: 1.8,
        overflowX: 'auto',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
{`Fintela App
├── Analysis              ← Inspect results & explore markets
│   ├── Home
│   ├── Portfolios
│   ├── Markets
│   └── Data Explorer
│
├── Registry              ← Build & deploy
│   ├── Data Pipelines
│   ├── Asset Groups
│   ├── Strategies
│   ├── Fitness Functions
│   ├── Studies
│   ├── Risk Managers
│   └── Portfolio Manager
│
└── AI                    ← Ask questions in plain language
    └── Fintelligent`}
    </Box>

    <Callout variant="tip">
      The natural workflow moves between Registry and Analysis: define your building blocks
      in <strong>Registry</strong> (asset groups → strategies → fitness functions → studies),
      then inspect results in <strong>Analysis</strong> (Portfolios), and deploy via
      <strong> Registry → Portfolio Manager</strong>.
    </Callout>

    <Heading id="analysis" level={2}>
      Analysis
    </Heading>
    <P>
      The Analysis section is where you monitor results and explore live market data.
      Home gives you an overview dashboard; Portfolios lets you deep-dive into
      optimization results; Markets shows live price data for any instrument.
    </P>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 3 }}>
      <SectionCard
        icon={<BarChartIcon />}
        accent="#fbbf24"
        title="Analysis → Portfolios"
        description="Compare trial results across completed studies. Sort, filter, and deep-dive into individual portfolio performance."
        subsections={[
          { label: 'Portfolio dashboard', desc: 'Ranked table of all portfolios from selected studies. Sort by Sharpe, Calmar, max drawdown, CAGR, win rate.' },
          { label: 'Equity charts', desc: 'Time-series equity curves with benchmark overlay, drawdown chart, and volatility chart.' },
          { label: 'Trade history', desc: 'Full list of simulated trades: entry/exit dates, P&L, MAE, MFE. Click a trade, then a scaling, to drill into per-scale efficiency, MAE/MFE, and segment return.' },
          { label: 'Holdings', desc: 'Position snapshot for any date — ticker allocations and portfolio weights.' },
          { label: 'Risk managers', desc: 'The risk manager configuration the portfolio was produced with, plus an execution log for diagnosis.' },
          { label: 'Lineage', desc: 'If the portfolio was derived from another, the link back to its source — trace and compare a family of related portfolios.' },
          { label: 'Pivot table', desc: 'Cross-study parameter comparison — see how each parameter value affected the fitness score.' },
        ]}
        href="/documentation/workflows/results"
      />
    </Box>

    <Heading id="registry" level={2}>
      Registry
    </Heading>
    <P>
      The Registry is where you define and manage every building block of the
      optimization system — data, strategies, fitness functions, studies, and live
      agents. Items appear in the sidebar ordered from foundational (data) to
      deployment (agents).
    </P>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 3 }}>
      <SectionCard
        icon={<TableChartOutlinedIcon />}
        accent="#3b82f6"
        title="Registry → Asset Groups"
        description="Create and manage market data snapshots that provide the price history your strategies run on."
        subsections={[
          { label: 'Cluster list', desc: 'All asset groups with ticker count, date range, and timeframe.' },
          { label: 'Create cluster', desc: 'Select tickers, set start/end dates, and choose a candle resolution (1d, 1h, etc.).' },
          { label: 'Coverage report', desc: 'See which tickers have full coverage vs. partial data for the selected date range.' },
          { label: 'Index members', desc: 'Automatically include tickers from a market index (e.g., S&P 500 constituents) on each date.' },
          { label: 'Pre-built groupings', desc: 'Skip cluster creation — pick the Sector ETFs, an index, a sector, an industry, or a country directly as a study universe.' },
          { label: 'Baskets as assets', desc: 'Feed a cluster with your own graduated baskets — each portfolio\'s equity curve becomes an input series — to optimize meta-strategies (portfolios of portfolios).' },
        ]}
        href="/documentation/concepts#data-clusters"
      />

      <SectionCard
        icon={<FunctionsOutlinedIcon />}
        accent="#f093fb"
        title="Registry → Fitness Functions"
        description="Define how a completed backtest simulation is scored — the objective the optimizer maximizes."
        subsections={[
          { label: 'Fitness list', desc: 'All fitness functions with name, execution type, and linked studies.' },
          { label: 'Create fitness', desc: 'Write Python that receives the simulation result and returns a single float score.' },
          { label: 'Built-in scorers', desc: 'Sharpe ratio, Sortino, Calmar, max drawdown are available as one-liners.' },
        ]}
        href="/documentation/concepts#fitness-functions"
      />

      <SectionCard
        icon={<ScienceOutlinedIcon />}
        accent="#667eea"
        title="Registry → Strategies"
        description="Write and manage the Python functions (or external endpoints) that generate trading signals for each trial."
        subsections={[
          { label: 'Strategy list', desc: 'All strategies in your organization, with name, type (internal/external), and linked study count.' },
          { label: 'Create strategy', desc: 'Choose internal (Python editor) or external (HTTPS endpoint). Define parameter names and types.' },
          { label: 'Edit / validate', desc: 'Edit code inline with Monaco editor. Click Validate + Save to run a live test before saving.' },
          { label: 'Sandbox', desc: 'Test your strategy on real data with a specific parameter set before running a full study.' },
        ]}
        href="/documentation/workflows/strategies"
      />

      <SectionCard
        icon={<ShieldOutlinedIcon />}
        accent="#0ea5e9"
        title="Registry → Risk Managers"
        description="Create and manage the governance layer that protects a portfolio during a backtest — built-in rules, rule-based combinations, custom logic, or your own endpoint."
        subsections={[
          { label: 'Risk manager list', desc: 'All risk managers with name, kind, version, and whether they are publicly shared.' },
          { label: 'Create risk manager', desc: 'Choose built-in, rule-based (no code), custom (Python), or external (your endpoint).' },
          { label: 'Versioning & history', desc: 'Every edit is preserved as a version. Review what changed and when.' },
          { label: 'Public catalog', desc: 'Share a risk manager with other organizations, or derive a copy from one shared with you.' },
          { label: 'Sandbox', desc: 'Test a risk manager alongside a strategy on real data before attaching it to a study.' },
        ]}
        href="/documentation/workflows/risk-managers"
      />

      <SectionCard
        icon={<TuneIcon />}
        accent="#10b981"
        title="Registry → Studies"
        description="Bind a strategy + fitness + asset group + parameter bounds, then launch the optimization run."
        subsections={[
          { label: 'Study list', desc: 'All studies with live status badges (QUEUED, RUNNING, COMPLETED, FAILED, PAUSED).' },
          { label: 'Create study', desc: '5-step wizard: select strategy + fitness → pick the universe (a asset group OR a pre-built grouping like the Sector ETFs / an index) → set dates → configure sampler → set parameter bounds.' },
          { label: 'Study detail', desc: 'Monitor progress, view trial health, inspect per-trial results.' },
          { label: 'Pause / resume', desc: 'Studies can be paused and resumed without losing completed trial results.' },
        ]}
        href="/documentation/workflows/studies"
      />

      <SectionCard
        icon={<SmartToyOutlinedIcon />}
        accent="#ef4444"
        title="Registry → Portfolio Manager"
        description="Group promoted portfolios into baskets and invest them through a live brokerage account, routing real orders in real time based on strategy signals."
        subsections={[
          { label: 'Operations', desc: 'Every trading session on a basket, with its status, connection, and committed capital.' },
          { label: 'Connect your brokerage', desc: 'Link your account under Account settings → Broker connections. Operations inherit that connection\'s paper or live environment.' },
          { label: 'Launch / pause / stop', desc: 'Pause keeps positions; Stop liquidates what the operation bought. A stopped operation can be re-initiated.' },
          { label: 'Orders', desc: 'Audit trail of every order placed, filled, or rejected by the broker, under an operation\'s Details.' },
        ]}
        href="/documentation/workflows/live-trading"
      />
    </Box>

    <Heading id="workspace" level={2}>
      Account settings
    </Heading>
    <P>
      Account settings lives in the avatar menu in the top-right, not in the sidebar.
      Alongside your broker connections it holds team management, which is editable
      only by organization admins (users with the <code>users:manage</code> permission).
    </P>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 3,
      }}
    >
      {[
        { label: 'Organization', desc: 'Manage team members, roles, and permissions across your organization.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.label}
          sx={{
            display: 'flex',
            gap: 2,
            px: 2.5,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              minWidth: 120,
              flexShrink: 0,
            }}
          >
            {row.label}
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {row.desc}
          </Typography>
        </Box>
      ))}
    </Box>

    <Heading id="ui-conventions" level={2}>
      UI conventions
    </Heading>
    <P>
      A few recurring patterns appear throughout the Fintela UI that are worth
      knowing before you start exploring.
    </P>

    <Box sx={{ my: 3 }}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.02)' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Status badges</Typography>
        </Box>
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <UIConvention label="QUEUED" color="#64748b">Waiting for an available worker slot. The study was created but hasn't started executing yet.</UIConvention>
          <UIConvention label="RUNNING" color="#3b82f6">Trials are actively being sampled and simulated. The progress bar updates in real time.</UIConvention>
          <UIConvention label="COMPLETED" color="#10b981">All n_trials finished. Results are available in Analytics → Portfolios.</UIConvention>
          <UIConvention label="PAUSED" color="#8b5cf6">Manually paused. No new trials are dispatched, but completed results are preserved. Can be resumed.</UIConvention>
          <UIConvention label="FAILED" color="#ef4444">A fatal error stopped the run. Check the study detail page for the error message.</UIConvention>
          <UIConvention label="STOPPED" color="#6b7280">Manually stopped before completion. Results from completed trials are still available.</UIConvention>
        </Box>
      </Box>
    </Box>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 3,
      }}
    >
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.02)' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Execution type badges</Typography>
      </Box>
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <UIConvention label="INTERNAL" color="#667eea">Python code stored in Fintela and executed in-process. Edit directly in the browser code editor.</UIConvention>
        <UIConvention label="EXTERNAL" color="#f093fb">Your own HTTPS endpoint. Fintela calls it once per trial. Code never leaves your infrastructure.</UIConvention>
      </Box>
    </Box>

    <Callout variant="info">
      The platform is designed so that everything you see in the UI can also be
      done programmatically via the REST API. The API documentation mirrors the
      UI workflows exactly — read the UI docs first if you're new, then refer to
      the{' '}
      <Box component="a" href="/documentation/api" sx={{ color: '#667eea' }}>
        API reference
      </Box>{' '}
      for automation.
    </Callout>
  </DocsLayout>
);
