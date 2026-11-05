import { Box } from '@mui/material';
import { lazy, Suspense } from 'react';

/**
 * The demo is all client-side motion, so it is its own chunk, fetched after
 * hydration rather than riding in the entry; the server renders the
 * placeholder, which holds the demo's size.
 */
const AgenticDemo = lazy(() => import('./AgenticDemo').then((m) => ({ default: m.AgenticDemo })));

/** The demo's footprint (its stage ratio per layout, plus the player bar) while the chunk loads. */
const DemoPlaceholder = () => (
  <Box aria-hidden sx={{ aspectRatio: { xs: '1 / 1.98', md: '1 / 0.69' }, mb: '52px' }} />
);

/**
 * The agentic demo (Fintelligent builds an asset group, a strategy and a study
 * from one message and streams the run) behind its lazy boundary. Shared by
 * the Agentic AI page's hero and the home page's pipeline band, so both load
 * the same chunk and reserve the same box.
 */
export const AgenticDemoLazy = () => (
  <Suspense fallback={<DemoPlaceholder />}>
    <AgenticDemo />
  </Suspense>
);
