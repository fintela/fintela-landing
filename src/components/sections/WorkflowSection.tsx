import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { fonts, gradients, palette, shadows, soft } from '../../theme/tokens';
import { inkSurfaceSx } from '../../theme/neu';
import { NeuPanel } from '../primitives/NeuPanel';
import { CheckWell } from '../primitives/CheckWell';
import { Groove } from '../primitives/Groove';
import fintelaMark from '../../assets/logos/fintela_logo_1.jpg';

/**
 * Google's favicon service: unlike a marketing-enrichment API (Clearbit and
 * similar), this domain isn't on ad-block/privacy lists, so it actually loads
 * for every visitor instead of silently failing for most of them.
 */
const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

/**
 * A handful of instruments across the markets an asset group can mix —
 * equities (some of which also trade as options on the same ticker) and
 * crypto — shown as a small looping logo strip under the Asset Groups node.
 */
const ASSET_LOGOS = [
  { symbol: 'AAPL', alt: 'Apple', src: favicon('apple.com') },
  { symbol: 'MSFT', alt: 'Microsoft', src: favicon('microsoft.com') },
  { symbol: 'NVDA', alt: 'NVIDIA', src: favicon('nvidia.com') },
  { symbol: 'AMZN', alt: 'Amazon', src: favicon('amazon.com') },
  { symbol: 'TSLA', alt: 'Tesla', src: favicon('tesla.com') },
  { symbol: 'GOOGL', alt: 'Alphabet', src: favicon('google.com') },
  { symbol: 'META', alt: 'Meta Platforms', src: favicon('meta.com') },
  {
    symbol: 'BTC',
    alt: 'Bitcoin',
    src: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png',
  },
  {
    symbol: 'ETH',
    alt: 'Ethereum',
    src: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png',
  },
  {
    symbol: 'SOL',
    alt: 'Solana',
    src: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/sol.png',
  },
] as const;

/** Duplicated once so the marquee can loop by translating exactly -50%. */
const MARQUEE_LOGOS = [...ASSET_LOGOS, ...ASSET_LOGOS];

/** The mini logo carousel under the Asset Groups node's description. */
const AssetLogoMarquee = () => (
  <Box
    aria-hidden
    sx={{
      mt: 1,
      overflow: 'hidden',
      maskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)',
      WebkitMaskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 1.25,
        width: 'max-content',
        mx: 'auto',
        animation: 'assetLogoMarquee 22s linear infinite',
        '@keyframes assetLogoMarquee': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      {MARQUEE_LOGOS.map((asset, i) => (
        <Box
          key={`${asset.symbol}-${i}`}
          title={asset.symbol}
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: '50%',
            bgcolor: soft.surfaceRaised,
            border: `1px solid ${palette.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0.75,
          }}
        >
          <Box
            component="img"
            src={asset.src}
            alt={asset.alt}
            width={20}
            height={20}
            loading="lazy"
            sx={{ width: 20, height: 20, objectFit: 'contain' }}
          />
        </Box>
      ))}
    </Box>
  </Box>
);

/** A short, illustrative strategy — not real trading logic — under the Strategies node. */
const CODE_LINES = [
  { indent: 0, tokens: [{ t: 'def', kw: true }, { t: ' strategy(data):' }] },
  { indent: 1, tokens: [{ t: 'fast = sma(data.close, 10)' }] },
  { indent: 1, tokens: [{ t: 'slow = sma(data.close, 50)' }] },
  { indent: 1, tokens: [{ t: 'if', kw: true }, { t: ' fast > slow:' }] },
  { indent: 2, tokens: [{ t: 'return', kw: true }, { t: ' Signal.LONG' }] },
  { indent: 1, tokens: [{ t: 'return', kw: true }, { t: ' Signal.FLAT' }] },
] as const;

/** The mini "code simulation" under the Strategies node's description. */
const StrategyCodeSample = () => (
  <Box
    aria-hidden
    sx={{
      ...inkSurfaceSx,
      p: 1.75,
      fontFamily: fonts.mono,
      fontSize: '0.76rem',
      lineHeight: 1.75,
    }}
  >
    {CODE_LINES.map((line, i) => (
      <Box key={i} sx={{ pl: line.indent * 2, whiteSpace: 'pre' }}>
        {line.tokens.map((token, j) => (
          <Box
            key={j}
            component="span"
            sx={{ color: 'kw' in token && token.kw ? palette.yellow : soft.onInk }}
          >
            {token.t}
          </Box>
        ))}
      </Box>
    ))}
  </Box>
);

/** A steady upward curve under the Portfolios node — a bullish equity curve. */
const BULLISH_POINTS = [8, 14, 11, 18, 16, 24, 21, 30, 27, 36, 33, 42, 40, 50, 47, 58] as const;

const BullishChart = () => {
  const w = 260;
  const h = 64;
  const max = Math.max(...BULLISH_POINTS);
  const min = Math.min(...BULLISH_POINTS);
  const points = BULLISH_POINTS.map((v, i) => {
    const x = (i / (BULLISH_POINTS.length - 1)) * w;
    const y = h - 6 - ((v - min) / (max - min)) * (h - 12);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = points.join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <Box aria-hidden component="svg" viewBox={`0 0 ${w} ${h}`} sx={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="bullishFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.success} stopOpacity="0.22" />
          <stop offset="100%" stopColor={palette.success} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#bullishFill)" />
      <polyline points={line} fill="none" stroke={palette.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
};

/** The three brokerages under the Connect Broker node — logos only, no scroll needed for three. */
const BROKER_LOGOS = [
  { name: 'Webull', src: favicon('webull.com') },
  { name: 'TradeStation', src: favicon('tradestation.com') },
  { name: 'Alpaca', src: favicon('alpaca.markets') },
] as const;

const BrokerLogos = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.25, flexWrap: 'wrap', mt: -1 }}>
    {BROKER_LOGOS.map((b) => (
      <Box
        key={b.name}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.75,
          borderRadius: '999px',
          bgcolor: soft.surfaceRaised,
          border: `1px solid ${palette.border}`,
        }}
      >
        <Box component="img" src={b.src} alt="" width={18} height={18} loading="lazy" sx={{ width: 18, height: 18, objectFit: 'contain' }} />
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: soft.text }}>{b.name}</Typography>
      </Box>
    ))}
  </Box>
);

const nodes = [
  { cx: 330, cy: 100, num: 1, key: 'dataClusters', lx: 330, ly: 48, la: 'middle' as const },
  { cx: 469, cy: 180, num: 2, key: 'strategies', lx: 516, ly: 174, la: 'start' as const },
  { cx: 469, cy: 340, num: 3, key: 'studies', lx: 516, ly: 334, la: 'start' as const },
  { cx: 330, cy: 420, num: 4, key: 'portfolios', lx: 330, ly: 468, la: 'middle' as const },
  { cx: 191, cy: 340, num: 5, key: 'riskManagers', lx: 144, ly: 334, la: 'end' as const },
  { cx: 191, cy: 180, num: 6, key: 'connectBroker', lx: 144, ly: 174, la: 'end' as const },
] as const;

const hexPoints = nodes.map((n) => `${n.cx},${n.cy}`).join(' ');

/** Autoplay tick and how long a manual pick holds the carousel before it resumes. */
const AUTOPLAY_MS = 4200;
const RESUME_DELAY_MS = 8000;

/**
 * Whether the carousel may tick: the panel is on screen, the tab is visible
 * and the visitor has not asked for reduced motion. Off screen, every tick
 * re-rendered the hexagon and its SVG filters for nobody; on a phone, a
 * description that changes length while the band is in view is a layout
 * shift the visitor did not cause.
 */
function useAutoplayAllowed(target: RefObject<HTMLElement | null>): boolean {
  // False on the server and on the first client render alike; the effect
  // decides once the element is measurable.
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = false;
    const update = () =>
      setAllowed(inView && document.visibilityState === 'visible' && !reduced.matches);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(el);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
    };
  }, [target]);

  return allowed;
}

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
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoplay = useAutoplayAllowed(carouselRef);

  useEffect(() => {
    if (paused || !autoplay) return undefined;
    const id = setInterval(() => setActive((i) => (i + 1) % nodes.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, autoplay]);

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
  const nodeExtra =
    activeNode.key === 'dataClusters' ? (
      <AssetLogoMarquee />
    ) : activeNode.key === 'strategies' ? (
      <StrategyCodeSample />
    ) : activeNode.key === 'portfolios' ? (
      <BullishChart />
    ) : activeNode.key === 'connectBroker' ? (
      <BrokerLogos />
    ) : null;

  return (
    <Section
      id="platform"
      size="lg"
      background={
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: '50%',
            right: { xs: -160, md: -220 },
            width: { xs: 420, md: 620 },
            height: { xs: 420, md: 620 },
            background:
              'radial-gradient(circle, rgba(232,185,35,0.28) 0%, rgba(241,53,60,0.18) 45%, rgba(26,26,26,0) 72%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      }
    >
      <SectionHeader
        align="left"
        eyebrow={t('workflow.eyebrow')}
        title={t('workflow.title')}
        titleAccent={t('workflow.titleAccent')}
        description={t('workflow.description')}
      />

      <AnimateOnScroll delay={190}>
        <Box
          component="ul"
          role="list"
          sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', columnGap: 3.5, rowGap: 1.5, mb: { xs: 5, md: 6 } }}
        >
          {(t('workflow.pipelineHighlights', { returnObjects: true }) as string[]).map((step) => (
            <Box component="li" key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckWell size={18} />
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: soft.text }}>{step}</Typography>
            </Box>
          ))}
        </Box>
      </AnimateOnScroll>

      <AnimateOnScroll delay={150}>
        <Box
          ref={carouselRef}
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

              <clipPath id="centerMarkClip">
                <circle cx="330" cy="260" r="36" />
              </clipPath>
              <image
                href={fintelaMark}
                x="298"
                y="228"
                width="64"
                height="64"
                clipPath="url(#centerMarkClip)"
                preserveAspectRatio="xMidYMid meet"
              />

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
            {/* From md the row stretches to the hexagon's height, so the copy
                never moves the panel; below it the copy sets the height, and
                the reserve is sized for the longest node (Portuguese, at
                360px: 232px; at 600px: 157px) so a tick is not a layout shift. */}
            <Box
              key={activeNode.num}
              sx={{
                flexGrow: 1,
                minHeight: { xs: 236, sm: 160, md: 0 },
                display: 'flex',
                flexDirection: 'column',
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
              {nodeExtra && <Box sx={{ mt: 4 }}>{nodeExtra}</Box>}
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
          </NeuPanel>
        </Box>
      </AnimateOnScroll>
    </Section>
  );
};
