import { TrustPage } from '../components/sections/TrustPage';
import type { TrustSection } from '../components/sections/TrustPage';

/**
 * Each section states what the documentation states and links to it. The ids
 * are public anchors: the home page's trust anchors link to `#recorded` and
 * `#isolation`, so they stay as they are.
 */
const SECTIONS: readonly TrustSection[] = [
  { id: 'recorded', key: 'recorded', links: { architecture: '/docs/architecture', promoted: '/docs/promoted-portfolios' } },
  { id: 'isolation', key: 'isolation', links: { studies: '/docs/studies' } },
  { id: 'verdict', key: 'verdict', links: { results: '/docs/analyzing-results', research: '/blog/deflated-sharpe' } },
  { id: 'costs', key: 'costs', links: { engine: '/product/fintela-api', baskets: '/docs/api-baskets' } },
  { id: 'limits', key: 'limits', links: { samplers: '/docs/sampler-selection', assetGroups: '/docs/asset-groups' } },
];

/**
 * How a result is recorded, held out and judged — and what the platform does
 * not do (no seed, no walk-forward). The page the home page's "every trial on
 * record" and "out-of-sample isolation" anchors lead to.
 */
export const MethodologyPage = () => <TrustPage base="methodology" path="/methodology" sections={SECTIONS} />;
