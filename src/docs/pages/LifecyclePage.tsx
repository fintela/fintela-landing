import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C } from '../components/Prose';
import { DataTable } from '../components/DataTable';
import { Callout } from '../components/Callout';
import { NavPath } from '../components/NavPath';

const toc = [
  { id: 'status-badges', title: 'Status badges in the UI', level: 2 as const },
  { id: 'study-states', title: 'Study state machine', level: 2 as const },
  { id: 'task-states', title: 'Task state machine', level: 2 as const },
  { id: 'trial-states', title: 'Trial states', level: 2 as const },
  { id: 'resume', title: 'Resume a study', level: 2 as const },
  { id: 'soft-delete', title: 'Soft delete', level: 2 as const },
];

export const LifecyclePage = () => (
  <DocsLayout
    pageId="lifecycle"
    breadcrumbs={[{ label: 'Configuration' }, { label: 'Study lifecycle' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Configuration
      </Typography>
    </Box>
    <Heading id="lifecycle" level={1}>
      Study lifecycle
    </Heading>
    <Lead>
      Every study you create moves through a sequence of states visible as color-coded
      badges in the UI. This page explains what each state means, when it transitions,
      and what actions you can take.
    </Lead>

    <Heading id="status-badges" level={2}>
      Status badges in the UI
    </Heading>

    <NavPath steps={['Registry', 'Studies']} />

    <P>
      The study list and study detail page show a status badge on every study.
      Here's what each badge means and what you can do:
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
        { status: 'QUEUED', color: '#667eea', bg: 'rgba(102,126,234,0.1)', desc: 'Waiting for a worker. No action needed — the optimizer picks it up automatically.' },
        { status: 'RUNNING', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', desc: 'Actively running trials. You can pause or stop from the action menu.' },
        { status: 'COMPLETED', color: '#10b981', bg: 'rgba(16,185,129,0.1)', desc: 'All trials finished. Results are in Analytics → Portfolios. You can resume with more trials.' },
        { status: 'PAUSED', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', desc: 'No new trials dispatched. In-flight trials finish. Resume from the action menu.' },
        { status: 'STOPPED', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', desc: 'Permanently halted. Cannot be restarted as-is, but you can resume with additional trials.' },
        { status: 'FAILED', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', desc: 'The optimizer hit an unrecoverable error (or autostop triggered). Check the error log.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.status}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              px: 1.25,
              py: 0.35,
              borderRadius: 1,
              bgcolor: row.bg,
              border: `1px solid ${row.color}33`,
              color: row.color,
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.04em',
              flexShrink: 0,
              minWidth: 88,
              textAlign: 'center',
            }}
          >
            {row.status}
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Heading id="study-states" level={2}>
      Study state machine
    </Heading>

    <StudyStateMachine />

    <P>
      Every study tracks two independent status values:
    </P>
    <DataTable
      headers={['Field', 'Meaning']}
      cols="1fr 2fr"
      rows={[
        ['Observed status', 'The current real state — updated by the optimization engine and cleanup jobs'],
        ['Desired status', 'The target state — set when you stop or resume the study from the app'],
      ]}
    />
    <P>
      Reconciliation between the two values is how stops and resumes propagate.
      The optimization engine polls studies where the observed and desired states
      disagree and takes action accordingly.
    </P>

    <Heading id="task-states" level={2}>
      Task state machine
    </Heading>
    <P>
      Each optimizer worker task has its own lifecycle:
    </P>
    <Box
      component="pre"
      sx={{
        my: 3,
        p: 2.5,
        borderRadius: 2,
        bgcolor: '#0f1325',
        color: '#e6e8f0',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.84rem',
        lineHeight: 1.7,
        overflow: 'auto',
        border: '1px solid rgba(102,126,234,0.18)',
      }}
    >{`PENDING ── started ──► RUNNING ── trials done ──► COMPLETED
                          │
                          └── unrecoverable error ──► FAILED`}</Box>
    <P>
      The task carries <C>last_heartbeat</C> for liveness detection — a missing
      heartbeat past a threshold marks the task <C>FAILED</C> and the study
      transitions accordingly.
    </P>

    <Heading id="trial-states" level={2}>
      Trial states
    </Heading>
    <DataTable
      headers={['State', 'When']}
      cols="1fr 2fr"
      rows={[
        ['WAITING', 'Allocated but not yet executed'],
        ['RUNNING', 'Currently sampling and simulating'],
        ['COMPLETE', 'Succeeded — fitness reported to the search algorithm'],
        ['PRUNED', 'Caught exception, NaN fitness, empty signal, missing key'],
        ['FAIL', 'Hard failure (rare — typically internal error in the optimizer)'],
      ]}
    />
    <P>
      <C>PRUNED</C> is the most common terminal state for failed trials —
      external endpoint hiccups, NaN fitness, and empty signals all map here.
      The reason is stored as <C>failure_reason</C> and visible under{' '}
      <C>GET /studies/errors</C>.
    </P>

    <Heading id="resume" level={2}>
      Resume a study
    </Heading>
    <NavPath steps={['Registry', 'Studies', 'Resume']} />

    <P>
      Any terminal study (COMPLETED, STOPPED, or FAILED) can be resumed from the
      action menu in the study list — click <strong>Resume</strong> and enter
      how many additional trials to add:
    </P>
    <Box
      component="pre"
      sx={{
        my: 3,
        p: 2.5,
        borderRadius: 2,
        bgcolor: '#0f1325',
        color: '#e6e8f0',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.84rem',
        lineHeight: 1.7,
        overflow: 'auto',
        border: '1px solid rgba(102,126,234,0.18)',
      }}
    >{`resume + 500 additional trials

→ study transitions: COMPLETED / STOPPED / FAILED  →  QUEUED`}</Box>
    <P>
      The optimization engine picks up the study on its next scheduling cycle
      and launches a fresh worker. All prior trial data and portfolios are
      preserved — the new trials accumulate on top.
    </P>

    <Callout variant="info" title="Sampler memory survives resume">
      The sampler's learned state is persisted alongside the trials, so
      resuming doesn't reset learned distributions. New trials continue from
      where the old ones left off.
    </Callout>

    <Heading id="soft-delete" level={2}>
      Soft delete
    </Heading>
    <P>
      Deleting a study from the app soft-deletes the record — it disappears from
      the study list and from every API read, but all trial and portfolio data is
      retained. A background job permanently purges the data after a configurable
      retention window. This protects against accidental destruction.
    </P>
  </DocsLayout>
);

const StudyStateMachine = () => (
  <Box
    sx={{
      my: 3,
      p: 3,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: '#fafbfc',
      overflowX: 'auto',
    }}
  >
    <Box
      component="svg"
      viewBox="0 0 720 270"
      sx={{ width: '100%', maxWidth: 720, mx: 'auto', display: 'block' }}
      aria-label="Study state machine"
    >
      <defs>
        <marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#94a3b8" />
        </marker>
        <linearGradient id="stateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#f093fb" />
        </linearGradient>
      </defs>

      <StateNode x={40} y={110} label="QUEUED" tone="brand" />
      <StateNode x={240} y={110} label="RUNNING" tone="brand" />
      <StateNode x={460} y={40} label="COMPLETED" tone="success" />
      <StateNode x={460} y={110} label="STOPPED" tone="warn" />
      <StateNode x={460} y={180} label="FAILED" tone="danger" />

      {/* QUEUED → RUNNING */}
      <line x1={150} y1={140} x2={240} y2={140} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow2)" />
      <text x={195} y={132} textAnchor="middle" fontSize="10" fill="#5b6478" fontFamily="Inter, sans-serif">a worker picks it up</text>

      {/* RUNNING → COMPLETED */}
      <line x1={350} y1={130} x2={460} y2={75} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow2)" />
      <text x={400} y={95} textAnchor="middle" fontSize="10" fill="#5b6478" fontFamily="Inter, sans-serif">all trials done</text>

      {/* RUNNING → STOPPED */}
      <line x1={350} y1={140} x2={460} y2={140} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow2)" />
      <text x={400} y={132} textAnchor="middle" fontSize="10" fill="#5b6478" fontFamily="Inter, sans-serif">stop request</text>

      {/* RUNNING → FAILED */}
      <line x1={350} y1={148} x2={460} y2={210} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow2)" />
      <text x={400} y={195} textAnchor="middle" fontSize="10" fill="#5b6478" fontFamily="Inter, sans-serif">autostop / unrecoverable</text>

      {/* Resume loops back */}
      <path
        d="M 600 75 C 660 75, 660 240, 100 240 C 50 240, 50 170, 95 145"
        fill="none"
        stroke="url(#stateGrad)"
        strokeWidth="1.5"
        strokeDasharray="4,3"
        markerEnd="url(#arrow2)"
      />
      <text x={350} y={258} textAnchor="middle" fontSize="10" fill="#667eea" fontWeight="600" fontFamily="Inter, sans-serif">
        resume (any terminal state) → QUEUED
      </text>
    </Box>
  </Box>
);

const StateNode = ({
  x,
  y,
  label,
  tone,
}: {
  x: number;
  y: number;
  label: string;
  tone: 'brand' | 'success' | 'warn' | 'danger';
}) => {
  const fills = {
    brand: 'url(#stateGrad)',
    success: '#10b981',
    warn: '#f59e0b',
    danger: '#ef4444',
  };
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={110}
        height={56}
        rx={8}
        fill={fills[tone]}
      />
      <text
        x={x + 55}
        y={y + 33}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#fff"
        fontFamily="JetBrains Mono, monospace"
      >
        {label}
      </text>
    </g>
  );
};
