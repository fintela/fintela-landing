import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C, Ul } from '../components/Prose';
import { CodeBlock } from '../components/CodeBlock';
import { ApiEndpoint } from '../components/ApiEndpoint';
import { ParamTable } from '../components/ParamTable';
import { Callout } from '../components/Callout';
import { DataTable } from '../components/DataTable';

const toc = [
  { id: 'api-baskets', title: 'Baskets API', level: 2 as const },
  { id: 'endpoints', title: 'Endpoints', level: 2 as const },
  { id: 'control', title: 'Reading operations, not driving them', level: 2 as const },
  { id: 'list', title: 'List baskets', level: 2 as const },
  { id: 'detail', title: 'Fetch a basket', level: 2 as const },
  { id: 'freshness', title: 'Freshness', level: 2 as const },
  { id: 'operations', title: 'Operations', level: 2 as const },
  { id: 'history', title: 'Operation history', level: 2 as const },
  { id: 'pagination', title: 'Pagination', level: 2 as const },
];

const BASKET_RESPONSE = `{
  "data": {
    "id": "6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01",
    "name": "Momentum sleeve",
    "portfolio_ids": [61, 62, 74],
    "daily_update_enabled": true,
    "stage": "LIVE",
    "allocation_method": "equal_weight",
    "allocation_method_params": null,
    "rebalance_enabled": true,
    "rebalance_frequency_days": 21,
    "rebalance_anchor_date": "2026-01-05",
    "member_weights": null,
    "created_at": "2026-01-05T11:22:03Z",
    "updated_at": "2026-03-16T08:41:57Z"
  }
}`;

const FRESHNESS_RESPONSE = `{
  "data": {
    "basket_id": "6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01",
    "fresh": [61, 62],
    "stale": [74],
    "not_scheduled": [74],
    "members": [
      { "managed_portfolio_id": 61, "stale": false,
        "daily_updates_enabled": true,  "execution_type": "INTERNAL" },
      { "managed_portfolio_id": 62, "stale": false,
        "daily_updates_enabled": true,  "execution_type": "INTERNAL" },
      { "managed_portfolio_id": 74, "stale": true,
        "daily_updates_enabled": false, "execution_type": "EXTERNAL" }
    ],
    "daily_update_enabled": true,
    "rebalance_frequency_days": 21
  }
}`;

const OPERATION_RESPONSE = `{
  "data": {
    "operation_id": "b2e7a4c8-13f5-4a6d-8e90-5c1d7f3a2b44",
    "basket_id": "6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01",
    "connection_id": "a17c3e5d-9b02-4f81-bb6a-2d4e8c1f5a33",
    "provider": "alpaca",
    "operational_name": "Momentum sleeve — paper",
    "target_capital": 250000.0,
    "last_status": "RUNNING",
    "desired_status": "RUNNING",
    "drift_detected_at": null,
    "drift_ack_at": null,
    "last_rebalanced_at": "2026-03-09T14:31:02Z",
    "rebalance_requested_at": null,
    "created_at": "2026-02-02T15:00:11Z",
    "updated_at": "2026-03-16T21:10:44Z"
  }
}`;

export const ApiBasketsPage = () => (
  <DocsLayout
    pageId="api-baskets"
    breadcrumbs={[{ label: 'API Reference' }, { label: 'Baskets' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        API Reference
      </Typography>
    </Box>
    <Heading id="api-baskets" level={1}>
      Baskets API
    </Heading>
    <Lead>
      A basket groups managed portfolios under one trading configuration, and
      an <strong>operation</strong> is one actioning of that basket against a
      broker connection. These endpoints read the composition, the freshness of
      the members, and the full operational audit trail — orders, allocations,
      state changes and end-of-day reconciliation. Baskets are built and traded
      in the Fintela app; every endpoint here is a <C>GET</C>.
    </Lead>

    <Heading id="endpoints" level={2}>
      Endpoints
    </Heading>
    <ApiEndpoint method="GET" path="/v2/baskets" description="List the organization's baskets, most recently updated first." />
    <ApiEndpoint method="GET" path="/v2/baskets/:id" description="One basket — membership, allocation method and rebalance configuration." />
    <ApiEndpoint method="GET" path="/v2/baskets/:id/freshness" description="Whether each member portfolio is up to date with the latest market bar." />
    <ApiEndpoint method="GET" path="/v2/baskets/:id/operations" description="Every operation ever launched for this basket, oldest first." />
    <ApiEndpoint method="GET" path="/v2/baskets/:id/operations/:op_id" description="One operation and its current operational state." />
    <ApiEndpoint method="GET" path="/v2/baskets/:id/operations/:op_id/allocations" description="Weight snapshots written each time the operation rebalanced." />
    <ApiEndpoint method="GET" path="/v2/baskets/:id/operations/:op_id/orders" description="Broker orders the operation submitted, newest first." />
    <ApiEndpoint method="GET" path="/v2/baskets/:id/operations/:op_id/state_log" description="Audit log — launches, status transitions, drift, rebalance requests." />
    <ApiEndpoint method="GET" path="/v2/baskets/:id/operations/:op_id/eod_reports" description="End-of-day reconciliation rows, newest trading day first." />
    <P>
      Baskets and operations are identified by <strong>UUID</strong>, not by
      the integer ids used for studies, trials and portfolios. Members inside a
      basket are still integer <C>managed_portfolio_id</C> values you can pass
      straight to <C>/v2/portfolios/:id</C>.
    </P>

    <Heading id="control" level={2}>
      Reading operations, not driving them
    </Heading>
    <P>
      This is the sharpest read-only boundary in the API, and it is worth
      stating plainly: <strong>operation control is not available over API
      keys</strong>. Creating an operation, launching it, pausing it, stopping
      it, acknowledging drift and requesting a rebalance are all app-only. So
      are basket CRUD and the refresh and simulate actions, which spend
      compute.
    </P>
    <Callout variant="danger" title="No trading actions over the API">
      An API key can observe live trading in complete detail but cannot cause
      any of it. There is no endpoint that submits an order, changes a target
      capital, or moves an operation between states — attempting any write verb
      returns <C>405 Method Not Allowed</C> or <C>404 Not Found</C>. Build
      monitoring, reporting and reconciliation on these endpoints; drive the
      trading itself from the app.
    </Callout>
    <P>
      The <C>desired_status</C> and <C>last_status</C> fields make that split
      visible. <C>desired_status</C> is the state an operator asked for in the
      app; <C>last_status</C> is the state the orchestrator has actually
      reached. While they differ, a transition is in flight — which is exactly
      the sort of thing a monitor built on this API should surface.
    </P>

    <Heading id="list" level={2}>
      List baskets
    </Heading>
    <P>
      The list returns full basket records, ordered by <C>updated_at</C>{' '}
      descending. Deleted baskets are excluded, and so is any basket the key
      owner cannot read at full fidelity.
    </P>
    <CodeBlock
      language="bash"
      filename="List baskets"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/v2/baskets`}
    />

    <Heading id="detail" level={2}>
      Fetch a basket
    </Heading>
    <CodeBlock
      language="bash"
      filename="One basket"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/v2/baskets/6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01`}
    />
    <CodeBlock language="json" filename="Response" code={BASKET_RESPONSE} />
    <ParamTable
      caption="Basket fields"
      rows={[
        { name: 'id', type: 'uuid', description: 'The basket id used on every nested path.' },
        { name: 'name', type: 'string', description: 'Display name given in the app.' },
        { name: 'portfolio_ids', type: 'number[]', description: <>Membership, as managed portfolio ids. Resolve each one through <C>/v2/portfolios/:id</C>.</> },
        { name: 'daily_update_enabled', type: 'boolean', description: <>When true, all active members extend daily. When false, members go stale and the basket cannot invest.</> },
        { name: 'stage', type: 'string', description: 'Lifecycle stage of the basket within the Portfolio Manager.' },
        { name: 'allocation_method', type: 'string', description: 'How capital is split across members — equal weight, manual weights, and so on.' },
        { name: 'allocation_method_params', type: 'object | null', description: <>Extra configuration for the allocation method. <C>null</C> when the method takes none.</> },
        { name: 'rebalance_enabled', type: 'boolean', description: 'Whether the basket rebalances periodically at all.' },
        { name: 'rebalance_frequency_days', type: 'integer | null', description: <>Cadence in data-days. <C>null</C> means no periodic rebalance.</> },
        { name: 'rebalance_anchor_date', type: 'date | null', description: <>Frozen anchor of the rebalance grid. <C>null</C> reads as the basket's creation date at use time.</> },
        { name: 'member_weights', type: 'object | null', description: <>Manual per-member weights as <C>{`{ managed_portfolio_id: weight }`}</C>, containing only members that have a weight set. <C>null</C> when none do.</> },
        { name: 'created_at', type: 'timestamp', description: 'Creation time, UTC.' },
        { name: 'updated_at', type: 'timestamp', description: 'Last configuration change, UTC. The list is ordered by this.' },
      ]}
    />

    <Heading id="freshness" level={2}>
      Freshness
    </Heading>
    <P>
      A basket can only invest when its members are up to date. This endpoint
      answers that question with the same definition the platform's own
      invest-time launch gate uses, so what it reports is what the app will
      enforce.
    </P>
    <CodeBlock
      language="bash"
      filename="Freshness"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/v2/baskets/6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01/freshness`}
    />
    <CodeBlock language="json" filename="Response" code={FRESHNESS_RESPONSE} />
    <P>
      The top-level <C>fresh</C>, <C>stale</C> and <C>not_scheduled</C> arrays
      are convenience partitions; <C>members</C> is the authoritative per-member
      view. The two flags on a member are independent, which is the whole point
      of the array:
    </P>
    <Ul>
      <li><C>stale</C> — the member's latest equity has not reached the latest market bar of its own ticker universe</li>
      <li><C>daily_updates_enabled</C> — whether the updater is scheduled to extend it at all</li>
      <li><C>execution_type</C> — <C>INTERNAL</C> or <C>EXTERNAL</C>, snapshotted from the strategy</li>
    </Ul>
    <Callout variant="tip" title="Distinguish frozen from merely behind">
      A member can appear in both <C>stale</C> and <C>not_scheduled</C>. That
      combination is the root cause, not a coincidence: daily updates are off,
      so it will never catch up on its own. A member that is stale but{' '}
      <em>is</em> scheduled is simply waiting for the next update. Note also
      that <C>EXTERNAL</C> members cannot daily-extend at all — managed mode
      supports <C>INTERNAL</C> strategies only — so an <C>EXTERNAL</C> member
      going stale is expected behaviour rather than a fault.
    </Callout>

    <Heading id="operations" level={2}>
      Operations
    </Heading>
    <P>
      Trading configuration — allocation method, weights, rebalance cadence,
      membership — lives on the basket and is shared. An operation carries the
      per-actioning operational state: which broker connection it runs against,
      how much capital it targets, and where it is in its lifecycle.
    </P>
    <CodeBlock language="json" filename="One operation" code={OPERATION_RESPONSE} />
    <ParamTable
      caption="Operation fields"
      rows={[
        { name: 'operation_id', type: 'uuid', description: 'Id used on the four history sub-resources.' },
        { name: 'connection_id', type: 'uuid', description: 'The broker connection this operation trades through.' },
        { name: 'provider', type: 'string', description: 'The broker behind that connection.' },
        { name: 'operational_name', type: 'string | null', description: 'Optional label distinguishing operations of the same basket.' },
        { name: 'target_capital', type: 'number', description: 'Capital the operation is sized against.' },
        { name: 'last_status', type: 'string', description: 'State the orchestrator has actually reached.' },
        { name: 'desired_status', type: 'string', description: <>State requested from the app. A mismatch with <C>last_status</C> means a transition is in flight.</> },
        { name: 'drift_detected_at', type: 'timestamp | null', description: 'When live positions were last found to diverge from the target.' },
        { name: 'drift_ack_at', type: 'timestamp | null', description: 'When an operator acknowledged that drift in the app.' },
        { name: 'last_rebalanced_at', type: 'timestamp | null', description: 'Last completed rebalance.' },
        { name: 'rebalance_requested_at', type: 'timestamp | null', description: 'Set while a rebalance has been asked for but not yet carried out.' },
      ]}
    />
    <P>
      Operations are listed <strong>oldest first</strong> — the natural reading
      order for a history — which is the opposite of every other collection on
      this page.
    </P>

    <Heading id="history" level={2}>
      Operation history
    </Heading>
    <P>
      Four sub-resources hang off an operation. Each is paginated and each has
      its own natural ordering:
    </P>
    <DataTable
      headers={['Sub-resource', 'What it records', 'Ordering']}
      cols="1fr 1.6fr 1.2fr"
      rows={[
        [<C>allocations</C>, 'One weight snapshot per member, written whenever the operation rebalanced.', 'Portfolio id, then newest snapshot first'],
        [<C>orders</C>, 'Broker orders submitted, with fills, prices, status and any error message.', 'Newest first'],
        [<C>state_log</C>, 'Audit entries — launch, status transitions, drift, rebalance — with actor and payload.', 'Newest first'],
        [<C>eod_reports</C>, 'End-of-day reconciliation: fills matched and any discrepancies found.', 'Newest trading day first'],
      ]}
    />
    <CodeBlock
      language="bash"
      filename="Recent orders for an operation"
      code={`BASKET=6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01
OP=b2e7a4c8-13f5-4a6d-8e90-5c1d7f3a2b44

curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/v2/baskets/$BASKET/operations/$OP/orders?limit=100"`}
    />
    <P>
      Order rows carry the identifiers you need to reconcile against your
      broker directly — <C>provider_order_id</C>, <C>ticker_code</C>,{' '}
      <C>action</C>, <C>position_side</C>, <C>quantity</C>, <C>order_type</C>,{' '}
      <C>limit_price</C>, <C>status</C>, <C>submitted_at</C>,{' '}
      <C>filled_at</C> and <C>fill_price</C> — plus <C>portfolio_id</C>{' '}
      attributing the order to the member that motivated it.
    </P>
    <Callout variant="info" title="Account-wide EOD rows">
      In <C>eod_reports</C>, a row whose <C>operation_id</C> is <C>null</C> is
      the connection-level summary for that trading day — the whole brokerage
      account rather than this one operation. Filter it out when you are
      attributing results to a single operation, and read it when you are
      reconciling the account as a whole.
    </Callout>

    <Heading id="pagination" level={2}>
      Pagination
    </Heading>
    <P>
      The four history endpoints take <C>limit</C> and <C>offset</C>. Limits
      are clamped server-side to <C>[1, 1000]</C>, so no single call can pull an
      unbounded history — a larger value is silently reduced rather than
      rejected. Defaults differ by endpoint:
    </P>
    <ParamTable
      caption="Pagination"
      rows={[
        { name: 'limit', type: 'integer', default: '500', description: <>Rows to return, clamped to <C>[1, 1000]</C>. The default is <C>500</C> for <C>allocations</C>, <C>orders</C> and <C>state_log</C>, and <C>90</C> for <C>eod_reports</C> — roughly a quarter of trading days.</> },
        { name: 'offset', type: 'integer', default: '0', description: <>Rows to skip. Negative values are treated as <C>0</C>.</> },
      ]}
    />
    <P>
      Every operation read is gated on the parent basket. If the key owner
      cannot read the basket at full fidelity, the operation endpoints return{' '}
      <C>404 Not Found</C> naming the basket — the API never confirms that a
      basket you cannot see exists. An operation id is also pinned to the
      basket in its path, so a valid operation requested under the wrong basket
      is likewise a <C>404</C>.
    </P>
  </DocsLayout>
);
