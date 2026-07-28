import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead } from '../components/Prose';
import { Callout } from '../components/Callout';
import { NavPath } from '../components/NavPath';
import { DataTable } from '../components/DataTable';
import { CodeBlock } from '../components/CodeBlock';

const toc = [
  { id: 'overview', title: 'Overview', level: 2 as const },
  { id: 'what', title: 'What additional data covers', level: 2 as const },
  { id: 'volume', title: 'Trading volume', level: 2 as const },
  { id: 'alt-data', title: 'Alternative data', level: 2 as const },
  { id: 'external', title: 'Bring your own data', level: 2 as const },
  { id: 'who', title: 'Which components can use it', level: 2 as const },
  { id: 'declare', title: 'Wiring a pipeline', level: 2 as const },
  { id: 'resolved', title: 'Context resolved automatically', level: 2 as const },
  { id: 'clusters', title: 'Relationship to asset groups', level: 2 as const },
];

const VOLUME_EXAMPLE = `# volume — table aligned to \`data\` (prices): rows = dates, cols = instruments
#               AAPL        MSFT        AMZN
# 2023-06-28   51000000    28000000    43000000
# 2023-06-29   49500000    27300000    41900000

dollar_volume = data * volume            # liquidity proxy
vol_ma = volume.rolling(20).mean()       # 20-day average volume`;

const ALT_DATA_EXAMPLE = `# each table is aligned to \`data\` (prices): rows = dates, cols = instruments
weights = market_cap.div(market_cap.sum(axis=1), axis=0)  # cap-weighting
tilt = sentiment.rolling(5).mean()                        # smoothed sentiment
paid = dividends.iloc[-1] > 0                             # names going ex-dividend today`;

const EXTERNAL_RESPONSE_EXAMPLE = `{
  "AAPL": [{ "date": "2024-01-02", "my_metric": 1.23 }],
  "MSFT": [{ "date": "2024-01-02", "my_metric": 4.56 }]
}`;

export const AdditionalDataPage = () => (
  <DocsLayout
    pageId="additional-data"
    breadcrumbs={[{ label: 'Configuration' }, { label: 'Data pipelines' }]}
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
        Configuration
      </Typography>
    </Box>

    <Heading id="additional-data" level={1}>
      Data pipelines
    </Heading>

    <Lead>
      Beyond raw market prices, strategies, fitness functions and risk managers pull
      custom data through data pipelines — reusable, versioned graphs that wire data
      sources (built-in feeds or your own external APIs) through transforms into the
      named inputs your code consumes.
    </Lead>

    <Heading id="overview" level={2}>
      Overview
    </Heading>
    <P>
      A backtest starts from market data: prices over a date range for a universe of
      instruments. A <strong>data pipeline</strong> brings in everything else your logic
      might need — trading volume, sector / country / index groupings,
      fundamentals, or data from your own external APIs.
    </P>
    <P>
      A pipeline is a reusable, versioned graph: <strong>data sources</strong> flow
      through <strong>transforms</strong> (returns, rolling, z-score, rank, lag, combine)
      into named <strong>outputs</strong>, and each output becomes an input in your code's
      signature. You build a pipeline once and connect it to any strategy, fitness
      function or risk manager; the platform resolves and supplies it automatically
      whenever the component runs — in an optimization study or a sandbox test. You never
      load or refresh this data by hand.
    </P>

    <Heading id="what" level={2}>
      What additional data covers
    </Heading>
    <DataTable
      headers={['Type', 'What it provides']}
      cols="1fr 2fr"
      rows={[
        [
          'Groupings',
          'Point-in-time membership of a named group on each date — a sector, a sector ETF, or a market index such as the S&P 500. Lets logic reason about exposure by group, or include/filter by an index without listing its constituents manually.',
        ],
        [
          'Platform collections',
          'Curated collections of related instruments maintained by the platform — for example a set of sector or single-country instruments — that can be brought in as an additional universe.',
        ],
        [
          'Trading volume',
          'Daily traded volume per instrument, aligned to the price calendar — supplied raw (never forward-filled, zeros preserved) so logic can reason about liquidity and participation.',
        ],
        [
          'News sentiment',
          'A daily aggregated news-sentiment score per instrument, aligned to the price calendar — for sentiment-tilted signals. Covered for a tracked subset of instruments.',
        ],
        [
          'Market cap',
          'Per-day historical market capitalization per instrument, aligned to the price calendar — for size tilts and cap-weighting. Covered for a tracked subset of instruments.',
        ],
        [
          'Dividends & splits',
          'Corporate-action events per instrument — cash dividend amounts and stock-split factors on their event dates, aligned to the price calendar, for total-return and yield logic.',
        ],
      ]}
    />

    <Heading id="volume" level={2}>
      Trading volume
    </Heading>
    <P>
      <strong>Trading volume</strong> is injected alongside prices, in parallel to
      adjusted close. Your logic receives it as a single table whose rows are trading
      dates and whose columns are instruments — the same shape and calendar as the price
      data — so the two line up element by element and can be combined directly (for
      example a liquidity or turnover proxy, or a moving average of volume).
    </P>
    <Callout variant="info" title="Raw by design">
      Volume is supplied <strong>raw</strong>. Unlike prices, it is never forward-filled,
      and zeros are preserved rather than treated as missing — a zero is meaningful (no
      trading that day). Handle gaps explicitly in your logic if your method requires it.
    </Callout>
    <CodeBlock language="python" filename="volume" code={VOLUME_EXAMPLE} />
    <Callout variant="warning" title="Not available for FOREX">
      FOREX instruments do not report real volume — every observation is zero. To avoid
      silently degenerate inputs, any asset group that contains at least one FOREX
      instrument is hidden (and rejected) for strategies that use volume. The cluster
      picker shows a note when clusters are hidden for this reason.
    </Callout>

    <Heading id="alt-data" level={2}>
      Alternative data
    </Heading>
    <P>
      Beyond volume, the platform maintains built-in <strong>alternative-data</strong>
      feeds you can wire like any other source: <strong>news sentiment</strong> and{' '}
      <strong>market cap</strong> (daily series), and <strong>dividends</strong> and{' '}
      <strong>splits</strong> (corporate-action events). Each arrives as a table on the same
      calendar as prices, so it combines with them element by element.
    </P>
    <P>
      Fill semantics match each feed's nature: market cap is a level and is carried forward
      to its last observation (like prices); sentiment is left as-is on days with no news
      (never carried forward); dividend amounts and split factors sit on their event dates
      and are neutral (0, or 1.0 for a split) everywhere else — a non-paying or
      non-splitting instrument is a well-defined column, not missing data.
    </P>
    <CodeBlock language="python" filename="alternative-data" code={ALT_DATA_EXAMPLE} />
    <Callout variant="warning" title="Coverage varies by feed">
      Some feeds cover only a subset of instruments — news sentiment and market cap are
      tracked for a large-cap universe, and corporate actions apply to equities (not crypto
      or FX). When you use such a source, the platform shows how many instruments in your
      cluster it covers over your window, excludes the uncovered ones at launch so a study
      runs on exactly what is covered, and blocks only if nothing is covered. As the feeds
      keep backfilling, coverage grows automatically — no change to your strategy.
    </Callout>

    <Heading id="external" level={2}>
      Bring your own data (external sources)
    </Heading>
    <P>
      To use data Fintela doesn't have — a proprietary signal, or your own
      database — register an <strong>external data source</strong>: a public HTTPS
      endpoint <em>you</em> host. Fintela never connects to your database directly
      and never runs your code; a single audited worker pulls JSON from your
      endpoint on a schedule, caches it, and injects it into your components.
    </P>
    <P>
      The contract is small. The worker POSTs the universe —{' '}
      <code>{'{ "tickers": ["AAPL", "MSFT", ...] }'}</code> — and your endpoint
      returns a JSON object (the shape below infers to one series of records per
      instrument):
    </P>
    <CodeBlock
      language="json"
      filename="endpoint response"
      code={EXTERNAL_RESPONSE_EXAMPLE}
    />
    <P>
      Authentication (bearer, header, or query) is attached from a secret you
      paste when registering the source — it is envelope-encrypted with KMS and
      never readable back. In the editor, <strong>“Validate &amp; infer schema”</strong>{' '}
      calls your endpoint once and fills the output schema from the real response.
      Wire the source into a pipeline like any other, and its output becomes a
      kwarg your code consumes.
    </P>
    <Callout variant="info" title="Reference implementation">
      A runnable FastAPI + MySQL provider implementing this exact contract ships
      in the Fintela repo at <code>examples/external-data-source-provider/</code> —
      point it at your database and host it.
    </Callout>
    <Callout variant="warning" title="Designed around a pull model">
      Your endpoint must be reachable over <strong>public HTTPS</strong> (a
      database on a private network must be fronted by this service). Fintela
      fetches the whole universe per request — there is no date-range parameter,
      so your code slices by date — responses are capped at <strong>16 MiB</strong>,
      and freshness is bounded by the cache TTL you set.
    </Callout>

    <Heading id="who" level={2}>
      Which components can use it
    </Heading>
    <P>
      Additional data is consumed by several components, each to the extent that its
      flow supports. The table below describes what is supported today.
    </P>
    <DataTable
      headers={['Component', 'Additional data support']}
      cols="1fr 2fr"
      rows={[
        [
          'Strategies',
          'Full support — can declare groupings (sectors, sector ETFs, index membership), platform collections, and inject trading volume. The richest consumer of additional data.',
        ],
        [
          'Fitness functions',
          'Partial support — can declare additional context such as group membership.',
        ],
        [
          'Risk managers',
          'Built-in, rule-based, and custom risk managers can declare the context they need (for example sector or country groupings for exposure caps).',
        ],
        [
          'Sandboxes',
          'Strategy, fitness, and risk-manager sandboxes resolve and supply the same additional data, so a sandbox test behaves like a real study.',
        ],
        [
          'Studies',
          'Inherit the additional data declared by the strategy and risk managers attached to them, and validate that everything required is present before running.',
        ],
        [
          'Portfolios',
          'Do not declare additional data themselves — they carry the configuration and data context of the study that produced them.',
        ],
      ]}
    />
    <Callout variant="warning" title="External components">
      Components you host yourself — external strategies, external fitness functions,
      and external risk managers — own their own data side and do not receive injected
      additional data from Fintela. Declare additional data only on the components that
      run on the platform.
    </Callout>

    <Heading id="declare" level={2}>
      Wiring a pipeline
    </Heading>

    <NavPath steps={['Registry', 'Data pipelines']} />

    <P>
      You build a pipeline in <strong>Registry → Data pipelines</strong>: add data-source
      nodes, chain transforms, and name the outputs your code expects. Then connect the
      pipeline to a strategy, fitness function or risk manager from its editor — a
      component can connect several, and their named outputs become the inputs in its
      function signature.
    </P>
    <P>
      Validation is <strong>graph-aware</strong>. Before you save, the platform walks the
      exact pipeline the runtime will and runs your code against it, so an input only
      resolves if a connected pipeline actually produces it — the coupling between your
      logic and the data it depends on stays explicit and verified, with no hand-written
      data config.
    </P>

    <Heading id="resolved" level={2}>
      Context resolved automatically
    </Heading>
    <P>
      Some additional data is supplied automatically because a component requires it.
      For example, a risk manager that caps exposure by sector needs to know each
      instrument's sector. When you attach such a risk manager, the platform checks that
      the matching grouping has been declared, resolves the instrument-to-group mapping,
      and supplies it at run time. If a required declaration is missing, the platform
      tells you before the study runs rather than failing partway through.
    </P>

    <Heading id="clusters" level={2}>
      Relationship to asset groups
    </Heading>
    <P>
      A <strong>asset group</strong> defines the universe and date range a study runs
      on — the core market data. Additional data sits on top of that universe: it
      classifies, groups, or extends it. Platform collections can also be brought in as
      an extra universe alongside your asset group, which lets a strategy reason across
      related instruments — for example trading single-country instruments while a risk
      manager caps exposure by country. See{' '}
      <Box component="a" href="/documentation/concepts" sx={{ color: '#667eea' }}>
        Core concepts
      </Box>{' '}
      for how asset groups fit into the pipeline.
    </P>
  </DocsLayout>
);
