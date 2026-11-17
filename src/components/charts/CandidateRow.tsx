import { memo } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fonts, preview } from '../../theme/tokens';
import { groupDigits } from '../../lib/groupDigits';
import { CANDIDATES, TRIALS } from './data';
import type { CandidateKey } from './data';
import { VerdictChip } from './VerdictChip';

const V = 'visuals';

/**
 * One candidate's result, never a bare score: which trial of how many, its
 * in-sample and held-out Sharpe side by side, and the verdict. `deflated`
 * adds the deflated Sharpe; `note` adds what happens next (the robust
 * candidate goes to a person).
 */
export const CandidateRow = memo(({ candidate, deflated = false, note = false, shown = true }: { candidate: CandidateKey; deflated?: boolean; note?: boolean; shown?: boolean }) => {
  const { t, i18n } = useTranslation('home');
  const c = CANDIDATES[candidate];
  const figures: [string, string][] = [
    [t(`${V}.inSample`), c.inSample],
    [t(`${V}.heldOut`), c.heldOut],
    ...(deflated ? ([[t(`${V}.deflated`), c.deflated]] as [string, string][]) : []),
  ];
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 1.5,
        rowGap: 0.75,
        py: 1,
        borderTop: `1px solid ${preview.line}`,
        transition: 'opacity 0.3s ease',
        opacity: shown ? 1 : 0,
      }}
    >
      <VerdictChip tone={c.verdict === 'wellTrained' ? 'good' : 'bad'}>{t(`${V}.verdicts.${c.verdict}`)}</VerdictChip>
      <Box component="span" sx={{ fontFamily: fonts.mono, fontSize: '0.72rem', color: preview.textMuted, whiteSpace: 'nowrap' }}>
        {t(`${V}.trialOf`, { n: c.trial, total: groupDigits(TRIALS, i18n.language) })}
      </Box>
      <Box component="dl" sx={{ m: 0, ml: { sm: 'auto' }, display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.25, fontSize: '0.75rem' }}>
        {figures.map(([label, value]) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, whiteSpace: 'nowrap' }}>
            <Box component="dt" sx={{ color: preview.textMuted }}>
              {label}
            </Box>
            <Box component="dd" sx={{ m: 0, fontFamily: fonts.mono, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </Box>
          </Box>
        ))}
      </Box>
      {note && (
        <Box component="span" sx={{ flexBasis: '100%', fontSize: '0.75rem', color: preview.good }}>
          {t(`${V}.review`)}
        </Box>
      )}
    </Box>
  );
});
CandidateRow.displayName = 'CandidateRow';
