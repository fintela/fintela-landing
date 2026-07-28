import { Box, Typography, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { gradients } from '../../../theme/tokens';

/**
 * A handcrafted product preview shown beneath the hero copy. Mimics the
 * Fintela Studies dashboard — sidebar, study summary, equity curve, top
 * portfolios — without using a screenshot, so it stays sharp at any size.
 */
export const HeroProductMock = () => {
  const { t } = useTranslation('home');
  return (
    <Box
      sx={{
        position: 'relative',
        maxWidth: 1120,
        mx: 'auto',
      }}
    >
      {/* Glow */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: -20,
          background:
            'radial-gradient(60% 80% at 50% 0%, rgba(102,126,234,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Frame */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          borderRadius: 4,
          background:
            'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,251,255,1) 100%)',
          border: '1px solid rgba(11,16,32,0.08)',
          boxShadow:
            '0 30px 80px rgba(11,16,32,0.12), 0 8px 24px rgba(11,16,32,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Window chrome */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: '#fafbfc',
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Dot color="#ff6058" />
            <Dot color="#ffbf2f" />
            <Dot color="#28cb40" />
          </Box>
          <Box
            sx={{
              ml: 2,
              flex: 1,
              maxWidth: 420,
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              bgcolor: '#fff',
              border: '1px solid',
              borderColor: 'divider',
              fontSize: '0.72rem',
              color: 'text.disabled',
              fontFamily: '"JetBrains Mono", monospace',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {t('heroMock.url')}
          </Box>
        </Box>

        {/* Body */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '220px 1fr' },
            minHeight: { xs: 'auto', md: 460 },
          }}
        >
          {/* Sidebar */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              gap: 0.5,
              p: 2,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: '#fcfcfd',
            }}
          >
            <SidebarItem label={t('heroMock.sidebar.dataClusters')} />
            <SidebarItem label={t('heroMock.sidebar.strategies')} />
            <SidebarItem label={t('heroMock.sidebar.fitness')} />
            <SidebarItem label={t('heroMock.sidebar.studies')} active />
            <SidebarItem label={t('heroMock.sidebar.portfolios')} />
            <SidebarItem label={t('heroMock.sidebar.markets')} />
            <SidebarItem label={t('heroMock.sidebar.agents')} />
            <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  background: gradients.brandSoft,
                  border: '1px solid rgba(102,126,234,0.15)',
                }}
              >
                <Typography
                  sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  {t('heroMock.assistantLabel')}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.5, lineHeight: 1.4 }}>
                  {t('heroMock.assistantPrompt')}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Main */}
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                flexDirection: { xs: 'column', md: 'row' },
                mb: 2.5,
              }}
            >
              <Box>
                <Typography
                  sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  {t('heroMock.studyEyebrow')}
                </Typography>
                <Typography sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' }, fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
                  {t('heroMock.studyTitle')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  size="small"
                  icon={<FiberManualRecordIcon sx={{ fontSize: '0.6rem !important', color: '#10b981 !important' }} />}
                  label={t('heroMock.statusRunning')}
                  sx={{
                    bgcolor: 'rgba(16,185,129,0.1)',
                    color: '#10b981',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    height: 24,
                  }}
                />
                <Chip
                  size="small"
                  label={t('heroMock.trialsChip')}
                  sx={{
                    bgcolor: 'rgba(11,16,32,0.05)',
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    height: 24,
                  }}
                />
              </Box>
            </Box>

            {/* KPI row */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Kpi label={t('heroMock.kpiBestSharpe')} value="2.41" tone="brand" />
              <Kpi label={t('heroMock.kpiBestCagr')} value="38.2%" />
              <Kpi label={t('heroMock.kpiMaxDd')} value="-7.4%" />
              <Kpi label={t('heroMock.kpiTrialsDone')} value={t('heroMock.kpiTrialsDoneValue')} />
            </Box>

            {/* Chart + table */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' },
                gap: 2,
              }}
            >
              <EquityChart />
              <PortfolioList />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const Dot = ({ color }: { color: string }) => (
  <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: color }} />
);

const SidebarItem = ({ label, active }: { label: string; active?: boolean }) => (
  <Box
    sx={{
      px: 1.5,
      py: 0.85,
      borderRadius: 1.5,
      fontSize: '0.82rem',
      fontWeight: active ? 600 : 500,
      color: active ? 'text.primary' : 'text.secondary',
      bgcolor: active ? 'rgba(102,126,234,0.08)' : 'transparent',
      borderLeft: '2px solid',
      borderLeftColor: active ? '#667eea' : 'transparent',
      transition: 'all 0.2s',
    }}
  >
    {label}
  </Box>
);

const Kpi = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'brand';
}) => (
  <Box
    sx={{
      p: 1.5,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: '#fff',
    }}
  >
    <Typography
      sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.disabled', letterSpacing: '0.06em', textTransform: 'uppercase' }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: { xs: '1.1rem', md: '1.25rem' },
        fontWeight: 700,
        mt: 0.5,
        fontFamily: '"JetBrains Mono", monospace',
        letterSpacing: '-0.01em',
        ...(tone === 'brand'
          ? {
              background: gradients.brand,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }
          : { color: 'text.primary' }),
      }}
    >
      {value}
    </Typography>
  </Box>
);

const EquityChart = () => {
  const { t } = useTranslation('home');
  // Three series — train / validation / out-of-sample
  const train = 'M0,140 C40,135 70,130 100,118 C140,100 180,82 220,72 C260,62 300,55 340,46 C380,38 420,32 460,28';
  const validation = 'M0,150 C40,148 70,140 100,128 C140,118 180,105 220,90 C260,75 300,65 340,55 C380,46 420,40 460,38';
  const oos = 'M0,152 C40,150 70,148 100,138 C140,128 180,118 220,108 C260,98 300,90 340,82 C380,74 420,66 460,60';

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary' }}>
          {t('heroMock.equityTitle')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
          <LegendItem color="#667eea" label={t('heroMock.legendTrain')} />
          <LegendItem color="#f093fb" label={t('heroMock.legendVal')} />
          <LegendItem color="#fbbf24" label={t('heroMock.legendOos')} />
        </Box>
      </Box>
      <Box
        component="svg"
        viewBox="0 0 460 170"
        sx={{ width: '100%', height: { xs: 160, md: 200 }, display: 'block' }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#667eea" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="0"
            x2="460"
            y1={20 + i * 40}
            y2={20 + i * 40}
            stroke="#eef0f6"
            strokeWidth="1"
          />
        ))}
        {/* Train area fill */}
        <path d={`${train} L460,170 L0,170 Z`} fill="url(#trainFill)" />
        <path d={train} fill="none" stroke="#667eea" strokeWidth="2" />
        <path d={validation} fill="none" stroke="#f093fb" strokeWidth="2" />
        <path d={oos} fill="none" stroke="#fbbf24" strokeWidth="2" />

        {/* End points */}
        <circle cx="460" cy="28" r="3.5" fill="#667eea" />
        <circle cx="460" cy="38" r="3.5" fill="#f093fb" />
        <circle cx="460" cy="60" r="3.5" fill="#fbbf24" />
      </Box>
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          color: '#10b981',
          fontSize: '0.72rem',
          fontWeight: 600,
        }}
      >
        <TrendingUpIcon sx={{ fontSize: 14 }} />
        {t('heroMock.equityFooter')}
      </Box>
    </Box>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <Box sx={{ width: 8, height: 2, bgcolor: color, borderRadius: 1 }} />
    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary' }}>
      {label}
    </Typography>
  </Box>
);

const PortfolioList = () => {
  const { t } = useTranslation('home');
  const rows = [
    { rank: 1, sharpe: '2.41', cagr: '+38.2%', dd: '-7.4%', best: true },
    { rank: 2, sharpe: '2.28', cagr: '+34.1%', dd: '-8.1%' },
    { rank: 3, sharpe: '2.19', cagr: '+31.8%', dd: '-9.0%' },
    { rank: 4, sharpe: '2.04', cagr: '+29.6%', dd: '-9.8%' },
    { rank: 5, sharpe: '1.96', cagr: '+27.2%', dd: '-10.4%' },
  ];

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
      }}
    >
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.primary', mb: 1 }}>
        {t('heroMock.topPortfolios')}
      </Typography>
      <Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 1fr 1fr',
            gap: 1,
            pb: 0.75,
            borderBottom: '1px solid',
            borderColor: 'divider',
            fontSize: '0.62rem',
            fontWeight: 700,
            color: 'text.disabled',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <span>{t('heroMock.columnRank')}</span>
          <span>{t('heroMock.columnSharpe')}</span>
          <span>{t('heroMock.columnCagr')}</span>
          <span>{t('heroMock.columnMaxDd')}</span>
        </Box>
        {rows.map((r) => (
          <Box
            key={r.rank}
            sx={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 1fr 1fr',
              gap: 1,
              py: 0.85,
              borderBottom: '1px solid',
              borderColor: 'divider',
              alignItems: 'center',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.78rem',
              color: 'text.primary',
              '&:last-child': { borderBottom: 'none' },
              ...(r.best && {
                background:
                  'linear-gradient(90deg, rgba(102,126,234,0.06) 0%, rgba(240,147,251,0.04) 100%)',
                borderRadius: 1,
              }),
            }}
          >
            <Box
              sx={{
                fontWeight: 700,
                color: r.best ? '#667eea' : 'text.secondary',
              }}
            >
              {r.rank}
            </Box>
            <Box sx={{ fontWeight: r.best ? 700 : 500 }}>{r.sharpe}</Box>
            <Box sx={{ color: '#10b981', fontWeight: 600 }}>{r.cagr}</Box>
            <Box sx={{ color: '#ef4444' }}>{r.dd}</Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
