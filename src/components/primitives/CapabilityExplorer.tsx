import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { NeuPanel } from './NeuPanel';
import { IconWell } from './IconWell';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { fonts, soft } from '../../theme/tokens';

export interface CapabilityExplorerItem {
  key: string;
  icon: ReactNode;
}

export interface CapabilityExplorerProps {
  /** i18n namespace the copy lives in. */
  ns: string;
  /** Dotted key prefix; `${baseKey}.${item.key}.title|desc|bullets` are read under it. */
  baseKey: string;
  items: readonly CapabilityExplorerItem[];
}

/** A bullet's label/description pair (the shape every capacidades.md table row becomes once split). */
export interface CapabilityBullet {
  label: string;
  desc: string;
}

const renderBullet = (bullet: CapabilityBullet) => (
  <>
    <Box component="strong" sx={{ fontWeight: 700, color: soft.text }}>
      {bullet.label}
    </Box>
    {': '}
    {bullet.desc}
  </>
);

const IndexRow = ({
  index,
  active,
  icon,
  label,
  onSelect,
}: {
  index: number;
  active: boolean;
  icon: ReactNode;
  label: string;
  onSelect: () => void;
}) => (
  <NeuPanel
    component="li"
    variant="tile"
    interactive
    onClick={onSelect}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
      p: { xs: 1.25, md: 1.5 },
      cursor: 'pointer',
      ...(active && { outline: `2px solid ${soft.accent}`, outlineOffset: '-2px' }),
    }}
  >
    <Box
      aria-hidden
      sx={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '0.68rem',
        fontWeight: 700,
        fontFamily: fonts.mono,
        bgcolor: active ? soft.accent : soft.groundSunken,
        color: active ? soft.white : soft.textSecondary,
        transition: 'background-color 160ms ease, color 160ms ease',
      }}
    >
      {String(index + 1).padStart(2, '0')}
    </Box>
    <Typography
      sx={{
        fontSize: '0.86rem',
        fontWeight: active ? 700 : 600,
        color: active ? soft.text : soft.textSecondary,
        lineHeight: 1.35,
        flex: 1,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ color: active ? soft.accent : soft.textSecondary, display: 'flex', flexShrink: 0, '& svg': { fontSize: 20 } }}>
      {icon}
    </Box>
  </NeuPanel>
);

/**
 * A numbered index (left) that picks a capability, with a detail panel
 * (right) explaining it — the shared shape behind both the Agentic AI page's
 * capability list and the Fintela API page's resource/engine browsers.
 */
export const CapabilityExplorer = ({ ns, baseKey, items }: CapabilityExplorerProps) => {
  const { t } = useTranslation(ns);
  const [active, setActive] = useState(0);
  const item = items[active];
  const bullets = t(`${baseKey}.${item.key}.bullets`, { returnObjects: true }) as CapabilityBullet[];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 320px) 1fr' },
        gap: { xs: 2, md: 3 },
        alignItems: 'stretch',
      }}
    >
      <AnimateOnScroll direction="left" stretch>
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((c, idx) => (
            <IndexRow
              key={c.key}
              index={idx}
              active={idx === active}
              icon={c.icon}
              label={t(`${baseKey}.${c.key}.title`)}
              onSelect={() => setActive(idx)}
            />
          ))}
        </Box>
      </AnimateOnScroll>

      <AnimateOnScroll delay={80} direction="right" stretch>
        <NeuPanel sx={{ p: { xs: 2.5, md: 3.5 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <IconWell size={44}>{item.icon}</IconWell>
          <Typography component="h4" sx={{ fontWeight: 800, fontSize: '1.15rem', color: soft.text, mt: 2, mb: 1, letterSpacing: '-0.01em' }}>
            {t(`${baseKey}.${item.key}.title`)}
          </Typography>
          <Typography sx={{ color: soft.textSecondary, fontSize: '0.94rem', lineHeight: 1.65, mb: 2.5 }}>
            {t(`${baseKey}.${item.key}.desc`)}
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {bullets.map((b) => (
              <Box component="li" key={b.label} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <CheckRoundedIcon sx={{ fontSize: 16, color: soft.accent, mt: '3px', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.6, color: soft.text }}>{renderBullet(b)}</Typography>
              </Box>
            ))}
          </Box>
        </NeuPanel>
      </AnimateOnScroll>
    </Box>
  );
};
