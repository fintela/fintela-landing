import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Box } from '@mui/material';
import { NeuPanel } from '../../components/primitives/NeuPanel';
import { HEADER_OFFSET } from '../../lib/scrollToSection';
import { wellSx } from '../../theme/neu';
import { gradients, palette, shadows, soft } from '../../theme/tokens';
import { createLine } from './geometry';
import type { IsoLineGeometry } from './geometry';
import { IsoKeyframes } from './IsoKeyframes';
import { Floor, Packet, Plate, StepLabel, Track } from './parts';
import { SurfaceFrame } from './surface';
import { ease, PIN, size, STEP_VH, time, WIDE_FLOW } from './tokens';
import { useScrollStations } from './useScrollStations';

export interface IsoStation {
  key: string;
  /** The station's name, beside its plate and on its card. */
  label: string;
  /** The small line under the name on the card. */
  sub: string;
  /** What the step is. */
  desc: string;
  /** What the work has become at this step. */
  packet: string;
  /** Set a packet that is an identifier in the mono face. */
  packetMono?: boolean;
  /** What this step hands to the next. */
  handoff: string;
  /** The dark plate marks the line's destination. Use it once, at most. */
  dark?: boolean;
  /** The plate's flat art and lifted pieces. */
  art: (on: boolean) => ReactNode;
  /** The piece of the product this step produces. `progress` runs 0 to 1 through its slice. */
  surface: (progress: number) => ReactNode;
}

export interface IsoLineProps {
  stations: IsoStation[];
  /** Names the whole line for assistive tech. */
  label: string;
  stepLabel: (n: number, name: string) => string;
}

const Line = memo(
  ({
    line,
    stations,
    active,
    scale,
    onPick,
    fillRef,
  }: {
    line: IsoLineGeometry;
    stations: IsoStation[];
    active: number;
    scale: number;
    onPick: (i: number) => void;
    fillRef: RefObject<SVGPolylineElement | null>;
  }) => (
    <Floor x={line.origin.x} y={line.origin.y} scale={scale}>
      <Track line={line} fillRef={fillRef} />
      {stations.map((station, i) => (
        <Plate
          key={station.key}
          x={line.plates[i].x}
          y={line.plates[i].y}
          state={i === active ? 'active' : i < active ? 'done' : 'waiting'}
          dark={station.dark}
          onPick={() => onPick(i)}
        >
          {station.art(i === active)}
        </Plate>
      ))}
    </Floor>
  )
);
Line.displayName = 'Line';

const Labels = memo(
  ({
    line,
    stations,
    active,
    scale,
    onPick,
    stepLabel,
  }: {
    line: IsoLineGeometry;
    stations: IsoStation[];
    active: number;
    scale: number;
    onPick: (i: number) => void;
    stepLabel: IsoLineProps['stepLabel'];
  }) => (
    <>
      {stations.map((station, i) => (
        <div
          key={station.key}
          style={{
            position: 'absolute',
            left: line.w * scale + size.labelsGap,
            top: line.screenAt(i).y * scale,
            width: size.labelsWidth,
            transform: 'translateY(-50%)',
          }}
        >
          <StepLabel
            index={i}
            name={station.label}
            on={i === active}
            ariaLabel={stepLabel(i + 1, station.label)}
            onClick={() => onPick(i)}
          />
          {i === active && (
            <Packet key={station.key} mono={station.packetMono}>
              {station.packet}
            </Packet>
          )}
        </div>
      ))}
    </>
  )
);
Labels.displayName = 'Labels';

/** The line and its names, scaled to the room the column has. Only shown while pinned. */
const Stage = ({
  line,
  stations,
  active,
  label,
  stepLabel,
  onPick,
  fillRef,
}: {
  line: IsoLineGeometry;
  stations: IsoStation[];
  active: number;
  label: string;
  stepLabel: IsoLineProps['stepLabel'];
  onPick: (i: number) => void;
  fillRef: RefObject<SVGPolylineElement | null>;
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setRoom((r) => (r.w === width && r.h === height ? r : { w: width, h: height }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = room.w
    ? Math.max(
        size.minScale,
        Math.min(1, (room.w - size.labelsWidth - size.labelsGap) / line.w, room.h / line.h)
      )
    : 0.8;
  const width = line.w * scale + size.labelsGap + size.labelsWidth;
  const height = line.h * scale;

  return (
    <Box
      ref={boxRef}
      role="group"
      aria-label={label}
      sx={{
        display: 'none',
        [PIN]: {
          display: 'block',
          position: 'relative',
          alignSelf: 'stretch',
          minWidth: 0,
          userSelect: 'none',
        },
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: Math.max(0, (room.w - width) / 2),
          top: Math.max(0, (room.h - height) / 2),
          width,
          height,
        }}
      >
        <Line
          line={line}
          stations={stations}
          active={active}
          scale={scale}
          onPick={onPick}
          fillRef={fillRef}
        />
        <Labels
          line={line}
          stations={stations}
          active={active}
          scale={scale}
          onPick={onPick}
          stepLabel={stepLabel}
        />
      </div>
    </Box>
  );
};

/**
 * What the step is, above the piece of the product it produces. While pinned all
 * stations sit in one grid cell and cross-fade, so the column is as tall as the
 * tallest station and never jumps; in the flow they simply follow each other.
 */
const StationCards = memo(
  ({
    station,
    index,
    on,
    progress,
  }: {
    station: IsoStation;
    index: number;
    on: boolean;
    progress: number;
  }) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 2.5,
        alignContent: 'start',
        [WIDE_FLOW]: {
          gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)',
          gap: 4,
          alignItems: 'start',
        },
        [PIN]: {
          gridArea: '1 / 1',
          opacity: on ? 1 : 0,
          visibility: on ? 'visible' : 'hidden',
          transform: on ? 'none' : 'translateY(10px)',
          transition: on
            ? `opacity ${time.cardIn}s ease ${time.cardInDelay}s, transform ${time.cardIn}s ${ease.settle} ${time.cardInDelay}s, visibility 0s`
            : `opacity ${time.cardOut}s ease, transform ${time.cardOut}s ease, visibility 0s linear ${time.cardOut}s`,
        },
      }}
    >
      <NeuPanel sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box
            aria-hidden
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 16,
              color: soft.white,
              background: gradients.brand,
              boxShadow: shadows.brandStrong,
            }}
          >
            {index + 1}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box
              component="h3"
              sx={{
                m: 0,
                fontSize: { xs: 21, md: 24 },
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: soft.text,
              }}
            >
              {station.label}
            </Box>
            <Box
              sx={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: soft.textSecondary,
              }}
            >
              {station.sub}
            </Box>
          </Box>
        </Box>
        <Box
          component="p"
          sx={{ m: 0, fontSize: { xs: 15, md: 16 }, lineHeight: 1.6, color: soft.textSecondary }}
        >
          {station.desc}
        </Box>
        <Box
          sx={{
            ...wellSx('sm'),
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.75,
            py: 1.25,
            borderRadius: '12px',
            fontSize: 14,
            fontWeight: 600,
            color: soft.text,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: palette.yellow,
              flexShrink: 0,
            }}
          />
          {station.handoff}
        </Box>
      </NeuPanel>
      <NeuPanel sx={{ p: { xs: 2.25, md: 3 }, minWidth: 0, overflow: 'hidden' }}>
        <SurfaceFrame>{station.surface(progress)}</SurfaceFrame>
      </NeuPanel>
    </Box>
  )
);
StationCards.displayName = 'StationCards';

/**
 * The whole pattern: an isometric line walked by scrolling, with the cards beside
 * it saying what each step is and showing what it produces. Where there is room the
 * frame pins under the header; elsewhere, phones and print included, the cards
 * follow each other in the flow. The prerendered page carries every station either way.
 *
 * Keep `stations` stable with useMemo, or every scroll step re-renders the plates.
 */
export const IsoLine = ({ stations, label, stepLabel }: IsoLineProps) => {
  const count = stations.length;
  const line = useMemo(() => createLine(count), [count]);
  const { trackRef, frameRef, fillRef, active, pick, progressOf } = useScrollStations(count);

  return (
    <Box
      ref={trackRef}
      sx={{ [PIN]: { height: `calc(100vh - ${HEADER_OFFSET}px + ${count * STEP_VH}vh)` } }}
    >
      <IsoKeyframes />
      <Box
        ref={frameRef}
        sx={{
          [PIN]: {
            position: 'sticky',
            top: HEADER_OFFSET,
            height: `calc(100vh - ${HEADER_OFFSET}px)`,
            boxSizing: 'border-box',
            py: 2,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 6fr)',
            columnGap: 6,
            alignItems: 'center',
          },
        }}
      >
        <Stage
          line={line}
          stations={stations}
          active={active}
          label={label}
          stepLabel={stepLabel}
          onPick={pick}
          fillRef={fillRef}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: { xs: 5, md: 6 },
            [WIDE_FLOW]: { mt: 3 },
          }}
        >
          {stations.map((station, i) => (
            <StationCards
              key={station.key}
              station={station}
              index={i}
              on={i === active}
              progress={progressOf(i)}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};
