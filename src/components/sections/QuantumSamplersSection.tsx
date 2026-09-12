import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { IconWell } from '../primitives/IconWell';
import { TierBadge } from '../primitives/TierBadge';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { inkSurfaceSx } from '../../theme/neu';
import { palette, radii, soft } from '../../theme/tokens';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import GrainIcon from '@mui/icons-material/Grain';
import MemoryIcon from '@mui/icons-material/Memory';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import type { ReactNode } from 'react';

const capabilities = [
  { key: 'qaoa', icon: <BlurOnIcon /> },
  { key: 'qkernel', icon: <GrainIcon /> },
  { key: 'hardwareReady', icon: <MemoryIcon /> },
] as const;

export const QuantumSamplersSection = () => {
  const { t } = useTranslation('home');
  return (
    <Section id="quantum" size="lg">
      <SectionHeader
        eyebrow={t('quantum.eyebrow')}
        title={t('quantum.title')}
        titleAccent={t('quantum.titleAccent')}
        description={t('quantum.description')}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1.05fr' },
          gap: { xs: 4, md: 6 },
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {capabilities.map((c, idx) => (
            <AnimateOnScroll key={c.key} delay={idx * 70}>
              <CapabilityRow
                icon={c.icon}
                title={t(`quantum.capabilities.${c.key}.title`)}
                desc={t(`quantum.capabilities.${c.key}.desc`)}
              />
            </AnimateOnScroll>
          ))}
          <AnimateOnScroll delay={capabilities.length * 70}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 0.5,
                px: 0.5,
                color: soft.textSecondary,
                fontSize: '0.8rem',
                lineHeight: 1.5,
              }}
            >
              <ScienceOutlinedIcon sx={{ fontSize: 15, color: palette.goldDeep }} />
              {t('quantum.note')}
            </Box>
          </AnimateOnScroll>
        </Box>

        <AnimateOnScroll delay={200} direction="left">
          <QuantumVisual />
        </AnimateOnScroll>
      </Box>
    </Section>
  );
};

const CapabilityRow = ({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) => (
  <NeuPanel
    variant="tile"
    sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: { xs: 2.25, md: 2.5 } }}
  >
    <IconWell size={40}>{icon}</IconWell>
    <Box>
      <Typography sx={{ fontWeight: 700, color: soft.text, mb: 0.5, fontSize: '0.98rem' }}>
        {title}
      </Typography>
      <Typography sx={{ color: soft.textSecondary, fontSize: '0.88rem', lineHeight: 1.6 }}>
        {desc}
      </Typography>
    </Box>
  </NeuPanel>
);

const QuantumVisual = () => {
  const { t } = useTranslation('home');
  return (
    <Box
      sx={{
        ...inkSurfaceSx,
        borderRadius: `${radii.neuCard}px`,
        position: 'relative',
        p: { xs: 3, md: 4 },
        height: '100%',
        minHeight: 380,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 3,
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <TierBadge featured sx={{ mb: 2 }}>
          {t('quantum.panel.badge')}
        </TierBadge>

        {/* Quantum circuit motif */}
        <QuantumCircuit />
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.72rem',
            color: soft.onInk,
            letterSpacing: '0.04em',
            mb: 0.75,
            '@media print': { color: soft.text },
          }}
        >
          {t('quantum.panel.codeHint')}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '1.05rem', md: '1.2rem' },
            fontWeight: 700,
            lineHeight: 1.35,
          }}
        >
          {t('quantum.panel.captionBefore')}{' '}
          <Box component="span" sx={{ color: palette.gold }}>
            {t('quantum.panel.captionHighlight')}
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};

/** Decorative QAOA-style circuit — brand-gradient gates on three qubit wires. */
const QuantumCircuit = () => (
  <Box
    aria-hidden
    component="svg"
    viewBox="0 0 420 200"
    sx={{ width: '100%', height: 'auto', display: 'block', mt: 1 }}
  >
    <defs>
      <linearGradient id="qGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={palette.navy} />
        <stop offset="50%" stopColor={palette.navy} />
        <stop offset="100%" stopColor={palette.gold} />
      </linearGradient>
      <filter id="qGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3.5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Qubit wires */}
    {[46, 100, 154].map((y) => (
      <line
        key={y}
        x1="24"
        y1={y}
        x2="396"
        y2={y}
        stroke={soft.white}
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />
    ))}

    {/* Qubit labels */}
    {[46, 100, 154].map((y, i) => (
      <text
        key={y}
        x="8"
        y={y + 4}
        fill={soft.white}
        fillOpacity="0.45"
        fontSize="11"
        fontFamily="'JetBrains Mono', monospace"
      >
        q{i}
      </text>
    ))}

    {/* Hadamard column (superposition) */}
    {[46, 100, 154].map((y) => (
      <g key={`h-${y}`}>
        <rect
          x="52"
          y={y - 15}
          width="30"
          height="30"
          rx="7"
          fill={palette.navy}
          fillOpacity="0.18"
          stroke="url(#qGrad)"
          strokeWidth="1.5"
        />
        <text x="67" y={y + 5} textAnchor="middle" fill={soft.white} fontSize="13" fontWeight="700">
          H
        </text>
      </g>
    ))}

    {/* Cost layer: entangling CNOTs (q0-q1, q1-q2) */}
    <g stroke="url(#qGrad)" strokeWidth="2" fill="none">
      <line x1="150" y1="46" x2="150" y2="100" />
      <line x1="196" y1="100" x2="196" y2="154" />
    </g>
    <circle cx="150" cy="46" r="5" fill="url(#qGrad)" />
    <circle cx="196" cy="100" r="5" fill="url(#qGrad)" />
    <g fill="none" stroke="url(#qGrad)" strokeWidth="2">
      <circle cx="150" cy="100" r="10" />
      <line x1="150" y1="90" x2="150" y2="110" />
      <circle cx="196" cy="154" r="10" />
      <line x1="196" y1="144" x2="196" y2="164" />
    </g>

    {/* Mixer layer: rotation gates (β) */}
    {[46, 100, 154].map((y) => (
      <g key={`ry-${y}`}>
        <rect
          x="250"
          y={y - 15}
          width="42"
          height="30"
          rx="7"
          fill={palette.gold}
          fillOpacity="0.14"
          stroke="url(#qGrad)"
          strokeWidth="1.5"
        />
        <text
          x="271"
          y={y + 5}
          textAnchor="middle"
          fill={soft.white}
          fontSize="11"
          fontFamily="'JetBrains Mono', monospace"
        >
          RYβ
        </text>
      </g>
    ))}

    {/* Measurement (read out the proposal) */}
    {[46, 100, 154].map((y) => (
      <g key={`m-${y}`} filter="url(#qGlow)">
        <rect
          x="330"
          y={y - 15}
          width="30"
          height="30"
          rx="7"
          fill={palette.gold}
          fillOpacity="0.16"
          stroke="url(#qGrad)"
          strokeWidth="1.5"
        />
        <path
          d={`M 337 ${y + 4} A 8 8 0 0 1 353 ${y + 4}`}
          fill="none"
          stroke={soft.white}
          strokeWidth="1.5"
        />
        <line x1="345" y1={y + 4} x2="351" y2={y - 5} stroke={soft.white} strokeWidth="1.5" />
      </g>
    ))}
  </Box>
);
