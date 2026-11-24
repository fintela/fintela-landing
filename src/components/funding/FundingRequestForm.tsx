import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Alert, Box, CircularProgress, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useTranslation } from 'react-i18next';
import { NeuPanel } from '../primitives/NeuPanel';
import { NeuButton } from '../primitives/NeuButton';
import { contactFailureKey, submitContactRequest } from '../../contact/api';
import { track } from '../../lib/track';

const EMPTY = { name: '', email: '', company: '', strategy: '', message: '', website: '' };

/**
 * The funding request, sent through the contact endpoint.
 *
 * STOPGAP until the backend accepts a `funding` kind (the closed set is a CHECK
 * on `contact_requests.kind` in the app repo): the request goes out as
 * `walkthrough`, and two things tell it apart in the queue: the message opens
 * with `[Funding request]`, and `page_url` is this page. The backend requires a
 * company; an independent creator leaves it blank and it is sent as
 * "Independent".
 */
export const FundingRequestForm = () => {
  const { t, i18n } = useTranslation('pages');
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    const strategy = form.strategy.trim();
    try {
      await submitContactRequest({
        kind: 'walkthrough',
        name: form.name,
        company: form.company.trim() || 'Independent',
        email: form.email,
        message: `[Funding request]\nStrategy: ${strategy || '-'}\n\n${form.message}`,
        locale: i18n.resolvedLanguage ?? i18n.language,
        page_url: window.location.href,
        website: form.website,
      });
      track('funding_request_submit');
      setSent(true);
      setForm(EMPTY);
    } catch (err) {
      console.error('funding request failed:', err);
      setError(t(contactFailureKey(err)));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Alert severity="success" role="status">
        {t('getFunding.request.success')}
      </Alert>
    );
  }

  return (
    <NeuPanel sx={{ p: { xs: 3, md: 5 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <form onSubmit={onSubmit}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <TextField required fullWidth label={t('getFunding.request.form.name')} name="name" autoComplete="name" value={form.name} onChange={onChange} />
          <TextField required fullWidth type="email" label={t('getFunding.request.form.email')} name="email" autoComplete="email" value={form.email} onChange={onChange} />
          <TextField fullWidth label={t('getFunding.request.form.company')} name="company" autoComplete="organization" value={form.company} onChange={onChange} />
          <TextField fullWidth label={t('getFunding.request.form.strategy')} name="strategy" value={form.strategy} onChange={onChange} />
          <TextField
            required
            fullWidth
            multiline
            rows={5}
            label={t('getFunding.request.form.message')}
            placeholder={t('getFunding.request.form.messagePlaceholder')}
            name="message"
            value={form.message}
            onChange={onChange}
            sx={{ gridColumn: { md: 'span 2' } }}
          />
        </Box>

        {/* The honeypot (see src/contact/api.ts): off-screen, out of the tab order. */}
        <Box aria-hidden sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}>
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={onChange} />
          </label>
        </Box>

        <NeuButton
          tone="accent"
          type="submit"
          size="lg"
          fullWidth
          disabled={sending}
          endIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          sx={{ mt: 4 }}
        >
          {sending ? t('getFunding.request.form.sending') : t('getFunding.request.form.submit')}
        </NeuButton>
      </form>
    </NeuPanel>
  );
};
