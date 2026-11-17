import { useTranslation } from 'react-i18next';
import { NeuButton } from './NeuButton';
import type { NeuButtonProps } from './NeuButton';
import { APP_URL, SIGNUP_URL } from '../../theme/neu';
import { track } from '../../lib/track';

/** Where "Book a walkthrough" lands: the contact page opens on the walkthrough form. */
export const WALKTHROUGH_PATH = '/contact';

export interface CtaButtonProps extends Omit<NeuButtonProps, 'tone' | 'to' | 'href' | 'children' | 'onClick'> {
  /** `trial` opens the app's sign-up; `walkthrough` opens the contact page; `login` opens the app. */
  kind: 'trial' | 'walkthrough' | 'login';
  /** Where on the site the button sits (`hero`, `header`, `closing`…), sent with the click event. */
  placement: string;
  /** `primary` is the filled button. Defaults to primary for the trial, secondary for the walkthrough. */
  emphasis?: 'primary' | 'secondary';
}

/**
 * The site's two calls to action, and the only two: "Start free trial" and
 * "Book a walkthrough". One component owns the label, the destination and the
 * click event, so the three cannot drift apart between pages. Pages that sell
 * to desks swap which one is filled through `emphasis`.
 */
export const CtaButton = ({ kind, placement, emphasis, ...rest }: CtaButtonProps) => {
  const { t } = useTranslation('common');
  const trial = kind === 'trial';
  if (kind === 'login') {
    return (
      <NeuButton
        tone={emphasis === 'primary' ? 'accent' : 'raised'}
        href={APP_URL}
        rel="noopener"
        onClick={() => track('cta_login_click', { cta_placement: placement })}
        {...rest}
      >
        {t('cta.login')}
      </NeuButton>
    );
  }
  const tone = (emphasis ?? (trial ? 'primary' : 'secondary')) === 'primary' ? 'accent' : 'raised';
  const onClick = () => track(trial ? 'cta_trial_click' : 'cta_walkthrough_click', { cta_placement: placement });
  return trial ? (
    <NeuButton tone={tone} href={SIGNUP_URL} rel="noopener" onClick={onClick} {...rest}>
      {t('cta.primary')}
    </NeuButton>
  ) : (
    <NeuButton tone={tone} to={WALKTHROUGH_PATH} onClick={onClick} {...rest}>
      {t('cta.secondary')}
    </NeuButton>
  );
};
