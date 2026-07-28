import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead } from '../components/Prose';
import { Callout } from '../components/Callout';
import { Steps, Step } from '../components/Steps';
import { NavPath } from '../components/NavPath';

const toc = [
  { id: 'overview', title: 'Overview', level: 2 as const },
  { id: 'portfolio-dashboard', title: 'Portfolio dashboard', level: 2 as const },
  { id: 'filtering-sorting', title: 'Filtering and sorting', level: 2 as const },
  { id: 'portfolio-detail', title: 'Portfolio detail', level: 2 as const },
  { id: 'equity-charts', title: 'Equity & drawdown charts', level: 2 as const },
  { id: 'trades', title: 'Trade history', level: 2 as const },
  { id: 'scalings', title: 'Scaling detail', level: 2 as const },
  { id: 'lineage', title: 'Portfolio lineage', level: 2 as const },
  { id: 'pivot', title: 'Pivot table', level: 2 as const },
  { id: 'date-filter', title: 'Custom date windows', level: 2 as const },
];

const METRICS = [
  { name: 'Sharpe ratio', desc: 'Risk-adjusted return — annualized return divided by annualized volatility.' },
  { name: 'Sortino ratio', desc: 'Like Sharpe but only penalizes downside volatility.' },
  { name: 'Calmar ratio', desc: 'CAGR divided by max drawdown. Higher = better return per unit of drawdown.' },
  { name: 'Max drawdown', desc: 'Largest peak-to-trough decline in the equity curve.' },
  { name: 'CAGR', desc: 'Compound Annual Growth Rate — annualized total return.' },
  { name: 'Win rate', desc: 'Fraction of closed trades that ended in profit.' },
  { name: 'Volatility', desc: 'Annualized standard deviation of daily returns.' },
];

export const WorkflowResultsPage = () => (
  <DocsLayout
    pageId="workflow-results"
    breadcrumbs={[{ label: 'Workflows' }, { label: 'Analyzing results' }]}
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
        Workflows
      </Typography>
    </Box>

    <Heading id="results-workflow" level={1}>
      Analyzing results
    </Heading>

    <Lead>
      After a study completes, every trial produces a portfolio — a full backtest
      with equity curve, metrics, trades, and holdings. This page explains how
      to navigate the Analytics section and make sense of what you see.
    </Lead>

    <Heading id="overview" level={2}>
      Overview
    </Heading>

    <P>
      The <strong>Analytics → Portfolios</strong> section is your primary tool for
      comparing optimization results. It shows all portfolios from all studies you've
      run, with tools to filter, sort, chart, and deep-dive into individual trials.
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
{`Analytics → Portfolios
├── Portfolio ranking table (all trials, sortable)
├── Selected portfolio(s) equity charts
├── Drawdown & volatility charts
├── Trade history
├── Holdings snapshot
└── Pivot table (cross-study parameter comparison)`}
    </Box>

    <Heading id="portfolio-dashboard" level={2}>
      Portfolio dashboard
    </Heading>

    <NavPath steps={['Analytics', 'Portfolios']} />

    <P>
      The dashboard loads with a study selector in the top bar. Select one or more
      completed studies to populate the portfolio ranking table.
    </P>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { label: 'Study selector', desc: 'Filter the table to one or more specific studies. Multiple studies can be compared side by side.' },
        { label: 'Portfolio table', desc: 'One row per trial. Columns include all key metrics, parameter values, and study name.' },
        { label: 'View mode toggle', desc: 'Switch between Charts view (equity curves), Pivot view (parameter vs. score table), and Table view (raw metrics).' },
        { label: 'Date filter', desc: 'Restrict metric calculations to a custom date range within the portfolio\'s history.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.label}
          sx={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.label}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Heading id="filtering-sorting" level={2}>
      Filtering and sorting
    </Heading>

    <P>
      Click any column header in the portfolio table to sort by that metric. Available
      sort columns:
    </P>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {METRICS.map((row, idx) => (
        <Box
          key={row.name}
          sx={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 2,
            px: 2,
            py: 1,
            borderBottom: idx < METRICS.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: '"JetBrains Mono", monospace', color: '#667eea' }}>
            {row.name}
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Callout variant="tip">
      Select multiple portfolios in the table (checkbox column on the left) to overlay
      their equity curves in the charts section below the table.
    </Callout>

    <Heading id="portfolio-detail" level={2}>
      Portfolio detail
    </Heading>

    <P>
      Click any row in the portfolio table to open the detail panel. This shows the
      complete result for that single trial:
    </P>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { tab: 'Overview', desc: 'Key metrics cards: total return, Sharpe, max drawdown, win rate, trade count.' },
        { tab: 'Equity', desc: 'Full equity curve from start to end date with zoom controls.' },
        { tab: 'Drawdown', desc: 'Rolling drawdown from peak, with max drawdown annotated.' },
        { tab: 'Trades', desc: 'Complete trade log — see Trade history for details.' },
        { tab: 'Holdings', desc: 'Date-picker to see the portfolio composition on any specific date.' },
        { tab: 'Parameters', desc: 'The exact parameter values used in this trial.' },
        { tab: 'Risk Managers', desc: 'The risk manager configuration this portfolio was produced with, plus an execution log of any notable events.' },
        { tab: 'Lineage', desc: 'The source portfolio this one was derived from, if any, and the portfolios derived from it.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.tab}
          sx={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.tab}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Heading id="equity-charts" level={2}>
      Equity &amp; drawdown charts
    </Heading>

    <P>
      The chart section below the portfolio table shows time-series charts for all
      selected portfolios overlaid on the same axes. Controls include:
    </P>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { control: 'Benchmark overlay', desc: 'Select a benchmark ticker (e.g. SPY) to overlay its performance on the equity chart for comparison.' },
        { control: 'Scaling mode', desc: 'Normalized (all portfolios start at 1.0) or absolute (raw portfolio value). Normalized is easier to compare multiple portfolios.' },
        { control: 'Zoom', desc: 'Click-drag on the chart to zoom into a date range. The metrics bar updates to show metrics for the selected window.' },
        { control: 'Chart type', desc: 'Switch between time series (equity curve) and histogram (return distribution).' },
      ].map((row, idx, arr) => (
        <Box
          key={row.control}
          sx={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.control}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Heading id="trades" level={2}>
      Trade history
    </Heading>

    <P>
      The Trades tab in the portfolio detail shows every simulated trade. Each row contains:
    </P>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        ['Ticker', 'The traded asset.'],
        ['Side', 'L (long) or S (short).'],
        ['Entry / Exit', 'Dates when the position was opened and closed.'],
        ['Entry / Exit price', 'Average fill price at entry and exit.'],
        ['P&L', 'Realized profit or loss for the trade.'],
        ['Total return %', 'Return percentage from entry to exit.'],
        ['MAE / MFE', 'Max Adverse Excursion (worst intra-trade drawdown) and Max Favorable Excursion (best intra-trade gain).'],
        ['Duration', 'Number of calendar days the position was held.'],
      ].map(([field, desc], idx, arr) => (
        <Box
          key={field}
          sx={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 2,
            px: 2,
            py: 1,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{field}</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{desc}</Typography>
        </Box>
      ))}
    </Box>

    <Heading id="scalings" level={2}>
      Scaling detail
    </Heading>

    <P>
      Click any trade to open its detail panel, then click a scaling to expand it
      inline. A scaling is a single scale-in or scale-out within the trade; the
      drill-down shows how that segment performed on its own:
    </P>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        ['MAE / MFE', 'Worst and best excursion within that scaling segment.'],
        ['Efficiency', 'P&L generated per unit of capital injected at the scale-in.'],
        ['Segment return', 'Price move over the scaling segment.'],
        ['Duration', 'Length of the scaling segment, in trading days.'],
        ['Injection', 'Capital added (scale-in) or removed (scale-out) at that point.'],
      ].map(([field, desc], idx, arr) => (
        <Box
          key={field}
          sx={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 2,
            px: 2,
            py: 1,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{field}</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{desc}</Typography>
        </Box>
      ))}
    </Box>

    <P>
      The panel also surfaces two trade-level rollups derived from the scalings:
      the partial-success ratio (the fraction of a trade's scalings that were
      individually profitable) and the capital-weighted hold time (the average
      time scaled-in capital stayed at risk).
    </P>

    <Heading id="lineage" level={2}>
      Portfolio lineage
    </Heading>

    <P>
      A portfolio can be <strong>derived</strong> from another one — most commonly
      through a risk-manager optimization study, where each trial reuses a source
      portfolio's strategy and signals while varying the risk-manager configuration.
      When that happens, the new portfolio keeps a link back to its source.
    </P>
    <P>
      The <strong>Lineage</strong> tab in the portfolio detail shows this family tree:
      the source portfolio above, and every portfolio derived from the current one
      below. It lets you trace where a portfolio came from and compare a source against
      its derivatives side by side — for example, to see exactly how much a given risk
      manager improved drawdown without changing the underlying strategy.
    </P>

    <Callout variant="tip">
      Select a source portfolio and one of its derived portfolios together to overlay
      their equity curves — the clearest way to read the impact of a risk manager.
    </Callout>

    <Heading id="pivot" level={2}>
      Pivot table
    </Heading>

    <P>
      Switch to <strong>Pivot view</strong> in the view mode toggle to open the pivot table.
      This cross-tabulates parameter values against fitness scores, making it easy to see
      which parameter ranges produced the best results across all trials.
    </P>

    <Callout variant="info">
      The pivot table is most useful after a large study (200+ trials) where you can
      see clear patterns — e.g. "n_top between 5 and 8 consistently outperforms".
      It helps inform the bounds for a follow-up refined study.
    </Callout>

    <Heading id="date-filter" level={2}>
      Custom date windows
    </Heading>

    <P>
      The date filter in the top bar lets you evaluate portfolios over a custom
      date range — independent of the original study dates. All metrics in the
      table and charts update to reflect the filtered window.
    </P>

    <Steps>
      <Step number={1} title="Open the date filter">
        Click the date range selector in the top controls bar of the Analytics page.
      </Step>
      <Step number={2} title="Set the range">
        Pick a start and end date using the date pickers, or choose a preset
        period (1Y, 3Y, 5Y, custom).
      </Step>
      <Step number={3} title="Metrics update">
        The portfolio table recomputes all metrics (Sharpe, drawdown, etc.) for the
        selected window. The equity curves are sliced to show only the filtered period.
      </Step>
    </Steps>

    <Callout variant="tip">
      Use custom date windows to evaluate how a strategy would have performed during
      specific market regimes — e.g. the 2020 COVID crash, 2022 bear market, or a
      recent bull run.
    </Callout>
  </DocsLayout>
);
