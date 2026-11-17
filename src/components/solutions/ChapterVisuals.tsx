import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { ConfirmCard } from '../fintelligentDemo/agenticParts';
import { APP } from '../fintelligentDemo/appTheme';
import { ValidationCompare } from '../charts/ValidationCompare';
import { fonts, soft } from '../../theme/tokens';
import type { ChapterComponentId } from '../../solutions/registry';

/**
 * The coded pieces a solution chapter can show in place of a capture. Each is
 * either app-faithful (the Confirm card, drawn with the app's own palette and
 * strings) or a schematic in the app's vocabulary; the chapter's MediaPlate
 * badges which one it is. None of them shows a number the app did not
 * produce, a broker, or a box the app does not have (no client, no mandate).
 */

const LINE = 'rgba(18, 20, 26, 0.28)';

/** A light well the schematics sit in, so they read as one object inside the plate. */
const Well = ({ children, label }: { children: ReactNode; label: string }) => (
  <Box
    role="img"
    aria-label={label}
    sx={{
      bgcolor: soft.groundSunken,
      borderRadius: '12px',
      px: { xs: 1.5, sm: 3 },
      py: { xs: 2.5, sm: 3.5 },
      minWidth: 0,
    }}
  >
    {/* The text inside is for sighted readers; the well's label is what a screen reader hears. */}
    <Box aria-hidden>{children}</Box>
  </Box>
);

const Node = ({ children, strong = false, sx }: { children: ReactNode; strong?: boolean; sx?: object }) => (
  <Box
    sx={{
      bgcolor: soft.surfaceRaised,
      border: `1px solid ${strong ? soft.text : 'rgba(18, 20, 26, 0.14)'}`,
      borderRadius: '10px',
      px: { xs: 1.25, sm: 1.75 },
      py: { xs: 1, sm: 1.25 },
      textAlign: 'center',
      minWidth: 0,
      ...sx,
    }}
  >
    {children}
  </Box>
);

const Mono = ({ children, muted = false }: { children: ReactNode; muted?: boolean }) => (
  <Typography
    component="span"
    sx={{
      display: 'block',
      fontFamily: fonts.mono,
      fontSize: { xs: '0.7rem', sm: '0.76rem' },
      lineHeight: 1.45,
      color: muted ? soft.textSecondary : soft.text,
      overflowWrap: 'anywhere',
    }}
  >
    {children}
  </Typography>
);

const Label = ({ children }: { children: ReactNode }) => (
  <Typography component="span" sx={{ display: 'block', fontSize: { xs: '0.8rem', sm: '0.88rem' }, fontWeight: 600, lineHeight: 1.35, color: soft.text }}>
    {children}
  </Typography>
);

/** A vertical rule, centred in its cell. */
const Stem = ({ h = 22 }: { h?: number }) => <Box sx={{ width: '2px', height: h, bgcolor: LINE, mx: 'auto' }} />;

/**
 * Teams, "Versions kept, results locked": a strategy's versions on a line,
 * v4 being edited, and a study tied to v3 whose results do not move. The
 * pin has no single screen in the app yet (SOLUTIONS-PLAN app item A7), so it
 * is a diagram until it does.
 */
export const VersionsDiagram = ({ label }: { label: string }) => {
  const { t } = useTranslation('solutions');
  const d = (k: string) => t(`common.diagrams.versions.${k}`);
  const versions = ['v1', 'v2', 'v3', 'v4'];
  return (
    <Well label={label}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Mono>{d('strategy')}</Mono>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', rowGap: 0 }}>
        {/* The version line, behind the four dots. */}
        <Box sx={{ gridColumn: '1 / -1', gridRow: 1, alignSelf: 'center', height: '2px', bgcolor: LINE, mx: '12.5%' }} />
        {versions.map((v, i) => {
          const pinned = i === 2;
          const editing = i === 3;
          return (
            <Box key={v} sx={{ gridColumn: i + 1, gridRow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 28 }}>
              <Box
                sx={{
                  width: pinned ? 18 : 14,
                  height: pinned ? 18 : 14,
                  borderRadius: '50%',
                  bgcolor: pinned ? soft.text : editing ? soft.groundSunken : soft.surfaceRaised,
                  border: `2px ${editing ? 'dashed' : 'solid'} ${pinned ? soft.text : soft.textSecondary}`,
                  position: 'relative',
                  zIndex: 1,
                }}
              />
            </Box>
          );
        })}
        {versions.map((v, i) => (
          <Box key={`${v}-label`} sx={{ gridColumn: i + 1, gridRow: 2, textAlign: 'center', pt: 0.75 }}>
            <Mono muted={i !== 2}>{v}</Mono>
            {i === 3 && (
              <Mono muted>
                {d('current')} · {d('editing')}
              </Mono>
            )}
          </Box>
        ))}
        <Box sx={{ gridColumn: 3, gridRow: 3, pt: 1 }}>
          <Stem />
        </Box>
        {/* Centred under v3, wider than its column: the stem lands in its middle. */}
        <Box sx={{ gridColumn: 3, gridRow: 4, justifySelf: 'center', width: { xs: '240%', sm: '200%' }, maxWidth: 260 }}>
          <Node strong>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, justifyContent: 'center' }}>
              <LockOutlinedIcon sx={{ fontSize: 16, color: soft.text }} />
              <Label>{d('study')}</Label>
            </Box>
            <Mono>{d('launchedOn')}</Mono>
            <Mono muted>{d('unchanged')}</Mono>
          </Node>
        </Box>
      </Box>
    </Well>
  );
};

/**
 * Advisors, "One strategy, different risk profiles": the same strategy run
 * as two studies, each under its own risk policy (a study's portfolio-wide
 * limits, chosen per study in the app), each leading to its own portfolio
 * group. There is no client or mandate object in the app, so none is drawn.
 */
export const RiskProfilesDiagram = ({ label }: { label: string }) => {
  const { t } = useTranslation('solutions');
  const d = (k: string) => t(`common.diagrams.riskProfiles.${k}`);
  const branches = [d('conservative'), d('growth')];
  return (
    <Well label={label}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Node strong sx={{ width: { xs: '62%', sm: '46%' } }}>
          <Label>{d('strategy')}</Label>
        </Node>
      </Box>
      {/* The fork: a stem down from the strategy, a bar across, two stems down. */}
      <Box sx={{ position: 'relative', height: 30 }}>
        <Box sx={{ position: 'absolute', left: 'calc(50% - 1px)', top: 0, width: '2px', height: 15, bgcolor: LINE }} />
        <Box sx={{ position: 'absolute', left: '25%', right: '25%', top: 14, height: '2px', bgcolor: LINE }} />
        <Box sx={{ position: 'absolute', left: 'calc(25% - 1px)', top: 14, width: '2px', height: 16, bgcolor: LINE }} />
        <Box sx={{ position: 'absolute', left: 'calc(75% - 1px)', top: 14, width: '2px', height: 16, bgcolor: LINE }} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: { xs: 1.5, sm: 3 } }}>
        {branches.map((name) => (
          <Box key={name} sx={{ minWidth: 0 }}>
            <Node>
              <Label>{d('study')}</Label>
              <Box
                sx={{
                  mt: 0.75,
                  display: 'inline-block',
                  px: 1,
                  py: 0.25,
                  borderRadius: '6px',
                  bgcolor: soft.groundSunken,
                }}
              >
                <Mono>
                  {name} {d('policy')}
                </Mono>
              </Box>
            </Node>
            <Stem />
            <Node>
              <Label>{d('group')}</Label>
              <Mono muted>{name}</Mono>
            </Node>
          </Box>
        ))}
      </Box>
    </Well>
  );
};

/**
 * Advisors, "Describe it. Review it. Confirm it.": the app's Confirm card,
 * holding one proposed strategy, still. Fintelligent prepares it; nothing is
 * saved until the user clicks the button. Strings are the app's own
 * (`home:fintelligentDemo.app.confirm.*`); the strategy is fictional.
 */
export const ConfirmVignette = ({ label }: { label: string }) => {
  const { t } = useTranslation(['home', 'solutions']);
  const c = 'home:fintelligentDemo.app.confirm';
  const name = t('solutions:common.vignettes.confirmName');
  const title = t(`${c}.row`, { verb: t(`${c}.verb.create`), entity: t(`${c}.entity.strategy`), name });
  return (
    <Box
      role="img"
      aria-label={label}
      sx={{ bgcolor: APP.ground, borderRadius: '12px', px: { xs: 0.5, sm: 2 }, py: { xs: 1.5, sm: 2.5 }, minWidth: 0 }}
    >
      <Box aria-hidden sx={{ maxWidth: 460, mx: 'auto' }}>
        <ConfirmCard
          proposals={[{ entity: 'strategy', title, description: t('solutions:common.vignettes.confirmDescription') }]}
          confirmLabel={t(`${c}.button.create`)}
          busy={false}
          target="solution-confirm"
        />
      </Box>
    </Box>
  );
};

/** The piece a chapter's `{ kind: 'component', id }` names. */
export const ChapterVisual = ({ id, label }: { id: ChapterComponentId; label: string }) => {
  switch (id) {
    case 'confirmCard':
      return <ConfirmVignette label={label} />;
    case 'validationCompare':
      // Deflated Sharpe is hidden in the app (featureFlags sharpeProbabilityMetrics,
      // 2026-10-10), so the comparison leaves it out; the plate's badge carries
      // the "illustrative" note.
      return <ValidationCompare deflated={false} illustrativeNote={false} />;
    case 'riskProfilesDiagram':
      return <RiskProfilesDiagram label={label} />;
    case 'versionsDiagram':
      return <VersionsDiagram label={label} />;
  }
};
