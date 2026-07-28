import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C } from '../components/Prose';
import { CodeBlock } from '../components/CodeBlock';
import { Callout } from '../components/Callout';
import { Steps, Step } from '../components/Steps';
import { NavPath } from '../components/NavPath';

const toc = [
  { id: 'guide-python', title: 'Python · FastAPI', level: 2 as const },
  { id: 'install', title: '1. Install', level: 2 as const },
  { id: 'strategy', title: '2. Strategy endpoint', level: 2 as const },
  { id: 'fitness', title: '3. Fitness endpoint', level: 2 as const },
  { id: 'deploy', title: '4. Deploy', level: 2 as const },
  { id: 'register', title: '5. Register on Fintela', level: 2 as const },
];

const STRATEGY_CODE = `from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import Literal
import pandas as pd

app = FastAPI()


class Position(BaseModel):
    position: Literal["L", "S"]
    allocation: float


@app.post("/simulate")
def simulate(
    params: dict,
    start_date: str = Query(...),
    end_date:   str = Query(...),
):
    """
    Generate a signal for the given window using \`params\`.
    Returns: { signal: { "YYYY-MM-DD": { "TICKER": {position, allocation} } } }
    """
    lookback = int(params.get("lookback", 20))
    n_top    = int(params.get("n_top", 5))

    # ... fetch your data, build your signal ...
    dates = pd.date_range(start_date, end_date, freq="MS").strftime("%Y-%m-%d")
    signal = {
        d: {"AAPL": {"position": "L", "allocation": 1.0}}
        for d in dates
    }
    return {"signal": signal}


@app.get("/healthz")
def health():
    return {"ok": True}`;

const FITNESS_CODE = `from fastapi import FastAPI, Query

app = FastAPI()


@app.post("/evaluate")
def evaluate(
    simulation_period: dict,
    risk_free: float = Query(0.02),
    drawdown_weight: float = Query(1.0),
):
    """
    Score one simulated stage. Return a float wrapped in { "fitness": ... }.
    """
    trades = simulation_period.get("trades", [])
    equity = simulation_period.get("equity", {})

    # ... compute your custom score ...
    score = 1.4
    return {"fitness": score}`;

const DOCKER = `# Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`;

const VERIFY = `curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/strategies`;

export const PythonGuidePage = () => (
  <DocsLayout
    pageId="guide-python"
    breadcrumbs={[{ label: 'Integration Guides' }, { label: 'Python · FastAPI' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Integration Guides
      </Typography>
    </Box>
    <Heading id="guide-python" level={1}>
      Python · FastAPI
    </Heading>
    <Lead>
      Host a strategy and fitness function behind a FastAPI service in about
      fifty lines of code. Production-ready Dockerfile included.
    </Lead>

    <Heading id="install" level={2}>
      1. Install
    </Heading>
    <CodeBlock
      language="bash"
      filename="Terminal"
      code={`pip install fastapi uvicorn[standard] pandas`}
    />

    <Heading id="strategy" level={2}>
      2. Strategy endpoint
    </Heading>
    <P>
      The endpoint accepts the trial's parameters in the JSON body and the
      simulation window as query parameters. Return a signal map of dates to
      ticker positions.
    </P>
    <CodeBlock language="python" filename="strategy.py" code={STRATEGY_CODE} />

    <Heading id="fitness" level={2}>
      3. Fitness endpoint
    </Heading>
    <P>
      The fitness endpoint receives the simulation period in the body and any
      configured fitness parameters in the query string. Return a single
      <C> fitness</C> float.
    </P>
    <CodeBlock language="python" filename="fitness.py" code={FITNESS_CODE} />

    <Callout variant="tip" title="Combine into one service">
      Nothing stops you from serving both endpoints from the same FastAPI app —
      mount <C>/simulate</C> and <C>/evaluate</C> alongside each other. Just
      register the strategy and fitness records pointing at the same base URL.
    </Callout>

    <Heading id="deploy" level={2}>
      4. Deploy
    </Heading>
    <Steps>
      <Step number={1} title="Container">
        <CodeBlock language="bash" filename="Dockerfile" code={DOCKER} />
      </Step>
      <Step number={2} title="Build & push">
        <CodeBlock language="bash" filename="Terminal" code={`docker build -t my-strategy:latest .
docker push registry.example.com/my-strategy:latest`} />
      </Step>
      <Step number={3} title="Expose via HTTPS">
        Behind an ALB, Cloud Run, Fly.io — anywhere reachable from Fintela's
        VPC over a public HTTPS hostname. The optimizer uses keep-alive, so
        terminating proxies at the edge is fine.
      </Step>
    </Steps>

    <Heading id="register" level={2}>
      5. Register on Fintela
    </Heading>
    <NavPath steps={['Registry', 'Strategies', '+ New Strategy', 'External']} />

    <P>
      Once your endpoint is reachable, create the strategy record in the Fintela
      app. Choose <strong>External</strong>, paste your HTTPS base URL, and declare
      the parameters the optimizer will sweep — <C>lookback</C> as a window,{' '}
      <C>n_top</C> as a plain integer. The timeout and max-concurrency Fintela will
      apply to your service are set on the same form.
    </P>
    <P>
      Then create a fitness record the same way (pointing at your <C>/evaluate</C>{' '}
      endpoint), and you're ready to launch a study — see the{' '}
      <a href="/documentation/quickstart">quickstart</a> for the walkthrough.
    </P>
    <P>
      To confirm the record exists from your own tooling, read it back over the
      read-only developer API:
    </P>
    <CodeBlock language="bash" filename="GET /strategies" code={VERIFY} />

    <Callout variant="success" title="That's it">
      You now own the strategy logic, Fintela owns orchestration, sampling, and
      portfolio analytics. Same productivity, different trust boundary.
    </Callout>
  </DocsLayout>
);
