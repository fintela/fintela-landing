// Shared content for the "operations" (live agents) concept block.
//
// The canonical description is the current, operationally-accurate one: an
// operation is one trading session; the supported broker is Alpaca; the
// paper/live environment is fixed when the connection is made (no switch at
// launch); live is pending brokerage approval, so operations trade against
// paper today.
import type { ConceptContent } from '../types';

export const liveAgents: ConceptContent = {
  summary:
    'One trading session: invests a basket of promoted portfolios through your brokerage connection and routes trade orders in real time.',

  full: [
    'An operation is one trading session: it invests a basket of promoted portfolios through a single brokerage connection and routes the resulting trade orders in real time. It handles order lifecycle — placement, fills, and cancellations — and you drive it with Launch, Pause, Resume, Stop, Force stop, Re-initiate, and Rebalance.',
    'The supported broker is Alpaca via REST API and WebSocket. A basket runs at most one operation per connection, and several baskets can trade through the same connection. Each operation keeps its own ledger, so stopping one only liquidates what that operation bought — positions, however, are reported account-wide per connection.',
    'Operations run in Fintela-managed infrastructure. You connect your brokerage once under Account settings → Broker connections, then start an operation from Portfolio Manager → your basket → Operations.',
  ],

  note:
    "Launching an operation places real orders through the connection's brokerage account. The environment is fixed once, when you connect — an operation inherits it, so there is no paper/live switch at launch. Live is pending brokerage approval, so operations trade against paper today.",

  compact:
    'Takes a basket of promoted portfolios to real-time execution via your connected brokerage. Fintela monitors positions and P&L — pause or stop with one click. Requires explicit confirmation.',

  inline:
    'One trading session that invests a basket through a connected brokerage account.',
};
