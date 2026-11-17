import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CodeIcon from '@mui/icons-material/Code';
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import { CapabilityExplorer } from '../primitives/CapabilityExplorer';
import { BlockHeading } from '../primitives/BlockHeading';

/**
 * The ten things Fintelligent does, from `fintelAgent.fullCapabilities.items.*`
 * in i18n. Order matches the source doc: build → think → analyze → research →
 * report → operate → teach → persist → guard → suggest.
 */
const ITEMS = [
  { key: 'strategyBuilder', icon: <CodeIcon /> },
  { key: 'researchMindset', icon: <PsychologyAltOutlinedIcon /> },
  { key: 'evidenceAnalysis', icon: <QueryStatsIcon /> },
  { key: 'marketResearch', icon: <PublicOutlinedIcon /> },
  { key: 'pdfReports', icon: <DescriptionOutlinedIcon /> },
  { key: 'platformOperator', icon: <TouchAppOutlinedIcon /> },
  { key: 'teaches', icon: <SchoolOutlinedIcon /> },
  { key: 'backgroundWork', icon: <CloudSyncOutlinedIcon /> },
  { key: 'safety', icon: <VerifiedUserOutlinedIcon /> },
  { key: 'oneClickIdeas', icon: <TipsAndUpdatesOutlinedIcon /> },
] as const;

/**
 * The full capability surface for the Agentic AI page, in the same shape as
 * the Samplers page: a heading, then a numbered index of the ten capabilities
 * on the left and the picked one explained in a panel on the right.
 */
export const FintelligentCapabilityExplorer = () => {
  const { t } = useTranslation('home');
  return (
    <Box>
      <BlockHeading
        eyebrow={t('fintelAgent.fullCapabilities.eyebrow', { defaultValue: t('fintelAgent.eyebrow') })}
        title={t('fintelAgent.fullCapabilities.heading')}
        description={t('fintelAgent.fullCapabilities.subheading')}
      />
      <CapabilityExplorer ns="home" baseKey="fintelAgent.fullCapabilities.items" items={ITEMS} />
    </Box>
  );
};
