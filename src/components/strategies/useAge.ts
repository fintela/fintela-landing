import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { splitAge } from '../../strategies/format';

/** Days published in words: `21d`, `7m`, `1y 4m`. */
export const useAge = () => {
  const { t } = useTranslation('pages');
  return useCallback(
    (days: number): string => {
      const age = splitAge(days);
      if (age.years && age.months) return t('strategies.age.yearsMonths', age);
      if (age.years) return t('strategies.age.years', age);
      if (age.months) return t('strategies.age.months', age);
      return t('strategies.age.days', age);
    },
    [t],
  );
};
