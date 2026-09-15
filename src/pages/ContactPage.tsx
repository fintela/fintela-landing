import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Email,
  Phone,
  Business,
  Person,
  Send,
  ContactSupport,
  PlayCircleOutline,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { NeuButton } from '../components/primitives/NeuButton';
import { TierBadge } from '../components/primitives/TierBadge';
import { IconWell } from '../components/primitives/IconWell';
import { wellSx } from '../theme/neu';
import { motion, radii, shadows, soft } from '../theme/tokens';
import { ContactApiError, submitContactRequest, type ContactKind } from '../contact/api';

/** Which i18n message a failed submission shows. `error` is the catch-all. */
const failureKey = (err: unknown): string => {
  if (err instanceof ContactApiError) {
    if (err.reason === 'rate_limited') return 'contact.alert.tooMany';
    if (err.reason === 'rejected') return 'contact.alert.rejected';
  }
  return 'contact.alert.error';
};

export const ContactPage = () => {
  const { t, i18n } = useTranslation('pages');
  const [params] = useSearchParams();
  // `?intent=walkthrough` is the institutional CTA: a demo request framed as a
  // walkthrough on the desk's own strategies, and labelled as such in the mail.
  const walkthrough = params.get('intent') === 'walkthrough';
  const [activeSection, setActiveSection] = useState('contact');
  const [requestType, setRequestType] = useState<'support' | 'demo'>('demo');
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: '',
    // The honeypot (see src/contact/api.ts). Rendered off-screen below; a
    // person never sees it, so it stays empty.
    website: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    if (section === 'home') {
      window.location.href = '/';
    }
  };

  const handleRequestTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: 'support' | 'demo' | null
  ) => {
    if (newType !== null) {
      setRequestType(newType);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // The code, never a label: the backend's closed set and the staff console
    // both key on it, and a label would change with the locale.
    const kind: ContactKind = requestType === 'demo' ? (walkthrough ? 'walkthrough' : 'demo') : 'support';

    try {
      await submitContactRequest({
        kind,
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        locale: i18n.resolvedLanguage ?? i18n.language,
        page_url: window.location.href,
        website: formData.website,
      });

      setSubmitted(true);
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        message: '',
        website: '',
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error('contact request failed:', err);
      setError(t(failureKey(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header activeSection={activeSection} onNavigate={scrollToSection} />

      {/* Hero Section */}
      <Section tone="hero" size="sm" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 5, md: 8 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <TierBadge featured={walkthrough}>{walkthrough ? t('contact.intent.walkthrough.chip') : t('contact.hero.chip')}</TierBadge>
        </Box>
        <SectionHeader
          level="h2"
          hero
          title={walkthrough ? t('contact.intent.walkthrough.title') : t('contact.hero.title')}
          description={walkthrough ? t('contact.intent.walkthrough.subtitle') : t('contact.hero.subtitle')}
        />
      </Section>

      {/* Contact Form Section */}
      <Section size="md" maxWidth="md" sx={{ pt: { xs: 2, md: 3 } }}>
        {submitted && (
          <Alert
            severity="success"
            sx={{ mb: 4 }}
            onClose={() => setSubmitted(false)}
          >
            {requestType === 'demo'
              ? t('contact.alert.successDemo')
              : t('contact.alert.successSupport')}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 4 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <NeuPanel sx={{ p: { xs: 3, md: 5 } }}>
          {/* Request Type Toggle */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: soft.text }}>
              {t('contact.toggle.heading')}
            </Typography>
            <ToggleButtonGroup
              value={requestType}
              exclusive
              onChange={handleRequestTypeChange}
              fullWidth
              sx={{
                ...wellSx('md'), borderRadius: `${radii.neuInner}px`, p: 0.5, gap: 0.5,
                '& .MuiToggleButtonGroup-grouped, & .MuiToggleButtonGroup-firstButton, & .MuiToggleButtonGroup-middleButton, & .MuiToggleButtonGroup-lastButton': { border: 0, ml: 0, borderRadius: `${radii.neuWell}px` },
                '& .MuiToggleButton-root': {
                  border: 0, minHeight: 48, textTransform: 'none', fontWeight: 600, color: soft.textSecondary, bgcolor: 'transparent',
                  transition: `box-shadow ${motion.fast}, background-color ${motion.fast}, color ${motion.fast}`,
                  '@media (hover: hover)': { '&:hover': { bgcolor: 'transparent', color: soft.text } },
                  '&.Mui-selected, &.Mui-selected:hover': { bgcolor: soft.surfaceRaised, color: soft.text, boxShadow: shadows.neuRaisedSm },
                  '&:focus-visible, &.Mui-focusVisible': { outline: `2px solid ${soft.accent}`, outlineOffset: 2 },
                  '@media (forced-colors: active)': { border: '2px solid ButtonBorder', '&.Mui-selected': { boxShadow: 'none', border: '3px solid Highlight' } },
                },
              }}
            >
              <ToggleButton value="demo">
                <PlayCircleOutline sx={{ mr: 1 }} />
                {walkthrough ? t('contact.intent.walkthrough.toggle') : t('contact.toggle.demo')}
              </ToggleButton>
              <ToggleButton value="support">
                <ContactSupport sx={{ mr: 1 }} />
                {t('contact.toggle.support')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Name */}
              <TextField
                required
                fullWidth
                label={t('contact.form.name')}
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1 }} />,
                }}
              />

              {/* Company */}
              <TextField
                required
                fullWidth
                label={t('contact.form.company')}
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <Business sx={{ mr: 1 }} />,
                }}
              />

              {/* Email */}
              <TextField
                required
                fullWidth
                type="email"
                label={t('contact.form.email')}
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1 }} />,
                }}
              />

              {/* Phone */}
              <TextField
                required
                fullWidth
                type="tel"
                label={t('contact.form.phone')}
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1 }} />,
                }}
              />

              {/* Message */}
              <TextField
                required
                fullWidth
                multiline
                rows={6}
                label={
                  requestType === 'demo'
                    ? walkthrough
                      ? t('contact.intent.walkthrough.messageLabel')
                      : t('contact.form.messageLabelDemo')
                    : t('contact.form.messageLabelSupport')
                }
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                placeholder={
                  requestType === 'demo'
                    ? walkthrough
                      ? t('contact.intent.walkthrough.messagePlaceholder')
                      : t('contact.form.messagePlaceholderDemo')
                    : t('contact.form.messagePlaceholderSupport')
                }
              />
            </Box>

            {/* The honeypot: off-screen, out of the tab order, ignored by
                assistive tech. Named like something worth filling. */}
            <Box
              aria-hidden
              sx={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}
            >
              <label>
                Website
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.website}
                  onChange={handleInputChange}
                />
              </label>
            </Box>

            {/* Submit Button */}
            <NeuButton
              tone="accent" type="submit" size="lg" fullWidth disabled={isLoading}
              endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Send />}
              sx={{ mt: 4 }}
            >
              {isLoading
                ? t('contact.submit.sending')
                : requestType === 'demo'
                  ? walkthrough
                    ? t('contact.intent.walkthrough.submit')
                    : t('contact.submit.demo')
                  : t('contact.submit.support')}
            </NeuButton>
          </form>
        </NeuPanel>

        {/* Additional Info */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: soft.textSecondary, mb: 2 }}>
            {t('contact.assistance.heading')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconWell size={40} round><Email /></IconWell>
              <Typography sx={{ color: soft.text, fontWeight: 600 }}>
                ivan.buda@fintela.io
              </Typography>
            </Box>
          </Box>
        </Box>
      </Section>

      <Footer />
    </Box>
  );
};
