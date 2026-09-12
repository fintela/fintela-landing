/**
 * Every image and video slot on the marketing pages, in one typed map.
 *
 * Stills are imported so Vite hashes and caches them. Product stills are
 * frames of the demo recordings, cropped to drop the app's sidebar and the
 * recorder's status bar; photographs are cropped to their slot's ratio around
 * their subject. Each file is placed exactly once on the site.
 *
 * Videos never enter the bundle: they are read from the `media/` prefix
 * (`public/media/` in this repo, or another origin through
 * `VITE_MEDIA_BASE_URL`, the same way `VITE_BLOG_BASE_URL` repoints the blog).
 * Until a file exists at its URL the plate shows its poster, so a page never
 * breaks on a missing demo.
 *
 * The demo recordings are silent screen captures, so they carry no captions;
 * a video with speech lists its WebVTT files (one per locale) under
 * `captions`. The multi-agent transcript (FintelligentSection) reads its cues
 * from i18n, which is the same text those captions carry.
 */
import { LNG_LABELS, SUPPORTED_LNGS } from '../i18n/config';
import heroPlatformHome from '../assets/media/hero/platform-home-poster.jpg';
import tourPlatformHome from '../assets/media/tour/platform-home-poster.jpg';
import agentsPoster from '../assets/media/fintelligent/agents-poster.svg';
import walkthroughPoster from '../assets/media/capabilities/walkthrough-poster.jpg';
import liveOps from '../assets/media/capabilities/live-ops.jpg';
import audienceFunds from '../assets/media/audiences/funds.jpg';
import audienceTeams from '../assets/media/audiences/teams.jpg';
import audienceIndependents from '../assets/media/audiences/independents.jpg';
import solutionFunds from '../assets/media/solutions/funds-hero.jpg';
import solutionTeams from '../assets/media/solutions/teams-hero.jpg';
import solutionIndependents from '../assets/media/solutions/independents-hero.jpg';
import fundsResearch from '../assets/media/solutions/chapters/funds-research.jpg';
import fundsGovernance from '../assets/media/solutions/chapters/funds-governance.jpg';
import fundsExecution from '../assets/media/solutions/chapters/funds-execution.jpg';
import fundsWorkspace from '../assets/media/solutions/chapters/funds-workspace.jpg';
import teamsWorkspace from '../assets/media/solutions/chapters/teams-workspace.jpg';
import teamsResearch from '../assets/media/solutions/chapters/teams-research.jpg';
import teamsProvenance from '../assets/media/solutions/chapters/teams-provenance.jpg';
import teamsReports from '../assets/media/solutions/chapters/teams-reports.jpg';
import independentsNoDevops from '../assets/media/solutions/chapters/independents-no-devops.jpg';
import independentsOptimization from '../assets/media/solutions/chapters/independents-optimization.jpg';
import independentsLive from '../assets/media/solutions/chapters/independents-live.jpg';

/** `<base>media/`; mirrors `collectionBase` in src/content/json.ts. */
const MEDIA_BASE = (
  (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined) ||
  `${import.meta.env.BASE_URL}media/`
).replace(/\/?$/, '/');

export const mediaUrl = (file: string): string => `${MEDIA_BASE}${file}`;

export type VideoId = 'platformHome' | 'agents' | 'walkthrough';

/** The app's page colour, which the recordings sit on (and the hero loop is padded with). */
const APP_GROUND = '#f8fbfd';

export interface VideoSource {
  mp4: string;
  webm?: string;
}

export interface VideoAsset {
  /** Files under the media prefix. */
  src: VideoSource;
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
    poster: tourPlatformHome,
    posterAltKey: 'tour.posterAlt',
    silent: true,
    ground: APP_GROUND,
  },
  agents: {
    src: { mp4: mediaUrl('agents-conversation.mp4'), webm: mediaUrl('agents-conversation.webm') },
    poster: agentsPoster,
    posterAltKey: 'fintelligent.posterAlt',
    captions: {
      en: mediaUrl('captions/agents-conversation.en.vtt'),
      es: mediaUrl('captions/agents-conversation.es.vtt'),
      pt: mediaUrl('captions/agents-conversation.pt.vtt'),
    },
  },
  /** Markets: pulse → ticker → groups → screener (21 s, silent). */
  walkthrough: {
    src: { mp4: mediaUrl('feature-walkthrough.mp4') },
    poster: walkthroughPoster,
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

/** The hero plate's poster is a frame of the ambient loop, already 16/10. */
export const HERO_POSTER = heroPlatformHome;

export const STILLS = {
  liveOps,
  audiences: {
    funds: audienceFunds,
    teams: audienceTeams,
    independents: audienceIndependents,
  },
  solutions: {
    funds: solutionFunds,
    teams: solutionTeams,
    independents: solutionIndependents,
  },
  /** Product frames for the solution chapters, one per chapter. */
  chapters: {
    funds: {
      research: fundsResearch,
      governance: fundsGovernance,
      execution: fundsExecution,
      workspace: fundsWorkspace,
    },
    teams: {
      workspace: teamsWorkspace,
      research: teamsResearch,
      provenance: teamsProvenance,
      reports: teamsReports,
    },
    independents: {
      noDevops: independentsNoDevops,
      optimization: independentsOptimization,
      live: independentsLive,
    },
  },
} as const;
