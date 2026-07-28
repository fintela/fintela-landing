// Shared content for the "external strategies" mode doc block.
//
// Ground truth (Fintela's external-strategy validator):
//   * Fintela POSTs to {endpoint}/simulate with start_date & end_date in the
//     QUERY STRING and the sampled parameters (plus an optional additive
//     `tickers` array when a validation universe is set) in the JSON BODY.
//   * The response MUST be a JSON object with a top-level "signal" key.

import type { ExternalModeContent } from './types';

export const externalStrategies: ExternalModeContent = {
  summary:
    'Host your signal generator behind an HTTPS endpoint you own. Fintela calls it once per trial — your code never leaves your infrastructure.',

  full: [
    'An external strategy is an HTTPS endpoint that you own. Fintela stores only the URL and HTTP-client settings — your code never leaves your infrastructure. The optimizer calls your endpoint once per trial.',
    'Your service must accept a POST to /simulate with parameters in the request body and dates in the query string.',
  ],

  whenToUse: [
    'Your alpha is in the strategy code and must stay on your servers',
    'You already have a research stack in another language or runtime',
    'You need access to private data, internal models, or licensed feeds',
  ],

  endpoint: 'POST {your-endpoint}/simulate',
  endpointDescription: 'Generate signals for a date range using a parameter sample.',

  requestExample: `POST /simulate?start_date=2024-01-01&end_date=2024-12-31
Content-Type: application/json

{
  "fast_period": 10,
  "slow_period": 30,
  "tickers": ["AAPL", "MSFT"]
}`,

  responseExample: `{
  "signal": {
    "2024-01-02": {
      "AAPL": { "position": "L", "allocation": 0.5 },
      "MSFT": { "position": "L", "allocation": 0.5 }
    },
    "2024-02-01": {
      "AAPL": { "position": "S", "allocation": 0.3 }
    }
  }
}`,

  implementationExample: `from fastapi import FastAPI, Query
from pydantic import BaseModel

app = FastAPI()

class SignalResponse(BaseModel):
    signal: dict

@app.post("/simulate", response_model=SignalResponse)
def simulate(params: dict, start_date: str = Query(...), end_date: str = Query(...)):
    # \`params\` is the JSON body: your sampled parameters, plus an optional
    # \`tickers\` list (the chosen validation universe) — safe to ignore.
    universe = params.get("tickers")  # optional; None when no universe is set
    return SignalResponse(signal={
        "2024-01-02": {
            "AAPL": {"position": "L", "allocation": 0.5},
        },
    })`,
  implementationLanguage: 'python',

  contractNote:
    'Parameters travel in the JSON body; dates travel in the query string. External fitness uses the inverse — keep this in mind if you maintain both.',

  tip:
    "When you attach a validation universe (a asset group or explicit tickers), the JSON body also carries an additive tickers array with the chosen ticker codes. A universe-parametric endpoint can use it to scope its output; endpoints that ignore unknown keys are unaffected. It's optional and absent when no universe is set.",

  compact:
    'Your strategy runs on your own HTTPS endpoint. The optimizer calls POST /simulate once per trial — parameters in the body, dates in query string — and expects a { signal: { date: { ticker: { position, allocation } } } } response.',

  inline:
    'An HTTPS endpoint you host. The optimizer calls POST /simulate once per trial and expects a signal map in response.',
};
