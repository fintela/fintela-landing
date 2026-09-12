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
import emailjs from '@emailjs/browser';
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

// EmailJS configuration - Replace these with your actual IDs from emailjs.com
const EMAILJS_SERVICE_ID = 'fintela-website-support'; // e.g., 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'template-fintela-support'; // e.g., 'template_xyz789'
const EMAILJS_PUBLIC_KEY = 'x8GjweL1wBoybCOtc'; // e.g., 'abc123xyz'

export const ContactPage = () => {
  const { t } = useTranslation('pages');
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

    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      company: formData.company,
      phone: formData.phone,
      request_type:
        requestType === 'demo' ? (walkthrough ? 'Walkthrough Request' : 'Demo Request') : 'Support Request',
      message: formData.message,
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      setSubmitted(true);
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        message: '',
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error('EmailJS error:', err);
      setError(t('contact.alert.error'));
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
