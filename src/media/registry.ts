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
import heroBackdropPoster from '../assets/media/hero/backdrop-poster.jpg?w=828;1280;1920&format=avif;webp;jpeg&as=picture';
import tourPlatformHome from '../assets/media/tour/platform-home-poster.jpg?w=800;1600&format=avif;webp;jpeg&as=picture';
import agentsPoster from '../assets/media/fintelligent/agents-poster.jpg?w=640;1280&format=avif;webp;jpeg&as=picture';
import walkthroughPoster from '../assets/media/capabilities/walkthrough-poster.jpg?w=560;1120&format=avif;webp;jpeg&as=picture';
import liveOps from '../assets/media/capabilities/live-ops.jpg?w=260;520&format=avif;webp;jpeg&as=picture';
import audienceFunds from '../assets/media/audiences/funds.jpg?w=560;1120&format=avif;webp;jpeg&as=picture';
import audienceTeams from '../assets/media/audiences/teams.jpg?w=560;1120&format=avif;webp;jpeg&as=picture';
import audienceIndependents from '../assets/media/audiences/independents.jpg?w=560;1120&format=avif;webp;jpeg&as=picture';
import audienceAdvisors from '../assets/media/audiences/advisors.jpg?w=560;1120&format=avif;webp;jpeg&as=picture';
import solutionFunds from '../assets/media/solutions/funds-hero.jpg?w=800;1600&format=avif;webp;jpeg&as=picture';
import fundsHeroMeeting from '../assets/media/solutions/funds-hero-meeting.jpg?w=480;960&format=avif;webp;jpeg&as=picture';
import teamsHeroCollab from '../assets/media/solutions/teams-hero-collab.jpg?w=480;960&format=avif;webp;jpeg&as=picture';
import independentsHeroDesk from '../assets/media/solutions/independents-hero-desk.jpg?w=480;960&format=avif;webp;jpeg&as=picture';
import advisorsHeroConsult from '../assets/media/solutions/advisors-hero-consult.jpg?w=480;960&format=avif;webp;jpeg&as=picture';
import solutionTeams from '../assets/media/solutions/teams-hero.jpg?w=800;1600&format=avif;webp;jpeg&as=picture';
import solutionIndependents from '../assets/media/solutions/independents-hero.jpg?w=800;1600&format=avif;webp;jpeg&as=picture';
import solutionAdvisors from '../assets/media/solutions/advisors-hero.jpg?w=800;1600&format=avif;webp;jpeg&as=picture';
import fundsResearch from '../assets/media/solutions/chapters/funds-research.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';
import fundsGovernance from '../assets/media/solutions/chapters/funds-governance.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';
import fundsExecution from '../assets/media/solutions/chapters/funds-execution.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';
import fundsWorkspace from '../assets/media/solutions/chapters/funds-workspace.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';
import teamsWorkspace from '../assets/media/solutions/chapters/teams-workspace.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';
import teamsResearch from '../assets/media/solutions/chapters/teams-research.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';
import teamsProvenance from '../assets/media/solutions/chapters/teams-provenance.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';
import teamsReports from '../assets/media/solutions/chapters/teams-reports.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';
import independentsNoDevops from '../assets/media/solutions/chapters/independents-no-devops.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';
import independentsOptimization from '../assets/media/solutions/chapters/independents-optimization.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';
import independentsLive from '../assets/media/solutions/chapters/independents-live.jpg?w=660;1280&format=avif;webp;jpeg&as=picture';

/** A still's URL for the slots typed against a string; MediaWell recovers the picture. */
const still = (picture: Picture, framing?: PictureFraming): string =>
  registerPicture(picture, framing);

/** `<base>media/`; mirrors `collectionBase` in src/content/json.ts. */
const MEDIA_BASE = (
  (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined) || `${import.meta.env.BASE_URL}media/`
).replace(/\/?$/, '/');

export const mediaUrl = (file: string): string => `${MEDIA_BASE}${file}`;

export type VideoId = 'platformHome' | 'agents' | 'walkthrough';

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
  /**
   * The multi-agent conversation — not recorded yet, so no `src` and no
   * `captions`: the band shows the poster. To enable it once the files are in
   * public/media (agents-conversation.mp4, optionally .av1.mp4/.webm, and
   * captions/agents-conversation.<en|es|pt>.vtt), add
   *   src: { mp4: mediaUrl(…) }  and  captions: { en: mediaUrl(…), … }
   * here; scripts/check-media.mjs then confirms every file exists.
   */
  agents: {
    poster: still(agentsPoster),
    posterAltKey: 'fintelligent.posterAlt',
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

/** One width of the hero loop; HeroVideoBackdrop takes the first rung the viewport meets. */
export interface HeroBackdropRung {
  /** CSS px; matched with `(min-width: …)` when the video attaches. */
  minWidth: number;
  src: string;
}

/**
 * The full-bleed loop behind the hero copy (36 s, silent). The source promo
 * carries burnt-in captions in its bottom 200 px, so the master is cropped to
 * 1920×880; the hero's own fade covers what remains. That master is never
 * served: the loop sits blurred behind copy, so a 1280 rung for desktops and
 * a 960 rung for tablets are all the pixels anyone can see, and below 600 px
 * the poster stands in (scripts/encode-media.sh, audit IMG-01). The poster is
 * the LCP image of the home page — the `Picture` itself, not its URL, because
 * HeroVideoBackdrop also preloads its AVIF rungs.
 */
export const HERO_BACKDROP = {
  poster: heroBackdropPoster,
  rungs: [
    { minWidth: 1024, src: mediaUrl('hero-backdrop-1280.mp4') },
    { minWidth: 600, src: mediaUrl('hero-backdrop-960.mp4') },
  ] as readonly HeroBackdropRung[],
} as const;

export const STILLS = {
  liveOps: still(liveOps),
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
  solutions: {
    funds: still(solutionFunds),
    teams: still(solutionTeams),
    independents: still(solutionIndependents),
    advisors: still(solutionAdvisors),
  },
  /** Each solution hero's right-hand plate, 4/5 — one photo per seat. */
  heroPlate: {
    funds: still(fundsHeroMeeting),
    teams: still(teamsHeroCollab),
    independents: still(independentsHeroDesk),
    advisors: still(advisorsHeroConsult),
  },
  /** Product frames for the solution chapters, one per chapter. */
  chapters: {
    funds: {
      research: still(fundsResearch),
      governance: still(fundsGovernance),
      execution: still(fundsExecution),
      workspace: still(fundsWorkspace),
    },
    teams: {
      workspace: still(teamsWorkspace),
      research: still(teamsResearch),
      provenance: still(teamsProvenance),
      reports: still(teamsReports),
    },
    independents: {
      noDevops: still(independentsNoDevops),
      optimization: still(independentsOptimization),
      live: still(independentsLive),
    },
  },
} as const;
