/**
 * Every image and video slot on the marketing pages, in one typed map.
 *
 * Stills are imported so Vite hashes and caches them — through vite-imagetools'
 * picture directive, so each one ships as AVIF, WebP and JPEG at the widths
 * its slot needs (`w=` below is "the slot at 1x; the slot at 2x", from the
 * media audit; the plugin never upscales, so a rung wider than the source is
 * clamped to it). The registry keeps handing out plain URL strings (the JPEG
 * fallback), and MediaWell finds the full source set from that string; see
 * src/media/picture.ts for why. Product stills are frames of the demo
 * recordings, cropped to drop the app's sidebar and the recorder's status
 * bar; photographs are cropped to their slot's ratio around their subject.
 * Each file is placed exactly once on the site.
 *
 * Videos never enter the bundle: they are read from the `media/` prefix
 * (`public/media/` in this repo, or another origin through
 * `VITE_MEDIA_BASE_URL`, the same way `VITE_BLOG_BASE_URL` repoints the blog).
 * scripts/encode-media.sh writes those files from the masters in
 * media-masters/, and scripts/check-media.mjs fails the build when a URL
 * listed here has no file behind it — a missing file is not a broken page
 * (the plate shows its poster) but it is a wasted request on every visit.
 *
 * The demo recordings are silent screen captures, so they carry no captions;
 * a video with speech lists its WebVTT files (one per locale) under
 * `captions`. The multi-agent transcript (FintelligentSection) reads its cues
 * from i18n, which is the same text those captions carry.
 */
import { LNG_LABELS, SUPPORTED_LNGS } from '../i18n/config';
import { registerPicture } from './picture';
import type { Picture, PictureFraming } from './picture';
import thesisToEdgePoster from '../assets/media/hero/thesis-to-edge-poster.jpg?w=640;1280&format=avif;webp;jpeg&as=picture';
import tourPlatformHome from '../assets/media/tour/platform-home-poster.jpg?w=800;1600&format=avif;webp;jpeg&as=picture';
import walkthroughPoster from '../assets/media/capabilities/walkthrough-poster.jpg?w=560;1120&format=avif;webp;jpeg&as=picture';
import liveOps from '../assets/media/capabilities/live-ops.jpg?w=260;520&format=avif;webp;jpeg&as=picture';
import awardCeremony from '../assets/media/awards/hedgeweek-2026-ceremony.jpg?w=640;1280&format=avif;webp;jpeg&as=picture';
import audienceFunds from '../assets/media/audiences/funds.jpg?w=560;1120&format=avif;webp;jpeg&as=picture';
import audienceTeams from '../assets/media/audiences/teams.jpg?w=560;1120&format=avif;webp;jpeg&as=picture';
import audienceIndependents from '../assets/media/audiences/independents.jpg?w=560;1120&format=avif;webp;jpeg&as=picture';
import audienceAdvisors from '../assets/media/audiences/advisors.jpg?w=560;1120&format=avif;webp;jpeg&as=picture';
import fundsHeroMeeting from '../assets/media/solutions/funds-hero-meeting.jpg?w=480;960&format=avif;webp;jpeg&as=picture';
import teamsHeroCollab from '../assets/media/solutions/teams-hero-collab.jpg?w=480;960&format=avif;webp;jpeg&as=picture';
import independentsHeroDesk from '../assets/media/solutions/independents-hero-desk.jpg?w=480;960&format=avif;webp;jpeg&as=picture';
import advisorsHeroConsult from '../assets/media/solutions/advisors-hero-consult.jpg?w=480;960&format=avif;webp;jpeg&as=picture';

/** A still's URL for the slots typed against a string; MediaWell recovers the picture. */
const still = (picture: Picture, framing?: PictureFraming): string =>
  registerPicture(picture, framing);

/** `<base>media/`; mirrors `collectionBase` in src/content/json.ts. */
const MEDIA_BASE = (
  (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined) || `${import.meta.env.BASE_URL}media/`
).replace(/\/?$/, '/');

export const mediaUrl = (file: string): string => `${MEDIA_BASE}${file}`;

export type VideoId = 'thesisToEdge' | 'platformHome' | 'walkthrough';

/** The app's page colour, which the recordings sit on (and the hero loop is padded with). */
const APP_GROUND = '#f8fbfd';

export interface VideoSource {
  mp4: string;
  webm?: string;
  /**
   * AV1 in MP4 (`libsvtav1`, see scripts/encode-media.sh), offered first: a
   * browser that decodes it takes a file a third smaller, the rest fall
   * through to `mp4`. Only kept when the saving is real (>30 %).
   */
  av1?: string;
}

export interface VideoAsset {
  /**
   * Files under the media prefix. Absent (not merely missing on disk) when
   * the recording does not exist yet: the plate is then its poster from the
   * first paint, with no request that the CDN could only answer with HTML.
   */
  src?: VideoSource;
  /** Trimmed, silent loop for the hero plate. Falls back to `src` when absent. */
  ambient?: VideoSource;
  poster: string;
  /** i18n key (`home` namespace) for the poster's alt text. */
  posterAltKey: string;
  /** No audio track: the player hides its volume control. */
  silent?: boolean;
  /** The recording's own page colour; a grown plate contains the frame on it. */
  ground?: string;
  /** WebVTT files, one per locale, under `media/captions/`. Absent for silent recordings. */
  captions?: Record<'en' | 'es' | 'pt', string>;
}

/**
 * The six chapters of the portfolios recording (`platformHome`, 36 s): the
 * ranked trials, the risk charts, the promote menu, the analysis report, its
 * holdings, then the performance tab. Labels live under `home:tour.chapters.*`.
 */
export const TOUR_CHAPTERS = [
  { id: 'ranking', start: 0 },
  { id: 'risk', start: 3 },
  { id: 'promote', start: 13.5 },
  { id: 'report', start: 16 },
  { id: 'holdings', start: 20 },
  { id: 'performance', start: 28.5 },
] as const;

export const VIDEOS: Record<VideoId, VideoAsset> = {
  /**
   * "From thesis to edge", the home hero's film: an AI is plugged in, a market
   * universe is snapshotted, a thesis becomes a strategy, the optimizer
   * searches, portfolio candidates are ranked, one is tested out of sample and
   * deployed live (30 s, 1280×720, 60 fps). The hero loops it muted, so the
   * encode is silent (the master has music). Its captions are drawn into the
   * picture, in English only. The poster is the frame at 6.3 s.
   */
  thesisToEdge: {
    // No `av1`: SVT-AV1 came out only 20 % smaller than x264 crf 26 on this cut
    // (scripts/encode-media.sh drops an AV1 that is not >30 % smaller).
    src: { mp4: mediaUrl('thesis-to-edge.mp4') },
    poster: still(thesisToEdgePoster),
    posterAltKey: 'hero.filmAlt',
    silent: true,
  },
  /** Portfolios dashboard → risk charts → promote → the analysis report (36 s, silent). */
  platformHome: {
    src: { mp4: mediaUrl('platform-home.mp4') },
    /** The platform home scrolled once, top to bottom and back (7 s, silent). */
    ambient: { mp4: mediaUrl('platform-home-loop.mp4') },
    poster: still(tourPlatformHome),
    posterAltKey: 'tour.posterAlt',
    silent: true,
    ground: APP_GROUND,
  },
  /** Markets: pulse → ticker → groups → screener (21 s, silent). */
  walkthrough: {
    // No `av1`: at crf 38 SVT-AV1 came out larger than x264 crf 27 on this
    // capture (scripts/encode-media.sh drops an AV1 that is not >30 % smaller).
    src: { mp4: mediaUrl('feature-walkthrough.mp4') },
    poster: still(walkthroughPoster),
    posterAltKey: 'capabilities.posterAlt',
    silent: true,
    ground: APP_GROUND,
  },
};

/** The <track> list a VideoPlate renders for a video, labelled by endonym. */
export const captionTracks = (video: VideoAsset) => {
  const { captions } = video;
  if (!captions) return [];
  return SUPPORTED_LNGS.map((lang) => ({ lang, label: LNG_LABELS[lang], src: captions[lang] }));
};

export const STILLS = {
  liveOps: still(liveOps),
  /**
   * The home award band's photo: the team with the Hedgeweek US Awards 2026
   * trophy, cut 4/3 around both people from the photographer's original. It
   * is the other frame of the moment the award post's cover shows, so the
   * band and that post's card in the blog band never repeat one picture.
   */
  awardCeremony: still(awardCeremony),
  /**
   * 800×1000 portraits (cropped for the dossier's former 4/5 seat) in what is
   * now a 16/9 well, which shows a 45 % band of each: `objectPosition` puts
   * that band on the subject — the building's corner, the two heads and their
   * screens — instead of the middle (audit IMG-08). A 16/9 re-crop of the
   * originals (src/media/README.md lists them) would also recover the
   * resolution the slot wants at 2x; that is a creative cut, left to the user.
   */
  audiences: {
    funds: still(audienceFunds, { objectPosition: 'center 30%' }),
    teams: still(audienceTeams, { objectPosition: 'center 28%' }),
    independents: still(audienceIndependents, { objectPosition: 'center 20%' }),
    advisors: still(audienceAdvisors, { objectPosition: 'center 30%' }),
  },
  /**
   * Each solution hero's plate beside the H1, 4/5 — one photograph per seat,
   * each used on its own page only. They are atmosphere, not evidence: the
   * chapters below carry the proof.
   */
  heroPlate: {
    funds: still(fundsHeroMeeting, { objectPosition: 'center 38%' }),
    teams: still(teamsHeroCollab, { objectPosition: 'center 45%' }),
    independents: still(independentsHeroDesk, { objectPosition: 'center 35%' }),
    advisors: still(advisorsHeroConsult, { objectPosition: 'center 40%' }),
  },
} as const;
