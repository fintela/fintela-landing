import { Fragment } from 'react';
import { Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NeuPanel } from '../primitives/NeuPanel';
import { Groove } from '../primitives/Groove';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { motion, radii, shadows, soft } from '../../theme/tokens';

export interface FAQItem {
  key: string;
  q: string;
  a: string;
}

/**
 * The accordion panel: pressed summary when a row is open, grooves between
 * rows. Shared by the home FAQ band and the solution pages, which pass their
 * own ordered items.
 */
export const FAQList = ({ items }: { items: FAQItem[] }) => (
  <NeuPanel sx={{ p: { xs: 1.5, md: 2 } }}>
      {items.map((item, idx) => (
        <Fragment key={item.key}>
          {idx > 0 && <Groove sx={{ mx: { xs: 1.5, md: 2 } }} />}
          <AnimateOnScroll delay={(idx % 4) * 40}>
            <Accordion
              disableGutters
              elevation={0}
              sx={{
                bgcolor: 'transparent',
                boxShadow: 'none',
                borderRadius: 0,
                '&::before': { display: 'none' },
                '&:first-of-type, &:last-of-type': { borderRadius: 0 },
                '&.Mui-expanded': { margin: 0 },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: { xs: 1.5, md: 2 },
                  py: 0.5,
                  minHeight: 56,
                  borderRadius: `${radii.neuInner}px`,
                  color: soft.text,
                  transition: `box-shadow ${motion.fast}, background-color ${motion.fast}, color ${motion.fast}`,
                  '& .MuiAccordionSummary-content': { my: 1.25 },
                  '@media (hover: hover)': { '&:hover': { color: soft.accent } },
                  '&.Mui-expanded': {
                    minHeight: 56,
                    bgcolor: soft.groundSunken,
                    boxShadow: shadows.neuInsetSm,
                    color: soft.accent,
                  },
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    color: soft.textSecondary,
                    '&.Mui-expanded': { color: soft.accent },
                  },
                  '&.Mui-focusVisible': {
                    bgcolor: 'transparent',
                    outline: `2px solid ${soft.accent}`,
                    outlineOffset: -2,
                  },
                  '@media (forced-colors: active)': {
                    '&.Mui-expanded': { boxShadow: 'none', border: '2px solid Highlight' },
                    '&.Mui-focusVisible': { outline: '3px solid Highlight', outlineOffset: -3 },
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.98rem', md: '1.08rem' },
                    color: 'inherit',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 1.5, md: 2 }, pt: 1.5, pb: 2.5 }}>
                <Typography
                  sx={{
                    color: soft.textSecondary,
                    fontSize: { xs: '0.92rem', md: '0.95rem' },
                    lineHeight: 1.7,
                    maxWidth: 720,
                  }}
                >
                  {item.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </AnimateOnScroll>
        </Fragment>
      ))}
    </NeuPanel>
);
