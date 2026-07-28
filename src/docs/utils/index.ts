export {
  DOCS_BASE,
  docUrl,
  sectionUrl,
  parseDocPath,
  blockAnchorId,
  blockDeepLink,
} from './anchors';

export {
  resolveContextualDocs,
  resolveByComplexity,
  searchDocs,
  suggestNext,
} from './resolver';

export type { ResolvedDocs } from './resolver';
