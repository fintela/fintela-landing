import { Box, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import CodeIcon from '@mui/icons-material/Code';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { Section } from '../primitives/Section';
import { BandHeader } from '../primitives/BandHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { NeuButton } from '../primitives/NeuButton';
import { IconWell } from '../primitives/IconWell';
import { Groove } from '../primitives/Groove';
import { AgentCoin } from '../primitives/AgentCoin';
import { VideoPlate } from '../primitives/VideoPlate';
import { TranscriptRail } from '../primitives/TranscriptRail';
import type { TranscriptSpeaker } from '../primitives/TranscriptRail';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { quietLinkSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import { useVideoChapters } from '../../media/chapters';
import { VIDEOS, captionTracks } from '../../media/registry';

/**
 * The turns of the agent-to-agent demo. Text lives in i18n under
 * `fintelligent.cues.<key>`; timings are the video's and the same in every
 * locale. A `tool` is the call the turn made, shown in the mono pill.
 */
const CUES = [
  { key: 'brief', start: 4, speaker: 'orchestrator' },
  { key: 'draft', start: 31, speaker: 'strategist', tool: 'create_strategy' },
  { key: 'guard', start: 58, speaker: 'risk', tool: 'attach_risk_manager' },
  { key: 'stage', start: 84, speaker: 'strategist', tool: 'create_study' },
  { key: 'confirm', start: 108, speaker: 'orchestrator' },
  { key: 'launch', start: 131, speaker: 'strategist', tool: 'study.status' },
  { key: 'review', start: 176, speaker: 'risk' },
  { key: 'report', start: 214, speaker: 'orchestrator', tool: 'build_report' },
] as const;

const SPEAKER_TONE: Record<string, number> = { orchestrator: 0, strategist: 1, risk: 2 };

const CAPABILITIES = [
  { key: 'readsData', icon: <QueryStatsIcon />, docs: '/docs/fintelligent-capabilities' },
  { key: 'generatesStrategies', icon: <CodeIcon />, docs: '/docs/fintelligent-capabilities' },
  { key: 'operatesUi', icon: <ExploreOutlinedIcon />, docs: '/docs/fintelligent' },
  { key: 'transparent', icon: <VerifiedUserOutlinedIcon />, docs: '/docs/fintelligent-drafts-and-runs' },
] as const;

/**
 * Band 4. A conversation gets a transcript for a player: the video on the
 * left plate, the turns in a sunken rail on the right with the current one
 * raised. The four capability tiles below run on a diagonal.
 */
export const FintelligentSection = () => {
  const { t } = useTranslation('home');
  const cues = CUES.map((c) => ({
    id: c.key,
    label: t(`fintelligent.cues.${c.key}`),
    start: c.start,
    speaker: c.speaker,
    text: t(`fintelligent.cues.${c.key}`),
    tool: 'tool' in c ? c.tool : undefined,
  }));
  const speakers: Record<string, TranscriptSpeaker> = Object.fromEntries(
    Object.entries(SPEAKER_TONE).map(([key, tone]) => [
      key,
      {
        name: t(`fintelligent.agents.${key}.name`),
        role: t(`fintelligent.agents.${key}.role`),
        tone,
        initial: t(`fintelligent.agents.${key}.name`).charAt(0),
      },
    ]),
  );

  const { activeId, setActiveId, playerRef } = useVideoChapters(cues);
  const [started, setStarted] = useState(false);
  const activeIndex = started ? Math.max(0, cues.findIndex((c) => c.id === activeId)) : 0;
  const onSeek = useCallback(
    (index: number) => {
      setStarted(true);
      setActiveId(cues[index].id);
      playerRef.current?.seekTo(cues[index].id);
    },
    [cues, playerRef, setActiveId],
  );

  return (
    <Section id="fintelligent" size="lg">
      <BandHeader
        eyebrow={t('fintelAgent.eyebrow')}
        title={t('fintelAgent.title')}
        titleAccent={t('fintelAgent.titleAccent')}
        description={t('fintelAgent.description')}
        exit={
          <NeuButton tone="raised" to="/docs/fintelligent" endIcon={<ArrowForwardIcon />}>
            {t('fintelligent.exit')}
          </NeuButton>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 5fr)' },
          gap: { xs: 3, md: 4 },
          alignItems: 'stretch',
        }}
      >
        <AnimateOnScroll direction="left" stretch>
          <NeuPanel sx={{ p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column' }}>
            <VideoPlate
              ref={playerRef}
              mode="player"
              src={VIDEOS.agents.src}
              poster={VIDEOS.agents.poster}
              posterAlt={t('fintelligent.posterAlt')}
              captions={captionTracks(VIDEOS.agents)}
              silent={VIDEOS.agents.silent}
              chapters={cues}
              ratio="16/9"
              label={t('fintelligent.playerLabel')}
              onChapterChange={(id) => {
                setStarted(true);
                setActiveId(id);
              }}
              flush
            />
          </NeuPanel>
        </AnimateOnScroll>

        {/* Absolute from md so the transcript takes the video plate's height and
            scrolls inside it instead of stretching the row to fit every turn. */}
        <Box sx={{ position: 'relative', minHeight: { xs: 'auto', md: 0 } }}>
        <AnimateOnScroll delay={120} direction="right" stretch>
          <NeuPanel
            sx={{
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              position: { xs: 'static', md: 'absolute' },
              inset: { md: 0 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.75, pb: 1.25 }}>
              {Object.entries(SPEAKER_TONE).map(([key, tone]) => (
                <AgentCoin key={key} tone={tone}>
                  {speakers[key].initial}
                </AgentCoin>
              ))}
              <Typography sx={{ ml: 0.5, fontSize: '0.8rem', fontWeight: 600, color: soft.text }}>
                {t('fintelligent.agentsCount', { count: Object.keys(SPEAKER_TONE).length })}
              </Typography>
              <Typography
                sx={{ ml: 'auto', fontSize: '0.72rem', color: soft.textSecondary, fontFamily: '"JetBrains Mono", monospace', fontVariantNumeric: 'tabular-nums' }}
              >
                {t('fintelligent.turns', { current: activeIndex + 1, total: cues.length })}
              </Typography>
            </Box>
            <Groove sx={{ mb: 1.5 }} />
            <TranscriptRail
              cues={cues}
              speakers={speakers}
              activeIndex={activeIndex}
              onSeek={onSeek}
              label={t('fintelligent.transcriptLabel')}
              maxHeight={{ xs: 360, md: 'none' }}
              sx={{ flex: 1, minHeight: 0 }}
            />
          </NeuPanel>
        </AnimateOnScroll>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: { xs: 3, md: 4 },
          mt: { xs: 4, md: 5 },
        }}
      >
        {CAPABILITIES.map((c, idx) => (
          <AnimateOnScroll key={c.key} delay={idx * 70} stretch>
            <NeuPanel
              variant="tile"
              sx={{
                p: { xs: 2.5, md: 2.75 },
                display: 'flex',
                flexDirection: 'column',
                // The diagonal: tiles 2 and 4 drop by one gap unit from lg.
                mt: { lg: idx % 2 === 1 ? 4 : 0 },
              }}
            >
              <IconWell size={40}>{c.icon}</IconWell>
              <Typography sx={{ fontWeight: 700, color: soft.text, mt: 1.75, mb: 0.5, fontSize: '0.98rem' }}>
                {t(`fintelAgent.capabilities.${c.key}.title`)}
              </Typography>
              <Typography sx={{ color: soft.textSecondary, fontSize: '0.86rem', lineHeight: 1.6, mb: 2 }}>
                {t(`fintelAgent.capabilities.${c.key}.desc`)}
              </Typography>
              <Box
                component={RouterLink}
                to={c.docs}
                sx={[quietLinkSx, { mt: 'auto', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start' }]}
              >
                {t('capabilities.docs')}
                <ArrowForwardIcon sx={{ fontSize: 14 }} />
              </Box>
            </NeuPanel>
          </AnimateOnScroll>
        ))}
      </Box>
    </Section>
  );
};
