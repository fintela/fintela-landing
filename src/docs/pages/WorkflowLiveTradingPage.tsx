import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead } from '../components/Prose';
import { Callout } from '../components/Callout';
import { Steps, Step } from '../components/Steps';
import { NavPath } from '../components/NavPath';

const toc = [
  { id: 'overview', title: 'Overview', level: 2 as const },
  { id: 'connect-broker', title: 'Connect your brokerage', level: 2 as const },
  { id: 'promote-portfolio', title: 'Promote a portfolio', level: 2 as const },
  { id: 'create-agent', title: 'Start an operation', level: 2 as const },
  { id: 'monitor-agent', title: 'Monitor the operation', level: 2 as const },
  { id: 'stop-agent', title: 'Pause, stop, re-initiate', level: 2 as const },
  { id: 'paper-trading', title: 'Paper trading', level: 2 as const },
  { id: 'risk-warnings', title: 'Risk considerations', level: 2 as const },
];

export const WorkflowLiveTradingPage = () => (
  <DocsLayout
    pageId="workflow-live"
    breadcrumbs={[{ label: 'Workflows' }, { label: 'Live trading' }]}
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

    <Heading id="live-trading-workflow" level={1}>
      Live trading
    </Heading>

    <Lead>
      Once you've found a strategy parameter set you're confident in, you can promote
      it to a live portfolio, group it into a basket, and trade that basket through
      your connected brokerage. This page walks through every step.
    </Lead>

    <Callout variant="danger" title="Real capital">
      An operation places real orders against your brokerage account with real money.
      Always validate thoroughly on a paper connection before trading live.
      Fintela does not guarantee any trading outcome.
    </Callout>

    <Heading id="overview" level={2}>
      Overview
    </Heading>

    <P>
      The live trading flow has three stages:
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
{`1. Connect your brokerage  (Account settings → Broker connections)
2. Promote a portfolio     (Analytics → Portfolios → Promote)
3. Trade a basket          (Portfolio Manager → Operations)`}
    </Box>

    <Heading id="connect-broker" level={2}>
      Connect your brokerage
    </Heading>

    <NavPath steps={['Account settings', 'Broker connections', 'Connect your brokerage']} />

    <P>
      Broker credentials are configured once at the organization level and shared
      across every operation. One brokerage integration is supported today:
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
        {
          broker: 'Alpaca',
          method: 'OAuth · API key',
          desc: 'Link your existing brokerage account over OAuth — no API keys to copy or store. An API key + secret path is available as an advanced fallback. Paper and live accounts are separate connections.',
        },
      ].map((row, idx, arr) => (
        <Box
          key={row.broker}
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mb: 0.5, alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{row.broker}</Typography>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: 'rgba(102,126,234,0.1)',
                border: '1px solid rgba(102,126,234,0.2)',
                fontSize: '0.7rem',
                fontFamily: '"JetBrains Mono", monospace',
                color: '#667eea',
              }}
            >
              {row.method}
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Steps>
      <Step number={1} title="Open Account settings → Broker connections">
        Open the avatar menu in the top-right, click <strong>Account settings</strong>,
        and find the <strong>Broker connections</strong> card.
      </Step>
      <Step number={2} title="Click Connect your brokerage">
        Name the connection and pick its environment:{' '}
        <strong>Paper (recommended)</strong> or <strong>Live</strong>. The environment
        belongs to the connection, not to the operations you later run on it.
      </Step>
      <Step number={3} title="Authorize with your brokerage">
        Click <strong>Connect with your brokerage</strong> to link your existing account
        over OAuth. If you'd rather use keys, expand{' '}
        <strong>Connect with API key instead (advanced)</strong> and paste your{' '}
        <strong>API Key ID</strong> and <strong>API Secret</strong>. Either way Fintela
        verifies the credentials against your brokerage before storing them — if the
        brokerage rejects them, the dialog shows the broker's own error message rather
        than a generic one.
      </Step>
    </Steps>

    <Callout variant="info">
      Credentials are encrypted at rest and never visible after initial entry. You can hold
      one connection per broker and environment (paper / live) in each organization. To
      replace an API key, use <strong>Rotate credentials</strong> — the new key is verified
      against the broker before it replaces the old one, and it swaps in place, so running
      operations stay on the same connection. OAuth connections are refreshed by
      reconnecting.
    </Callout>

    <Callout variant="warning" title="Revoked connections auto-pause">
      Fintela re-checks each connection every 5 minutes. A single 401/403 never revokes
      anything — the check has to fail authentication <strong>twice in a row</strong>
      (roughly 10 minutes) before the connection is marked <strong>revoked</strong>, so a
      transient blip can't auto-pause live trading. A genuinely dead credential — key
      revoked, account suspended — fails every check and does get there. Once revoked,
      every operation running on the connection is paused automatically. Reconnect to
      resume.
    </Callout>

    <Heading id="promote-portfolio" level={2}>
      Promote a portfolio
    </Heading>

    <NavPath steps={['Analytics', 'Portfolios', 'Select portfolio', 'Promote']} />

    <P>
      Before you can trade, you need to <strong>promote</strong> a portfolio from a
      completed study. Promotion marks a specific trial's parameter set as the one to
      use for live signal generation. Operations don't run on a portfolio directly —
      they invest a <strong>basket</strong>, which is how you group one or more promoted
      portfolios under a shared set of trading rules.
    </P>

    <Steps>
      <Step number={1} title="Open Analytics → Portfolios">
        Select the study you want to deploy from the study filter.
      </Step>
      <Step number={2} title="Choose a trial">
        Sort by your preferred metric and select the portfolio you want to deploy.
        Review the equity curve, drawdown, and trade history one more time before
        committing.
      </Step>
      <Step number={3} title="Click Promote">
        The Promote action is available in the portfolio detail view (action menu in
        the top-right of the portfolio card). You'll be asked to confirm, since promotion
        is a signal that you intend to use this result in production.
      </Step>
    </Steps>

    <Callout variant="tip">
      You can have multiple promoted portfolios at the same time, and a basket can hold
      several of them. You can also run more than one operation against the same brokerage
      connection — each keeps its own ledger, so stopping one only liquidates what that
      operation bought.
    </Callout>

    <Heading id="create-agent" level={2}>
      Start an operation
    </Heading>

    <NavPath steps={['Portfolio Manager', 'Open a basket', 'Operations', 'Trade with your brokerage']} />

    <Steps>
      <Step number={1} title="Open Portfolio Manager → your basket → Operations">
        Click <strong>Portfolio Manager</strong> in the sidebar (under{' '}
        <strong>Registry</strong>), open the basket you want to trade, and select the{' '}
        <strong>Operations</strong> tab. Each trading session invests this basket through
        one broker account.
      </Step>
      <Step number={2} title="Click Trade with your brokerage">
        A wizard opens asking which connection to trade through and how much capital to
        commit. The trading rules themselves live on the basket.
      </Step>
      <Step number={3} title="Configure the operation">
        Fill in:
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            overflow: 'hidden',
            mt: 1.5,
          }}
        >
          {[
            { field: 'Basket', desc: 'The basket this operation invests. Its members and trading rules come with it.' },
            { field: 'Connection', desc: 'One of your brokerage connections. The operation inherits that connection\'s environment — there is no paper / live switch here.' },
            { field: 'Capital ($)', desc: 'The total dollars this operation may put to work — used to compute position sizes from allocation percentages.' },
          ].map((row, idx, arr) => (
            <Box
              key={row.field}
              sx={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr',
                gap: 2,
                px: 1.5,
                py: 1,
                borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{row.field}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{row.desc}</Typography>
            </Box>
          ))}
        </Box>
      </Step>
      <Step number={4} title="Launch">
        Click <strong>Launch</strong>. The operation moves from <strong>DRAFT</strong> to{' '}
        <strong>ACTIVE</strong>, places its initial buys, and rebalances from then on as
        new signals come due.
      </Step>
    </Steps>

    <Heading id="monitor-agent" level={2}>
      Monitor the operation
    </Heading>

    <NavPath steps={['Operations', 'Select an operation', 'Details']} />

    <P>
      Select an operation and open <strong>Details</strong>. Five tabs cover everything
      it has done:
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
        { label: 'Allocations', desc: 'The per-member and per-ticker dollar targets this operation last computed.' },
        { label: 'Orders', desc: 'Audit trail of every order: side, quantity, price, and fill status — plus the broker\'s own error message when one is rejected.' },
        { label: 'Activity', desc: 'Every state change with actor, event, and timestamp — launches, pauses, rebalance requests, detected drift.' },
        { label: 'Reconciliation', desc: 'One row per trading day comparing Fintela\'s ledger against the broker\'s record of the account.' },
        { label: 'Positions', desc: 'Live positions on the whole brokerage account behind the connection — account-wide, not segmented by basket, so anything held by another operation or by your own manual trading shows up here too.' },
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

    <Callout variant="info" title="Risk managers stay active">
      If the promoted portfolio was produced with risk managers attached, those same
      risk managers keep running as the portfolio advances day to day — on each new
      day the engine runs them first, on the portfolio from the previous day, and
      then the strategy's rebalance. Their state carries across days, so a protection
      like a trailing stop remembers the levels it has already seen. Any notable events
      are recorded in the portfolio's risk manager execution log. See{' '}
      <Box
        component="a"
        href="/documentation/workflows/risk-managers#when-they-act"
        sx={{ color: '#667eea' }}
      >
        When they act
      </Box>{' '}
      for the per-step ordering.
    </Callout>

    <Heading id="stop-agent" level={2}>
      Pause, stop, re-initiate
    </Heading>

    <P>
      An operation can be halted at any time, and what happens to your positions depends
      on which verb you use. <strong>Pause</strong> keeps them; <strong>Stop</strong>{' '}
      liquidates them. Stop only sells what <em>this</em> operation bought — anything you
      hold from another operation or from your own manual trading is left alone.
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
        { action: 'Launch', desc: 'Places the initial buy and starts trading (DRAFT → ACTIVE).' },
        { action: 'Pause', desc: 'Stops rebalancing but keeps current positions (ACTIVE → PAUSED).' },
        { action: 'Resume', desc: 'Resumes rebalancing and re-buys into the market (PAUSED → ACTIVE).' },
        { action: 'Stop', desc: 'Liquidates the positions this operation opened and stops it. Terminal.' },
        { action: 'Force stop', desc: 'Only when the connection is revoked and liquidation is impossible: marks the operation STOPPED locally so you can delete it. Your positions are NOT sold — close them with your brokerage.' },
        { action: 'Re-initiate', desc: 'Resets a stopped operation back to DRAFT so it can be launched again. History is kept.' },
        { action: 'Rebalance', desc: 'Recomputes the member weights now; the orchestrator acts on its next tick.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.action}
          sx={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{row.action}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Heading id="paper-trading" level={2}>
      Paper trading
    </Heading>

    <P>
      Paper trading runs the full workflow against your brokerage's paper account — every signal
      is processed and every order is placed, but against simulated capital. This is
      strongly recommended before you put real money behind a strategy.
    </P>
    <P>
      Paper or live is decided <strong>when you connect the account</strong>, not when
      you launch: pick <strong>Paper (recommended)</strong> in the{' '}
      <strong>Connect your brokerage</strong> dialog and every operation on that connection is
      paper. To go live later, connect the live account as a separate connection and
      point a new operation at it. The UI is identical either way — the connection is
      what differs.
    </P>
    <Callout variant="info" title="Live is not open yet">
      The <strong>Live</strong> environment is disabled in the Connect your brokerage dialog
      pending brokerage approval of the Fintela OAuth app. Paper is available today.
    </Callout>

    <Heading id="risk-warnings" level={2}>
      Risk considerations
    </Heading>

    <Callout variant="danger">
      <strong>Backtested performance does not guarantee future results.</strong> A
      strategy that performed well in backtesting may perform poorly or incur losses
      in live trading due to market regime changes, slippage, execution delays, and
      data differences. Always size positions conservatively and monitor operations
      actively.
    </Callout>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'rgba(239,68,68,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
        bgcolor: 'rgba(239,68,68,0.04)',
      }}
    >
      {[
        { risk: 'Slippage', desc: 'Live fill prices differ from backtest prices. Illiquid tickers may see significant slippage on entry/exit.' },
        { risk: 'Execution latency', desc: 'Orders are placed at next-open after a signal date. Intraday moves between signal and fill are unaccounted for in backtests.' },
        { risk: 'Data differences', desc: 'The data used in backtesting may differ from the real-time data feed. Adjusted close prices vs. actual fill prices at market open.' },
        { risk: 'Connection loss', desc: 'If your brokerage revokes the connection, its operations are auto-paused and no further orders go out until you reconnect. Watch for the revoked banner.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.risk}
          sx={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'rgba(239,68,68,0.15)',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#ef4444' }}>{row.risk}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>
  </DocsLayout>
);
