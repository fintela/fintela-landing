import { Section } from '../primitives/Section';
import { FintelligentCapabilityExplorer } from './FintelligentCapabilityExplorer';

/**
 * Band 4. The full capability explorer — the "Agentic AI" pitch that used to
 * head this band now lives in AlgoAgentBuilder's hero, alongside the laptop
 * mockup.
 */
export const FintelligentSection = () => {
  return (
    <Section id="fintelligent" size="lg" sx={{ pt: { xs: 0, md: 0 } }}>
      <FintelligentCapabilityExplorer />
    </Section>
  );
};
