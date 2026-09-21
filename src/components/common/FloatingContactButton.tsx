import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  ClickAwayListener,
  Grow,
  IconButton,
  Popper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { neuFabSx, quietLinkSx, raisedPanelSx } from '../../theme/neu';
import { radii, shadows, soft } from '../../theme/tokens';
import { contactFailureKey, submitContactRequest } from '../../contact/api';

const emptyForm = {
  name: '',
  company: '',
  email: '',
  phone: '',
  message: '',
  // The honeypot (see src/contact/api.ts): off-screen, never filled by a person.
  website: '',
};

/**
 * A constant, unobtrusive way to reach support from anywhere on the site —
 * bottom-left, so it never competes with `ScrollTop` (bottom-right, and only
 * on the two pages that use it). Hidden on `/contact` itself: a floating
 * trigger to the page you are already reading is not a shortcut.
 *
 * Opens a small panel right above itself with the same support request the
 * full `/contact` page sends, rather than navigating away — a quick "we're
 * here" instead of a page load. The full page stays linked at the bottom for
 * anyone who wants the walkthrough-booking flow instead.
 */
export const FloatingContactButton = () => {
  const { t, i18n } = useTranslation(['common', 'pages']);
  const { pathname } = useLocation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pathname === '/contact') return null;

  const close = () => setOpen(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await submitContactRequest({
        kind: 'support',
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
      setFormData(emptyForm);
      setTimeout(() => {
        setSubmitted(false);
        close();
      }, 3500);
    } catch (err) {
      console.error('contact request failed:', err);
      setError(t(`pages:${contactFailureKey(err)}`));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, md: 24 },
        left: { xs: 16, md: 24 },
        zIndex: 1000,
        '@media print': { display: 'none' },
      }}
    >
      <Tooltip title={t('common:actions.contactUs')} placement="right" disableHoverListener={open}>
        <IconButton
          ref={buttonRef}
          onClick={() => setOpen((v) => !v)}
          aria-label={t('common:actions.contactUs')}
          aria-expanded={open}
          aria-haspopup="dialog"
          sx={neuFabSx}
        >
          <SupportAgentIcon />
        </IconButton>
      </Tooltip>

      <Popper
        open={open}
        anchorEl={buttonRef.current}
        placement="top-start"
        transition
        disablePortal
        modifiers={[{ name: 'offset', options: { offset: [0, 12] } }]}
        sx={{ zIndex: 1000 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'left bottom' }}>
            <Box
              role="dialog"
              aria-label={t('pages:contact.toggle.support')}
              sx={{
                ...raisedPanelSx,
                width: { xs: 'min(92vw, 320px)', sm: 320 },
                maxHeight: '80vh',
                overflowY: 'auto',
                p: 2.5,
                boxShadow: shadows.neuFloat,
              }}
            >
              <ClickAwayListener onClickAway={close}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: soft.text }}>
                      {t('pages:contact.toggle.support')}
                    </Typography>
                    <IconButton
                      onClick={close}
                      aria-label={t('common:contactWidget.close')}
                      size="small"
                      sx={{ color: soft.textSecondary }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {submitted ? (
                    <Alert severity="success" sx={{ fontSize: '0.85rem' }}>
                      {t('pages:contact.alert.successSupport')}
                    </Alert>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      {error && (
                        <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.8rem' }} onClose={() => setError(null)}>
                          {error}
                        </Alert>
                      )}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <TextField
                          required
                          fullWidth
                          size="small"
                          label={t('pages:contact.form.name')}
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                        <TextField
                          required
                          fullWidth
                          size="small"
                          label={t('pages:contact.form.company')}
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                        />
                        <TextField
                          required
                          fullWidth
                          size="small"
                          type="email"
                          label={t('pages:contact.form.email')}
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                        <TextField
                          required
                          fullWidth
                          size="small"
                          type="tel"
                          label={t('pages:contact.form.phone')}
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                        <TextField
                          required
                          fullWidth
                          size="small"
                          multiline
                          rows={3}
                          label={t('pages:contact.form.messageLabelSupport')}
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
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

                      <IconButton
                        type="submit"
                        disabled={isLoading}
                        aria-label={isLoading ? t('pages:contact.submit.sending') : t('pages:contact.submit.support')}
                        sx={{
                          mt: 2,
                          width: '100%',
                          borderRadius: `${radii.neuWell}px`,
                          bgcolor: soft.accent,
                          color: soft.white,
                          py: 1,
                          gap: 1,
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          '@media (hover: hover)': { '&:hover': { bgcolor: soft.accentActive } },
                        }}
                      >
                        {isLoading ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <>
                            {t('pages:contact.submit.support')}
                            <SendIcon sx={{ fontSize: 16 }} />
                          </>
                        )}
                      </IconButton>
                    </form>
                  )}

                  <Box
                    component={RouterLink}
                    to="/contact"
                    onClick={close}
                    sx={[quietLinkSx, { display: 'block', mt: 1.5, fontSize: '0.78rem', textAlign: 'center' }]}
                  >
                    {t('common:contactWidget.fullForm')}
                  </Box>
                </Box>
              </ClickAwayListener>
            </Box>
          </Grow>
        )}
      </Popper>
    </Box>
  );
};
