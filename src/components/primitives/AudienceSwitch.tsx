import { Box, ButtonBase } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { navPillSx } from '../../theme/neu';
import { radii } from '../../theme/tokens';

export interface AudienceOption<T extends string> {
  value: T;
  label: string;
}

export interface AudienceSwitchProps<T extends string> {
  value: T;
  options: readonly AudienceOption<T>[];
  onChange: (next: T) => void;
  /** Accessible name of the group. */
  label: string;
  sx?: SxProps<Theme>;
}

/**
 * A radiogroup of pressed-well pills: the chosen seat is the sunken one, the
 * same cue the header uses for the current page. Arrow keys move the
 * selection, as a radiogroup should.
 */
export const AudienceSwitch = <T extends string>({
  value,
  options,
  onChange,
  label,
  sx,
}: AudienceSwitchProps<T>) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (idx + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <Box
      role="radiogroup"
      aria-label={label}
      sx={[{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>}
    >
      {options.map((o, idx) => {
        const checked = o.value === value;
        return (
          <ButtonBase
            key={o.value}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={checked ? 'is-active' : undefined}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            sx={[
              navPillSx,
              {
                minHeight: 36,
                px: 1.75,
                borderRadius: `${radii.pill}px`,
                fontSize: '0.88rem',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              },
            ]}
          >
            {o.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
};
