import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { PlatformStack } from '../platformStack/PlatformStack';
import { srOnly } from '../../theme/neu';

/**
 * The band after the platform tour: the product as three stacked layers —
 * interface, engine, intelligence — and nothing else. The heading is for
 * the document outline and assistive tech only; the object carries the band.
 */
export const PlatformStackSection = () => {
  const { t } = useTranslation('home');
  return (
    <Section id="stack" size="sm">
      <Typography component="h2" sx={srOnly}>
        {t('stack.title')}
      </Typography>
      <PlatformStack />
    </Section>
  );
};
