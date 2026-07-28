import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C } from '../components/Prose';
import { DataTable } from '../components/DataTable';
import { Callout } from '../components/Callout';
import { CodeBlock } from '../components/CodeBlock';
import { NavPath } from '../components/NavPath';

const toc = [
  { id: 'samplers', title: 'Samplers', level: 2 as const },
  { id: 'registry', title: 'Registry', level: 2 as const },
  { id: 'choosing', title: 'Choosing a sampler', level: 2 as const },
  { id: 'distributed', title: 'Distributed safety', level: 2 as const },
  { id: 'api', title: 'Sampler metadata', level: 2 as const },
];

export const SamplersPage = () => (
  <DocsLayout
    pageId="samplers"
    breadcrumbs={[{ label: 'Configuration' }, { label: 'Sampler selection' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Configuration
      </Typography>
    </Box>
    <Heading id="samplers" level={1}>
      Sampler selection
    </Heading>
    <Lead>
      The sampler is the search algorithm — it decides which parameter combination
      to try next. You choose it in Step 3 of the study creation wizard.
      This page explains each option and when to pick it.
    </Lead>

    <NavPath steps={['Registry', 'Studies', '+ New Study', 'Step 3 — Sampler']} />

    <Callout variant="tip" title="Just use TPE">
      If you're unsure, pick <strong>TPE</strong>. It's the right default for
      almost every study — it learns from past trials and focuses search on
      promising regions. Start with 50–200 trials and increase from there.
    </Callout>

    <Heading id="registry" level={2}>
      Registry
    </Heading>
    <DataTable
      headers={['Key', 'Implementation', 'Distributed-safe', 'Recommended budget']}
      cols="0.8fr 1.5fr 1fr 1.2fr"
      rows={[
        [<><C>TPE</C></>, 'Tree-structured Parzen Estimator · distributed-safe flag auto-enabled', '✅', '100 – 1 000 trials'],
        [<><C>CMAES</C></>, 'Covariance Matrix Adaptation Evolution Strategy', '✅', '1 000 – 10 000 trials'],
        [<><C>RANDOM</C></>, 'Uniform random sampling', '✅', 'No upper bound'],
        [<><C>QMC</C></>, 'Quasi-Monte-Carlo low-discrepancy sequences', '✅', 'No upper bound'],
        [<><C>NSGA2</C></>, 'Non-dominated sorting genetic algorithm · multi-objective', '✅', '100 – 10 000'],
      ]}
    />

    <Heading id="choosing" level={2}>
      Choosing a sampler
    </Heading>
    <DataTable
      headers={['Situation', 'Pick']}
      cols="1.4fr 1fr"
      rows={[
        ['Default / first study', <><C>TPE</C></>],
        ['Continuous parameter space, big budget', <><C>CMAES</C></>],
        ['Need uniform coverage (sensitivity studies)', <><C>QMC</C></>],
        ['Baseline / fuzz testing', <><C>RANDOM</C></>],
        ['Multi-objective fitness', <><C>NSGA2</C></>],
      ]}
    />

    <Callout variant="info" title="Finite grids enumerate instead of sampling">
      Stochastic samplers draw <em>with replacement</em> — even with more trials than
      combinations they can leave grid points unvisited. So when the search space is
      finite (only integer, categorical, or fixed parameters, plus floats with a grid
      precision) and the trial budget covers it, the optimizer automatically switches
      to grid enumeration: every combination is evaluated exactly once, in shuffled
      order, and the study completes as soon as the grid is exhausted. Your sampler
      choice applies whenever the space is continuous or larger than the budget.
    </Callout>

    <Heading id="distributed" level={2}>
      Distributed safety
    </Heading>
    <P>
      All five samplers are distributed-safe — multiple parallel optimizer
      workers can run trials against the same study simultaneously without
      corrupting search state. Coordination uses a shared state backend
      visible to every worker.
    </P>
    <P>
      TPE is the only sampler that requires special handling for distributed
      mode: when <C>n_workers &gt; 1</C>, Fintela automatically enables a
      distributed-safe flag so that pending trials don't cause workers to
      repeatedly suggest similar parameter combinations.
    </P>

    <Heading id="api" level={2}>
      Sampler metadata
    </Heading>
    <P>
      Every sampler carries the metadata below, and the study creation wizard
      renders it directly — the label and description you see in Step 3, plus the
      recommended trial budget and whether the sampler is distributed-safe. It is
      worth knowing the shape because it tells you, per sampler, the trial budget
      Fintela considers reasonable before you commit compute to a study.
    </P>
    <CodeBlock
      language="json"
      filename="Sampler metadata"
      code={`[
  {
    "key": "TPE",
    "label": "Tree Parzen Estimator",
    "description": "Probabilistic model over good/bad trials. Excellent default.",
    "supports_distributed": true,
    "recommended_budget_min": 100,
    "recommended_budget_max": 1000
  },
  {
    "key": "CMAES",
    "label": "CMA-ES",
    "description": "Covariance-matrix evolution. Best for continuous spaces.",
    "supports_distributed": true,
    "recommended_budget_min": 1000,
    "recommended_budget_max": 10000
  }
]`}
    />
  </DocsLayout>
);
