import { Box, IconButton, Slider, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { KeyboardEvent, Ref, SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import { neuIconButtonSx, trackWellSx } from '../../theme/neu';
import { fonts, motion, shadows, soft } from '../../theme/tokens';
import { chapterAt, formatTime } from '../../media/chapters';
import type { VideoChapter, VideoPlateHandle } from '../../media/chapters';
import type { VideoSource } from '../../media/registry';
import { MediaWell } from './MediaWell';
import type { MediaRatio } from './MediaWell';
import { PlayPuck } from './PlayPuck';

export interface VideoCaption {
  src: string;
  lang: string;
  label: string;
}

export interface VideoPlateProps {
  /** Files under the media prefix. Missing on disk → the plate stays a poster. */
  src?: VideoSource;
  /** A registry still: rendered as a responsive <picture> under the video. */
  poster: string;
  posterAlt: string;
  /** How wide the plate renders, for the poster's rung choice (MediaWell `sizes`). */
  sizes?: string;
  captions?: VideoCaption[];
  /** The file has no audio track: no volume control to offer. */
  silent?: boolean;
  /**
   * 'ambient': silent loop that plays only while on screen and only without
   * reduced motion — a moving still. 'player': play puck, controls, captions.
   */
  mode: 'ambient' | 'player';
  chapters?: readonly VideoChapter[];
  ratio?: MediaRatio;
  tier?: 'md' | 'sm';
  /** Accessible name of the player region. */
  label: string;
  onChapterChange?: (id: string) => void;
  onPlayingChange?: (playing: boolean) => void;
  /**
   * Fill the plate's height when the plate is stretched by a taller neighbour
   * (a grid row, a bento cell): the viewport grows past its ratio and the
   * frame covers it. Off, the ratio is exact and any spare height stays blank.
   */
  grow?: boolean;
  /**
   * The colour behind the frame. Set, the whole frame is always visible
   * (contained, never cropped) and the spare band is painted this colour —
   * a recording's own page colour makes the band read as page margin, so a
   * grown viewport never cuts a column off the app.
   */
  ground?: string;
  /**
   * Bleeds the plate to its panel's own top/left/right edges and drops the
   * well's deboss, so the video sits flat with the surface instead of sunk
   * into it. The bleed amount is hardcoded to `{xs: 1.5, md: 2}` — the panel
   * padding every current `flush` call site shares; a panel padded
   * differently would need its own override instead of this prop.
   */
  flush?: boolean;
  ref?: Ref<VideoPlateHandle>;
  sx?: SxProps<Theme>;
}

const SEEK_STEP = 5;

/** A plate is roughly a column of the grid: two thirds of the viewport from md, all of it below. */
const DEFAULT_SIZES = '(min-width: 1200px) 760px, (min-width: 900px) 66vw, 100vw';

/** The controls row's height (the 40 px icon buttons), reserved before the controls exist. */
const CONTROLS_HEIGHT = 40;

/** AV1 Main profile, level 4.0, 8-bit — what scripts/encode-media.sh writes. */
const AV1_TYPE = 'video/mp4; codecs="av01.0.08M.08"';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const saveData = () =>
  typeof navigator !== 'undefined' &&
  Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

/**
 * A native <video> set into a MediaWell, with the site's own controls on the
 * plate. No player library: the surface IS the design, and the element already
 * does captions, fullscreen and keyboard focus.
 *
 * The poster is a responsive <picture> in the well (lazy, so a plate below the
 * fold costs nothing on the first paint); the <video> sits over it, transparent
 * until it has a frame, and never carries a `poster` attribute — that would
 * fetch the JPEG the picture already replaced. Sources attach lazily — on
 * intersection for both modes, or on the first play/seek for 'player' — so
 * the home page never downloads a demo nobody watches; the controls row keeps
 * its height from the first paint and fills in on `loadedmetadata`, so
 * neither a late file nor a missing one moves what is below the plate. If
 * every source fails (the file is not published yet) the plate quietly stays
 * its poster: no broken control, no console noise in production.
 */
export const VideoPlate = ({
  src,
  poster,
  posterAlt,
  sizes = DEFAULT_SIZES,
  captions = [],
  silent = false,
  mode,
  chapters = [],
  ratio = '16/9',
  tier = 'md',
  label,
  onChapterChange,
  onPlayingChange,
  grow = false,
  ground,
  flush = false,
  ref,
  sx,
}: VideoPlateProps) => {
  const { t, i18n } = useTranslation('common');
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingSeek = useRef<number | null>(null);
  /** play() was asked for before the sources were attached: honour it once they are. */
  const pendingPlay = useRef(false);
  const scrubbing = useRef(false);
  const lastChapter = useRef<string | undefined>(undefined);

  const hasSource = Boolean(src?.mp4 || src?.webm || src?.av1);
  const [attached, setAttached] = useState(false);
  const [failed, setFailed] = useState(!hasSource);
  /** Metadata is in: duration is known, the controls can mean something. */
  const [ready, setReady] = useState(false);
  /** A frame is decoded: the video can show over the poster. */
  const [hasFrame, setHasFrame] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(mode === 'ambient');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const isPlayer = mode === 'player' && !failed;

  // Attach on intersection. Ambient plays only while on screen, never under
  // reduced motion or a data-saver connection, and pauses off screen — a loop
  // nobody sees still burns a core. A player only fetches its metadata once
  // it is nearly in view (the puck and the chapter rail attach it earlier on
  // demand), so a demo three viewports down costs the first paint nothing.
  useEffect(() => {
    if (failed || !hasSource) return;
    const frame = frameRef.current;
    if (!frame) return;
    if (mode === 'ambient' && (prefersReducedMotion() || saveData())) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (entry.isIntersecting) {
          setAttached(true);
          if (mode === 'ambient') video?.play().catch(() => {});
        } else if (mode === 'ambient') {
          video?.pause();
        }
      },
      mode === 'ambient' ? { threshold: 0.25 } : { rootMargin: '200px 0px', threshold: 0 }
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [mode, failed, hasSource]);

  // <source> children added after mount do not reload the element by themselves.
  useEffect(() => {
    if (!attached) return;
    const video = videoRef.current;
    if (!video) return;
    video.load();
    if (mode === 'ambient' || pendingPlay.current) {
      pendingPlay.current = false;
      video.play().catch(() => {});
    }
  }, [attached, mode]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const play = useCallback(() => {
    if (!attached) {
      // No <source> yet: attach, and let the load effect start playback.
      pendingPlay.current = true;
      setAttached(true);
      return;
    }
    videoRef.current?.play().catch(() => {});
  }, [attached]);
  const pause = useCallback(() => videoRef.current?.pause(), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);

  const seekTo = useCallback(
    (target: string | number, autoplay = true) => {
      const time =
        typeof target === 'number' ? target : (chapters.find((c) => c.id === target)?.start ?? 0);
      const video = videoRef.current;
      if (!video) return;
      if (!attached) setAttached(true);
      // Before metadata, currentTime is not settable in every browser; queue it.
      if (video.readyState >= 1) video.currentTime = time;
      else pendingSeek.current = time;
      setCurrentTime(time);
      if (autoplay) play();
    },
    [attached, chapters, play]
  );

  useImperativeHandle(
    ref,
    () => ({
      seekTo,
      play,
      pause,
      reveal: () => frameRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
    }),
    [seekTo, play, pause]
  );

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || scrubbing.current) return;
    setCurrentTime(video.currentTime);
    if (chapters.length && onChapterChange) {
      const active = chapterAt(chapters, video.currentTime);
      if (active && active.id !== lastChapter.current) {
        lastChapter.current = active.id;
        onChapterChange(active.id);
      }
    }
  };

  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    setReady(true);
    if (pendingSeek.current !== null) {
      video.currentTime = pendingSeek.current;
      pendingSeek.current = null;
    }
  };

  const setPlayingState = (next: boolean) => {
    setPlaying(next);
    onPlayingChange?.(next);
  };

  const onSourceError = () => {
    if (import.meta.env.DEV) console.warn(`[media] no playable source for "${label}"`);
    setFailed(true);
    setPlayingState(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isPlayer || e.target !== e.currentTarget) return;
    const video = videoRef.current;
    if (!video) return;
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        toggle();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        seekTo(Math.max(0, video.currentTime - SEEK_STEP), false);
        break;
      case 'ArrowRight':
        e.preventDefault();
        seekTo(
          Math.min(duration || video.currentTime + SEEK_STEP, video.currentTime + SEEK_STEP),
          false
        );
        break;
      case 'm':
        setMuted((m) => !m);
        break;
      case 'f':
        toggleFullscreen();
        break;
    }
  };

  const toggleFullscreen = () => {
    const frame = frameRef.current;
    if (!frame) return;
    if (document.fullscreenElement === frame) void document.exitFullscreen?.();
    else void frame.requestFullscreen?.();
  };

  const onScrub = (_e: Event | SyntheticEvent, value: number | number[]) => {
    scrubbing.current = true;
    setCurrentTime(Array.isArray(value) ? value[0] : value);
  };
  const onScrubEnd = (_e: Event | SyntheticEvent, value: number | number[]) => {
    scrubbing.current = false;
    seekTo(Array.isArray(value) ? value[0] : value, playing);
  };

  const captionLang = i18n.resolvedLanguage ?? i18n.language;
  // Smallest first: the browser takes the first type it can play. The error
  // handler goes on the last one — that is the only <source> whose failure
  // means the element has run out of candidates.
  const candidates = src
    ? [
        src.av1 && { src: src.av1, type: AV1_TYPE },
        src.webm && { src: src.webm, type: 'video/webm' },
        src.mp4 && { src: src.mp4, type: 'video/mp4' },
      ].filter((c): c is { src: string; type: string } => Boolean(c))
    : [];
  const sources = attached
    ? candidates.map((c, i) => (
        <source
          key={c.src}
          src={c.src}
          type={c.type}
          onError={i === candidates.length - 1 ? onSourceError : undefined}
        />
      ))
    : null;

  return (
    <Box
      sx={
        [
          { display: 'flex', flexDirection: 'column' },
          grow ? { flex: 1, minHeight: 0 } : {},
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>
      }
    >
      <MediaWell
        ref={frameRef}
        ratio={ratio}
        tier={tier}
        tone="plain"
        flush={flush}
        src={poster}
        alt={posterAlt}
        sizes={sizes}
        role={isPlayer ? 'group' : undefined}
        aria-label={isPlayer ? label : undefined}
        tabIndex={isPlayer ? 0 : undefined}
        onKeyDown={onKeyDown}
        data-playing={playing ? 'true' : 'false'}
        sx={{
          outline: 'none',
          // A definite height from flex-grow wins over the ratio, so the
          // viewport fills whatever the plate was stretched to.
          ...(grow ? { flex: '1 1 auto', minHeight: 0 } : {}),
          ...(ground
            ? { bgcolor: ground, '& > img, & > picture > img, & > video': { objectFit: 'contain' } }
            : {}),
          ...(flush ? { mt: { xs: -1.5, md: -2 }, mx: { xs: -1.5, md: -2 } } : {}),
          '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 3 },
          '&:fullscreen': { aspectRatio: 'auto', borderRadius: 0, bgcolor: soft.deep },
          // The puck hides while playing and returns on hover or focus.
          '&[data-playing="true"] .play-puck': { opacity: 0, transition: `opacity ${motion.base}` },
          '&[data-playing="true"]:hover .play-puck, &[data-playing="true"]:focus-within .play-puck':
            {
              opacity: 1,
            },
          '@media (forced-colors: active)': {
            '&:focus-visible': { outline: '3px solid Highlight' },
          },
        }}
      >
        {!failed && (
          <video
            ref={videoRef}
            preload={mode === 'player' ? 'metadata' : 'none'}
            playsInline
            muted={muted}
            loop={mode === 'ambient'}
            aria-label={posterAlt}
            tabIndex={-1}
            onPlay={() => setPlayingState(true)}
            onPause={() => setPlayingState(false)}
            onEnded={() => setPlayingState(false)}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onLoadedData={() => setHasFrame(true)}
            onPlaying={() => setHasFrame(true)}
            onVolumeChange={() => setMuted(videoRef.current?.muted ?? muted)}
            onClick={isPlayer ? toggle : undefined}
            style={{
              cursor: isPlayer ? 'pointer' : 'default',
              // The poster <picture> shows through until a frame is decoded.
              opacity: hasFrame ? 1 : 0,
              transition: `opacity ${motion.base}`,
            }}
          >
            {sources}
            {isPlayer &&
              captions.map((c) => (
                <track
                  key={c.lang}
                  kind="captions"
                  srcLang={c.lang}
                  label={c.label}
                  src={c.src}
                  default={c.lang === captionLang}
                />
              ))}
          </video>
        )}
        {isPlayer && (
          <PlayPuck
            className="play-puck"
            playing={playing}
            overlay
            aria-label={playing ? t('player.pause') : t('player.play')}
            onClick={toggle}
          />
        )}
      </MediaWell>

      {/*
        The row exists from the first paint whenever the registry promises a
        file, at its final height; the controls themselves arrive with the
        metadata. Filling a box of fixed height moves nothing, and a file that
        never arrives (a stale registry, a CDN answering HTML) leaves a quiet
        band rather than a jump — scripts/check-media.mjs catches the former.
      */}
      {mode === 'player' && hasSource && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, md: 1.5 },
            mt: 1.75,
            px: 0.25,
            minHeight: CONTROLS_HEIGHT,
          }}
        >
          {isPlayer && ready && (
            <>
              <IconButton
                aria-label={playing ? t('player.pause') : t('player.play')}
                onClick={toggle}
                sx={neuIconButtonSx}
              >
                {playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
              </IconButton>
              <Slider
                aria-label={t('player.seek')}
                value={Math.min(currentTime, duration || currentTime)}
                min={0}
                max={duration || 1}
                step={0.5}
                onChange={onScrub}
                onChangeCommitted={onScrubEnd}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => formatTime(v)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  height: 8,
                  py: '10px',
                  color: soft.accent,
                  '& .MuiSlider-rail': { ...trackWellSx, opacity: 1 },
                  '& .MuiSlider-track': {
                    border: 0,
                    height: 8,
                    borderRadius: '6px',
                    bgcolor: soft.accent,
                  },
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    bgcolor: soft.surfaceRaised,
                    boxShadow: shadows.neuRaisedSm,
                    transition: `box-shadow ${motion.fast}`,
                    '&::before': { display: 'none' },
                    '&:hover, &.Mui-focusVisible, &.Mui-active': { boxShadow: shadows.neuRaisedMd },
                  },
                  '& .MuiSlider-valueLabel': {
                    bgcolor: soft.accent,
                    borderRadius: '8px',
                    fontFamily: fonts.mono,
                    fontSize: '0.72rem',
                  },
                  '@media (forced-colors: active)': {
                    '& .MuiSlider-track': { background: 'Highlight' },
                    '& .MuiSlider-thumb': { boxShadow: 'none', border: '2px solid ButtonText' },
                  },
                }}
              />
              <Typography
                component="span"
                sx={{
                  fontFamily: fonts.mono,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '0.75rem',
                  color: soft.textSecondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
              {!silent && (
                <IconButton
                  aria-label={muted ? t('player.unmute') : t('player.mute')}
                  aria-pressed={muted}
                  onClick={() => setMuted((m) => !m)}
                  sx={[neuIconButtonSx, { width: 34, height: 34, '& svg': { fontSize: 18 } }]}
                >
                  {muted ? <VolumeOffRoundedIcon /> : <VolumeUpRoundedIcon />}
                </IconButton>
              )}
              <IconButton
                aria-label={fullscreen ? t('player.exitFullscreen') : t('player.fullscreen')}
                onClick={toggleFullscreen}
                sx={[neuIconButtonSx, { width: 34, height: 34, '& svg': { fontSize: 18 } }]}
              >
                {fullscreen ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}
              </IconButton>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};
