import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { gradients, palette, shadows, soft } from '../../theme/tokens';
import { clippedGradientSx } from '../../theme/neu';
import { NeuPanel } from '../primitives/NeuPanel';
import { Groove } from '../primitives/Groove';

const nodes = [
  { cx: 330, cy: 100, num: 1, key: 'dataClusters', lx: 330, ly: 48, la: 'middle' as const },
  { cx: 469, cy: 180, num: 2, key: 'strategies', lx: 516, ly: 174, la: 'start' as const },
  { cx: 469, cy: 340, num: 3, key: 'fitness', lx: 516, ly: 334, la: 'start' as const },
  { cx: 330, cy: 420, num: 4, key: 'studies', lx: 330, ly: 468, la: 'middle' as const },
  { cx: 191, cy: 340, num: 5, key: 'portfolios', lx: 144, ly: 334, la: 'end' as const },
  { cx: 191, cy: 180, num: 6, key: 'riskManagers', lx: 144, ly: 174, la: 'end' as const },
] as const;

const hexPoints = nodes.map((n) => `${n.cx},${n.cy}`).join(' ');
const statKeys = ['conceptToLive', 'experiments', 'faster'] as const;

/** Autoplay tick and how long a manual pick holds the carousel before it resumes. */
const AUTOPLAY_MS = 4200;
const RESUME_DELAY_MS = 8000;

/**
 * Band 3. The hexagon (left) is the map of the six objects the platform is
 * built from; the panel (right) is a carousel that cycles through each one's
 * summary, in step with the highlighted node. Hovering a node or picking a
 * dot jumps the carousel there and pauses autoplay for a while.
 */
export const WorkflowSection = () => {
  const { t } = useTranslation('home');
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setActive((i) => (i + 1) % nodes.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  const selectNode = (idx: number) => {
    setActive(idx);
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_DELAY_MS);
  };

  const activeNode = nodes[active];

  return (
    <Section id="platform" size="lg">
      <SectionHeader
        eyebrow={t('workflow.eyebrow')}
        title={t('workflow.title')}
        titleAccent={t('workflow.titleAccent')}
        description={t('workflow.description')}
      />

      <AnimateOnScroll delay={150}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 5fr) minmax(0, 7fr)' },
            gap: { xs: 3, md: 4 },
            alignItems: 'stretch',
          }}
        >
          <NeuPanel
            sx={{ p: { xs: 2, md: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <Box
              component="svg"
              viewBox="0 0 660 520"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxWidth: 440,
                cursor: 'default',
                overflow: 'visible',
              }}
              aria-label={t('workflow.diagramLabel')}
            >
              <defs>
                <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={palette.navy} />
                  <stop offset="50%" stopColor={palette.navy} />
                  <stop offset="100%" stopColor={palette.navyDeep} />
                </linearGradient>
                <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="6" dy="6" stdDeviation="8" floodColor={palette.navy} floodOpacity="0.30" />
                </filter>
                <filter id="nodeShadowActive" x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow dx="8" dy="10" stdDeviation="11" floodColor={palette.navy} floodOpacity="0.38" />
                </filter>
              </defs>

              <circle cx="330" cy="260" r="160" fill="none" stroke={palette.border} strokeWidth="1.5" strokeDasharray="5,4" />
              <polygon
                points={hexPoints}
                fill="none"
                stroke="url(#brandGrad)"
                strokeWidth="1.5"
                strokeOpacity="0.28"
                strokeLinejoin="round"
              />

              <circle cx="330" cy="260" r="52" fill={soft.wash} stroke={soft.ring} strokeWidth="1.5" />
              <text x="330" y="255" textAnchor="middle" fontSize="11" fontWeight="800" fill={palette.navy} fontFamily="Inter, sans-serif" letterSpacing="1.8">
                {t('workflow.centerName')}
              </text>
              <text x="330" y="271" textAnchor="middle" fontSize="8" fill={palette.textSubtle} fontFamily="Inter, sans-serif" letterSpacing="0.5">
                {t('workflow.centerSub')}
              </text>

              {nodes.map((node, idx) => {
                const isActive = active === idx;
                return (
                  <g
                    key={node.num}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => selectNode(idx)}
                    onClick={() => selectNode(idx)}
                  >
                    {isActive && (
                      <circle cx={node.cx} cy={node.cy} r="47" fill="none" stroke="url(#brandGrad)" strokeWidth="2" strokeOpacity="0.4" />
                    )}
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={isActive ? 40 : 36}
                      fill={isActive ? 'url(#brandGrad)' : soft.groundSunken}
                      filter={isActive ? 'url(#nodeShadowActive)' : 'url(#nodeShadow)'}
                      style={{ transition: 'r 0.2s ease, fill 0.2s ease' }}
                    />
                    <text
                      x={node.cx}
                      y={node.cy + 6}
                      textAnchor="middle"
                      fontSize={isActive ? 20 : 18}
                      fontWeight="900"
                      fill={isActive ? soft.white : soft.ground}
                      fontFamily="Inter, sans-serif"
                      style={{ transition: 'font-size 0.2s ease, fill 0.2s ease' }}
                    >
                      {node.num}
                    </text>
                    <text
                      x={node.lx}
                      y={node.ly}
                      textAnchor={node.la}
                      fontSize="12"
                      fontWeight={isActive ? '800' : '700'}
                      fill={isActive ? palette.navy : palette.text}
                      fontFamily="Inter, sans-serif"
                      style={{ transition: 'fill 0.2s ease' }}
                    >
                      {t(`workflow.nodes.${node.key}.label`)}
                    </text>
                    <text
                      x={node.lx}
                      y={node.ly + 15}
                      textAnchor={node.la}
                      fontSize="10"
                      fill={isActive ? palette.goldDeep : palette.textSubtle}
                      fontFamily="Inter, sans-serif"
                      style={{ transition: 'fill 0.2s ease' }}
                    >
                      {t(`workflow.nodes.${node.key}.sub`)}
                    </text>
                    <circle cx={node.cx} cy={node.cy} r="54" fill="transparent" />
                  </g>
                );
              })}
            </Box>
          </NeuPanel>

          <NeuPanel
            sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <Box
              key={activeNode.num}
              sx={{
                flexGrow: 1,
                animation: 'workflowFade 0.35s ease',
                '@keyframes workflowFade': {
                  from: { opacity: 0, transform: 'translateY(6px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    color: soft.white,
                    background: gradients.brand,
                    boxShadow: shadows.brandStrong,
                  }}
                >
                  {activeNode.num}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: palette.text, lineHeight: 1.2 }}>
                    {t(`workflow.nodes.${activeNode.key}.label`)}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.7rem', fontWeight: 700, color: palette.goldDeep, textTransform: 'uppercase', letterSpacing: '0.06em', mt: 0.25 }}
                  >
                    {t(`workflow.nodes.${activeNode.key}.sub`)}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: '0.92rem', color: soft.textSecondary, lineHeight: 1.7 }}>
                {t(`workflow.nodes.${activeNode.key}.desc`)}
              </Typography>
            </Box>

            <Groove sx={{ my: 3 }} />

            <Box
              role="tablist"
              aria-label={t('workflow.diagramLabel')}
              sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}
            >
              {nodes.map((node, idx) => (
                <Box
                  key={node.num}
                  component="button"
                  type="button"
                  role="tab"
                  aria-selected={active === idx}
                  aria-label={t(`workflow.nodes.${node.key}.label`)}
                  onClick={() => selectNode(idx)}
                  sx={{
                    width: active === idx ? 22 : 8,
                    height: 8,
                    p: 0,
                    border: 'none',
                    borderRadius: 999,
                    cursor: 'pointer',
                    background: active === idx ? gradients.gold : soft.groundSunken,
                    transition: 'width 0.25s ease, background 0.25s ease',
                  }}
                />
              ))}
            </Box>

            <Groove sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'space-between' }, gap: 2, flexWrap: 'wrap' }}>
              {statKeys.map((key) => (
                <Box key={key} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.2rem', md: '1.4rem' },
                      ...clippedGradientSx(gradients.goldText),
                      lineHeight: 1,
                    }}
                  >
                    {t(`workflow.stats.${key}.num`)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      color: palette.textSubtle,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      mt: 0.5,
                    }}
                  >
                    {t(`workflow.stats.${key}.label`)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </NeuPanel>
        </Box>
      </AnimateOnScroll>
    </Section>
  );
};
