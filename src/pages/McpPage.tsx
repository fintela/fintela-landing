import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { NeuButton } from '../components/primitives/NeuButton';
import { IconWell } from '../components/primitives/IconWell';
import { CapabilityExplorer } from '../components/primitives/CapabilityExplorer';
import { BlockHeading } from '../components/primitives/BlockHeading';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { quietLinkSx } from '../theme/neu';
import { soft } from '../theme/tokens';
import { Seo } from '../seo/Seo';

/** The setup guide under /docs (content/docs/ai/connect-your-agent.md). */
const SETUP_GUIDE = '/docs/connect-your-agent';

/** "Cómo funciona": the three steps, the last one always a person's. */
const STEP_ITEMS = [
  { key: 'propose', icon: <SmartToyOutlinedIcon /> },
  { key: 'validate', icon: <FactCheckOutlinedIcon /> },
  { key: 'confirm', icon: <TaskAltOutlinedIcon /> },
] as const;

/** "Qué puede hacer tu agente": the tool families, same grouping as the setup guide. */
const CAPABILITY_ITEMS = [
  { key: 'verdicts', icon: <VerifiedOutlinedIcon /> },
  { key: 'explore', icon: <QueryStatsIcon /> },
  { key: 'validate', icon: <FactCheckOutlinedIcon /> },
  { key: 'propose', icon: <SendOutlinedIcon /> },
] as const;

/** "Para qué lo usan los fondos". */
const USE_CASE_ITEMS = [
  { key: 'researchLoop', icon: <TerminalOutlinedIcon /> },
  { key: 'overfitGate', icon: <GavelOutlinedIcon /> },
  { key: 'triage', icon: <FilterListOutlinedIcon /> },
  { key: 'debugFree', icon: <BuildOutlinedIcon /> },
  { key: 'humanSpend', icon: <HowToRegOutlinedIcon /> },
  { key: 'committee', icon: <DescriptionOutlinedIcon /> },
] as const;

const SECURITY_FACT_KEYS = ['strategy', 'secret', 'noSpend', 'signIn', 'offDefault'] as const;
const CONNECT_FACT_KEYS = ['claudeCode', 'claudeAi', 'standard', 'more'] as const;

const FactStrip = ({ baseKey, keys }: { baseKey: string; keys: readonly string[] }) => {
  const { t } = useTranslation('pages');
  return (
    <NeuPanel
      variant="tile"
      sx={{
        p: { xs: 2.5, md: 3 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: `repeat(${keys.length}, minmax(0, 1fr))` },
        gap: { xs: 2.5, md: 3 },
      }}
    >
      {keys.map((key) => (
        <Box key={key}>
          <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: soft.text, mb: 0.6 }}>
            {t(`${baseKey}.${key}.label`)}
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.55, color: soft.textSecondary }}>
            {t(`${baseKey}.${key}.value`)}
          </Typography>
        </Box>
      ))}
    </NeuPanel>
  );
};

const StepTile = ({ index, itemKey, icon }: { index: number; itemKey: string; icon: React.ReactNode }) => {
  const { t } = useTranslation('pages');
  return (
    <NeuPanel variant="tile" sx={{ height: '100%', p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconWell size={40}>{icon}</IconWell>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: soft.linkAccent }}>
          {String(index + 1).padStart(2, '0')}
        </Typography>
      </Box>
      <Typography sx={{ fontWeight: 700, color: soft.text, fontSize: '1.05rem' }}>
        {t(`mcp.steps.items.${itemKey}.title`)}
      </Typography>
      <Typography sx={{ color: soft.textSecondary, fontSize: '0.88rem', lineHeight: 1.6 }}>
        {t(`mcp.steps.items.${itemKey}.desc`)}
      </Typography>
    </NeuPanel>
  );
};

const UseCaseTile = ({ itemKey, icon }: { itemKey: string; icon: React.ReactNode }) => {
  const { t } = useTranslation('pages');
  return (
    <NeuPanel variant="tile" sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', p: { xs: 2, md: 2.25 } }}>
      <IconWell size={36}>{icon}</IconWell>
      <Box>
        <Typography sx={{ fontWeight: 700, color: soft.text, mb: 0.4, fontSize: '0.92rem' }}>
          {t(`mcp.useCases.items.${itemKey}.title`)}
        </Typography>
        <Typography sx={{ color: soft.textSecondary, fontSize: '0.84rem', lineHeight: 1.55 }}>
          {t(`mcp.useCases.items.${itemKey}.desc`)}
        </Typography>
      </Box>
    </NeuPanel>
  );
};

/**
 * Product menu's "Connect your agent" item: Fintela MCP. A fund's own AI
 * agent (Claude Code, claude.ai) reads verdicts, validates the fund's
 * strategy server and proposes; a person confirms in the app. The pitch is
 * the split of work — the agent writes, Fintela validates, the fund's own
 * infrastructure executes — and that the fund's edge never leaves it. The
 * hero puts the gold accent on a line of its own, as the home hero does.
 */
export const McpPage = () => {
  const { t } = useTranslation('pages');

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo title={t('mcp.seo.title')} description={t('mcp.seo.description')} />
      <Header />

      <Box component="main" id="content">
        <Section size="lg">
          <SectionHeader
            level="h1"
            eyebrow={t('mcp.eyebrow')}
            title={
              <>
                {t('mcp.title')}
                <br />
              </>
            }
            titleAccent={t('mcp.titleAccent')}
            description={t('mcp.description')}
          />

          <Box sx={{ mt: { xs: 3, md: 4 }, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <NeuButton tone="accent" to="/contact" endIcon={<ArrowForwardIcon />}>
              {t('mcp.ctaPrimary')}
            </NeuButton>
            <NeuButton tone="raised" to={SETUP_GUIDE}>
              {t('mcp.ctaSecondary')}
            </NeuButton>
          </Box>
          <Typography sx={{ mt: 1.5, fontSize: '0.82rem', color: soft.textSecondary, textAlign: 'center' }}>
            {t('mcp.pilotNote')}
          </Typography>

          {/* Cómo funciona */}
          <Box sx={{ mt: { xs: 7, md: 9 } }}>
            <BlockHeading eyebrow={t('mcp.steps.eyebrow')} title={t('mcp.steps.title')} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 2, md: 2.5 } }}>
              {STEP_ITEMS.map((s, idx) => (
                <AnimateOnScroll key={s.key} delay={idx * 80} stretch>
                  <StepTile index={idx} itemKey={s.key} icon={s.icon} />
                </AnimateOnScroll>
              ))}
            </Box>
          </Box>

          {/* Qué puede hacer tu agente */}
          <Box sx={{ mt: { xs: 7, md: 9 } }}>
            <BlockHeading eyebrow={t('mcp.capabilities.eyebrow')} title={t('mcp.capabilities.title')} />
            <CapabilityExplorer ns="pages" baseKey="mcp.capabilities.items" items={CAPABILITY_ITEMS} />
          </Box>

          {/* Para qué lo usan los fondos */}
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <BlockHeading eyebrow={t('mcp.useCases.eyebrow')} title={t('mcp.useCases.title')} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                gap: { xs: 2, md: 2.5 },
              }}
            >
              {USE_CASE_ITEMS.map((c, idx) => (
                <AnimateOnScroll key={c.key} delay={idx * 60} stretch>
                  <UseCaseTile itemKey={c.key} icon={c.icon} />
                </AnimateOnScroll>
              ))}
            </Box>
          </Box>

          {/* Tu ventaja se queda contigo */}
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <BlockHeading eyebrow={t('mcp.security.eyebrow')} title={t('mcp.security.title')} />
            <AnimateOnScroll stretch>
              <FactStrip baseKey="mcp.security.facts" keys={SECURITY_FACT_KEYS} />
            </AnimateOnScroll>
          </Box>

          {/* Funciona con el agente que ya usas */}
          <Box sx={{ mt: { xs: 3, md: 4 } }}>
            <BlockHeading eyebrow={t('mcp.connect.eyebrow')} title={t('mcp.connect.title')} />
            <AnimateOnScroll stretch>
              <FactStrip baseKey="mcp.connect.facts" keys={CONNECT_FACT_KEYS} />
            </AnimateOnScroll>
          </Box>

          <Typography sx={{ mt: { xs: 5, md: 6 }, fontSize: '0.95rem', color: soft.text, fontWeight: 600, fontStyle: 'italic', maxWidth: 760 }}>
            {t('mcp.closingLine')}
          </Typography>

          <Typography sx={{ mt: 2, fontSize: '0.85rem', color: soft.textSecondary, maxWidth: 760 }}>
            {t('mcp.note')}
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Box
              component={RouterLink}
              to={SETUP_GUIDE}
              sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.92rem', fontWeight: 600, color: soft.linkAccent }]}
            >
              {t('mcp.ctaSecondary')}
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Box>
          </Box>
        </Section>
      </Box>

      <Footer />
    </Box>
  );
};
