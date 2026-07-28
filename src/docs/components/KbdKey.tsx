import { Box } from '@mui/material';

interface KbdKeyProps {
  children: React.ReactNode;
}

export const KbdKey = ({ children }: KbdKeyProps) => (
  <Box
    component="kbd"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 22,
      height: 22,
      px: 0.75,
      mx: 0.25,
      fontSize: '0.7rem',
      fontWeight: 600,
      fontFamily: '"JetBrains Mono", monospace',
      color: 'text.primary',
      bgcolor: '#fff',
      border: '1px solid',
      borderColor: 'divider',
      borderBottom: '2px solid',
      borderBottomColor: 'divider',
      borderRadius: 1,
      boxShadow: '0 1px 0 rgba(11,16,32,0.06)',
      letterSpacing: 0,
    }}
  >
    {children}
  </Box>
);
