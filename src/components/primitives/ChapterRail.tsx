import { Box, ButtonBase, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { navPillSx, wellSx } from '../../theme/neu';
import { radii, shadows, soft } from '../../theme/tokens';
import { formatTime } from '../../media/chapters';
import type { VideoChapter } from '../../media/chapters';

export interface ChapterRailProps {
  chapters: readonly VideoChapter[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  /**
   * 'rows': numbered rows with a timestamp, for a rail plate.
   * 'pills': a pressed-pill strip in a sunken well, for under a viewport.
   */
  orientation?: 'rows' | 'pills';
  /** Accessible name of the list. */
  label: string;
  sx?: SxProps<Theme>;
}

/**
 * The chapters of a demo as pressed-well controls: the current chapter is the
 * sunken one, exactly as the current page is in the header nav. Rows are
 * buttons with aria-pressed, so the rail is the keyboard route to any chapter.
 */
export const ChapterRail = ({
  chapters,
  activeId,
  onSelect,
  orientation = 'rows',
  label,
  sx,
}: ChapterRailProps) => {
  if (orientation === 'pills') {
    return (
      <Box
        component="ul"
        role="list"
        aria-label={label}
        sx={
          [
            wellSx('sm'),
            {
              m: 0,
              p: 0.75,
              listStyle: 'none',
              borderRadius: `${radii.neuInner}px`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ] as SxProps<Theme>
        }
      >
        {chapters.map((c) => (
          <li key={c.id}>
            <ButtonBase
              onClick={() => onSelect(c.id)}
              aria-pressed={c.id === activeId}
              className={c.id === activeId ? 'is-active' : undefined}
              sx={[
                navPillSx,
                {
                  height: 30,
                  px: 1.5,
                  borderRadius: `${radii.pill}px`,
                  fontSize: '0.8rem',
                  fontFamily: 'inherit',
                  // On a sunken strip the pressed pill is white, not sunken-on-sunken.
                  '&.is-active, &.is-active:hover': {
                    backgroundColor: soft.surfaceRaised,
                    boxShadow: shadows.neuRaisedXs,
                  },
                },
              ]}
            >
              {c.label}
            </ButtonBase>
          </li>
        ))}
      </Box>
    );
  }

  return (
    <Box
      component="ol"
      aria-label={label}
      sx={
        [
          { m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.5 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>
      }
    >
      {chapters.map((c, idx) => {
        const active = c.id === activeId;
        return (
          <li key={c.id}>
            <ButtonBase
              onClick={() => onSelect(c.id)}
              aria-pressed={active}
              className={active ? 'is-active' : undefined}
              sx={[
                navPillSx,
                {
                  width: '100%',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  gap: 1.5,
                  px: 1.5,
                  py: 1.1,
                  borderRadius: `${radii.neuWell}px`,
                  fontFamily: 'inherit',
                },
              ]}
            >
              <Box
                aria-hidden
                sx={{
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: `${radii.pill}px`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  bgcolor: active ? soft.surfaceRaised : soft.groundSunken,
                  color: active ? soft.accent : soft.textSecondary,
                  boxShadow: active ? shadows.neuRaisedXs : 'none',
                }}
              >
                {idx + 1}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  component="span"
                  sx={{ display: 'block', fontSize: '0.9rem', fontWeight: 'inherit', color: active ? soft.text : 'inherit', lineHeight: 1.3 }}
                >
                  {c.label}
                </Typography>
                {c.sub && (
                  <Typography component="span" sx={{ display: 'block', fontSize: '0.76rem', color: soft.textSecondary, lineHeight: 1.4 }}>
                    {c.sub}
                  </Typography>
                )}
              </Box>
              <Typography
                component="span"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '0.72rem',
                  color: soft.textSecondary,
                  flexShrink: 0,
                }}
              >
                {formatTime(c.start)}
              </Typography>
            </ButtonBase>
          </li>
        );
      })}
    </Box>
  );
};
