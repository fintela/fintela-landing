import { TrustPage } from '../components/sections/TrustPage';
import type { TrustSection } from '../components/sections/TrustPage';

/**
 * Only what the product documentation states, section by section, each with
 * the page that states it. `#your-code` is a public anchor: the home page's
 * "keep your code on your servers" anchor links to it.
 *
 * Nothing here about hosting region, encryption at rest or certifications:
 * the documentation says nothing about them, so neither does this page. Add
 * a section only with a source to link.
 */
const SECTIONS: readonly TrustSection[] = [
  { id: 'your-code', key: 'yourCode', links: { architecture: '/docs/architecture', external: '/docs/external-strategies' } },
  { id: 'organization', key: 'organization', links: { architecture: '/docs/architecture', api: '/docs/api-authentication' } },
  { id: 'credentials', key: 'credentials', links: { live: '/docs/live-trading', agent: '/docs/connect-your-agent' } },
  { id: 'ai', key: 'ai', links: { fintelligent: '/docs/fintelligent', agent: '/docs/connect-your-agent', privacy: '/privacy' } },
  { id: 'more', key: 'more', links: { contact: '/contact' } },
];

/** Where code and data live, who can see them, and what the AI may do. Desks read this one, so the walkthrough leads. */
export const SecurityPage = () => <TrustPage base="security" path="/security" sections={SECTIONS} lead="walkthrough" />;
