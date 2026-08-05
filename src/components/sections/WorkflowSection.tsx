import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { gradients } from '../../theme/tokens';

const nodes = [
  { cx: 330, cy: 100, num: 1, key: 'dataClusters', lx: 330, ly: 48, la: 'middle' as const },
  { cx: 469, cy: 180, num: 2, key: 'strategies', lx: 516, ly: 174, la: 'start' as const },
  { cx: 469, cy: 340, num: 3, key: 'fitness', lx: 516, ly: 334, la: 'start' as const },
  { cx: 330, cy: 420, num: 4, key: 'studies', lx: 330, ly: 468, la: 'middle' as const },
  { cx: 191, cy: 340, num: 5, key: 'portfolios', lx: 144, ly: 334, la: 'end' as const },
  { cx: 191, cy: 180, num: 6, key: 'liveAgents', lx: 144, ly: 174, la: 'end' as const },
] as const;

const hexPoints = nodes.map((n) => `${n.cx},${n.cy}`).join(' ');

const tooltipDir = (cx: number, cy: number) => {
  if (cx > 330) return 'left';
  if (cx < 330) return 'right';
  if (cy < 260) return 'bottom';
  return 'top';
};

const tooltipTransform = (dir: string) => {
  if (dir === 'left') return 'translate(calc(-100% - 52px), -50%)';
  if (dir === 'right') return 'translate(52px, -50%)';
  if (dir === 'bottom') return 'translate(-50%, 52px)';
  return 'translate(-50%, calc(-100% - 52px))';
};

const statKeys = ['conceptToLive', 'experiments', 'faster'] as const;

export const WorkflowSection = () => {
  const { t } = useTranslation('home');
  const [hovered, setHovered] = useState<number | null>(null);
  const activeNode = hovered !== null ? nodes[hovered - 1] : null;

  return (
    <Section id="platform" tone="muted" size="lg">
      <SectionHeader
        eyebrow={t('workflow.eyebrow')}
        title={t('workflow.title')}
        titleAccent={t('workflow.titleAccent')}
        description={t('workflow.description')}
      />

      <AnimateOnScroll delay={150}>
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            p: { xs: 2, md: 4 },
            bgcolor: '#fff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(11,16,32,0.06)',
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              background: gradients.brandFaint,
              pointerEvents: 'none',
            }}
          />

          <Box sx={{ position: 'relative' }}>
            <Box
              component="svg"
              viewBox="0 0 660 520"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxWidth: 620,
                mx: 'auto',
                cursor: 'default',
                overflow: 'visible',
              }}
              aria-label={t('workflow.diagramLabel')}
            >
              <defs>
                <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2f6395" />
                  <stop offset="50%" stopColor="#e53540" />
                  <stop offset="100%" stopColor="#efc03c" />
                </linearGradient>
                <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2f6395" floodOpacity="0.22" />
                </filter>
                <filter id="nodeShadowActive" x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#2f6395" floodOpacity="0.5" />
                </filter>
              </defs>

              <circle cx="330" cy="260" r="160" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="5,4" />
              <polygon
                points={hexPoints}
                fill="none"
                stroke="url(#brandGrad)"
                strokeWidth="1.5"
                strokeOpacity={hovered !== null ? 0.1 : 0.28}
                strokeLinejoin="round"
                style={{ transition: 'stroke-opacity 0.25s' }}
              />

              <circle cx="330" cy="260" r="52" fill="rgba(47,99,149,0.06)" stroke="rgba(47,99,149,0.18)" strokeWidth="1.5" />
              <text x="330" y="255" textAnchor="middle" fontSize="11" fontWeight="800" fill="#2f6395" fontFamily="Inter, sans-serif" letterSpacing="1.8">
                {t('workflow.centerName')}
              </text>
              <text x="330" y="271" textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="Inter, sans-serif" letterSpacing="0.5">
                {t('workflow.centerSub')}
              </text>

              {nodes.map((node) => {
                const isActive = hovered === node.num;
                const isDimmed = hovered !== null && !isActive;
                return (
                  <g
                    key={node.num}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHovered(node.num)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {isActive && (
                      <circle cx={node.cx} cy={node.cy} r="47" fill="none" stroke="url(#brandGrad)" strokeWidth="2" strokeOpacity="0.4" />
                    )}
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={isActive ? 40 : 36}
                      fill={isDimmed ? '#d8dbe5' : 'url(#brandGrad)'}
                      filter={isActive ? 'url(#nodeShadowActive)' : isDimmed ? undefined : 'url(#nodeShadow)'}
                      style={{ transition: 'r 0.2s ease, fill 0.2s ease' }}
                    />
                    <text
                      x={node.cx}
                      y={node.cy + 6}
                      textAnchor="middle"
                      fontSize={isActive ? 20 : 18}
                      fontWeight="900"
                      fill={isDimmed ? '#eef0f6' : 'white'}
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
                      fill={isDimmed ? '#c8ccd8' : isActive ? '#2f6395' : '#1a1a1f'}
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
                      fill={isDimmed ? '#d1d5db' : isActive ? '#789aba' : '#8a93a6'}
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

            {activeNode &&
              (() => {
                const dir = tooltipDir(activeNode.cx, activeNode.cy);
                return (
                  <Box
                    key={activeNode.num}
                    sx={{
                      position: 'absolute',
                      left: `${(activeNode.cx / 660) * 100}%`,
                      top: `${(activeNode.cy / 520) * 100}%`,
                      transform: tooltipTransform(dir),
                      width: { xs: 200, md: 240 },
                      bgcolor: '#fff',
                      border: '1px solid rgba(47,99,149,0.22)',
                      borderRadius: 2,
                      p: 2,
                      boxShadow: '0 14px 36px rgba(47,99,149,0.18)',
                      zIndex: 20,
                      pointerEvents: 'none',
                      animation: 'tooltipIn 0.18s ease',
                      '@keyframes tooltipIn': {
                        from: { opacity: 0, scale: '0.96' },
                        to: { opacity: 1, scale: '1' },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        height: 2,
                        background: gradients.brand,
                        borderRadius: 1,
                        mb: 1.25,
                      }}
                    />
                    <Typography
                      sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#2f6395', mb: 0.75, letterSpacing: '0.04em' }}
                    >
                      {activeNode.num}. {t(`workflow.nodes.${activeNode.key}.label`)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.55 }}>
                      {t(`workflow.nodes.${activeNode.key}.desc`)}
                    </Typography>
                  </Box>
                );
              })()}
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 3, md: 6 },
              mt: 3,
              flexWrap: 'wrap',
              borderTop: '1px solid',
              borderColor: 'divider',
              pt: 3,
              position: 'relative',
            }}
          >
            {statKeys.map((key) => (
              <Box key={key} sx={{ textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.2rem', md: '1.6rem' },
                    background: gradients.brand,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1,
                  }}
                >
                  {t(`workflow.stats.${key}.num`)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    color: 'text.disabled',
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
        </Box>
      </AnimateOnScroll>
    </Section>
  );
};
