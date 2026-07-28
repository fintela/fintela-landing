import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
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
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';

// EmailJS configuration - Replace these with your actual IDs from emailjs.com
const EMAILJS_SERVICE_ID = 'fintela-website-support'; // e.g., 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'template-fintela-support'; // e.g., 'template_xyz789'
const EMAILJS_PUBLIC_KEY = 'x8GjweL1wBoybCOtc'; // e.g., 'abc123xyz'

export const ContactPage = () => {
  const { t } = useTranslation('pages');
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
      request_type: requestType === 'demo' ? 'Demo Request' : 'Support Request',
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header activeSection={activeSection} onNavigate={scrollToSection} />

      {/* Hero Section */}
      <Box
        sx={{
          pt: 12,
          pb: 8,
          background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.05) 0%, rgba(240, 147, 251, 0.05) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Chip
              label={t('contact.hero.chip')}
              sx={{
                mb: 3,
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                color: 'text.primary',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
              }}
            >
              {t('contact.hero.title')}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                maxWidth: 700,
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              {t('contact.hero.subtitle')}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Contact Form Section */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="md">
          {submitted && (
            <Alert
              severity="success"
              sx={{ mb: 4, borderRadius: 2 }}
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
              sx={{ mb: 4, borderRadius: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Card
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              border: '2px solid rgba(102, 126, 234, 0.1)',
              borderRadius: 3,
            }}
          >
            {/* Request Type Toggle */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                {t('contact.toggle.heading')}
              </Typography>
              <ToggleButtonGroup
                value={requestType}
                exclusive
                onChange={handleRequestTypeChange}
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    py: 2,
                    border: '2px solid rgba(102, 126, 234, 0.1)',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="demo">
                  <PlayCircleOutline sx={{ mr: 1 }} />
                  {t('contact.toggle.demo')}
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
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
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
                    startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />,
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
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
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
                    startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
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
                      ? t('contact.form.messageLabelDemo')
                      : t('contact.form.messageLabelSupport')
                  }
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                  placeholder={
                    requestType === 'demo'
                      ? t('contact.form.messagePlaceholderDemo')
                      : t('contact.form.messagePlaceholderSupport')
                  }
                />
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading}
                sx={{
                  mt: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%)',
                  },
                }}
                endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Send />}
              >
                {isLoading
                  ? t('contact.submit.sending')
                  : requestType === 'demo'
                    ? t('contact.submit.demo')
                    : t('contact.submit.support')}
              </Button>
            </form>
          </Card>

          {/* Additional Info */}
          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
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
                <Email sx={{ color: 'primary.main' }} />
                <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>
                  ivan.buda@fintela.io
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};
