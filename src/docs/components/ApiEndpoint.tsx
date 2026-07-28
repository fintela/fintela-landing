import { Box, Typography } from '@mui/material';

/**
 * The Fintela developer API (developer.fintela.io) is strictly read-only: every one of
 * its 38 routes is a GET. Resources are created and mutated only in the app. The types
 * below are a compile-time guard so that a documented write cannot be reintroduced —
 * `PUT`/`PATCH`/`DELETE` do not exist at all, and `POST` is legal only on a
 * `{your-endpoint}` path.
 *
 * That `POST` exception is not a loophole: the external-strategy and external-fitness
 * pages document `POST /simulate` and `POST /evaluate` on endpoints the CUSTOMER hosts
 * and Fintela calls outbound. Those are contracts we consume, not routes we expose, so
 * the path prefix is what separates them from a Fintela route.
 */
type Method = 'GET' | 'POST';

/** A customer-hosted endpoint, written with the placeholder host the docs use. */
type OutboundPath = `{your-endpoint}${string}`;

interface BaseProps {
  path: string;
  /** Optional short description shown below the path. */
  description?: string;
  /** Optional auth scope shown as a chip. */
  auth?: string;
}

type ApiEndpointProps =
  | (BaseProps & { method: 'GET' })
  | (BaseProps & { method: 'POST'; path: OutboundPath });

const methodColor: Record<Method, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
};

export const ApiEndpoint = ({ method, path, description, auth }: ApiEndpointProps) => {
  const color = methodColor[method];
  return (
    <Box
      sx={{
        my: 3,
        borderRadius: 2.5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          background: '#fafbfc',
          borderBottom: description || auth ? '1px solid' : 'none',
          borderColor: 'divider',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        <Box
          sx={{
            px: 1.25,
            py: 0.45,
            borderRadius: 1.25,
            background: `${color}1a`,
            color,
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            minWidth: 56,
            textAlign: 'center',
            border: '1px solid',
            borderColor: `${color}40`,
          }}
        >
          {method}
        </Box>
        <Typography
          sx={{
            fontFamily: 'inherit',
            fontSize: { xs: '0.84rem', md: '0.92rem' },
            color: 'text.primary',
            fontWeight: 600,
            flex: 1,
            wordBreak: 'break-all',
          }}
        >
          {path}
        </Typography>
        {auth && (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'text.disabled',
              px: 1,
              py: 0.4,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: '#fff',
            }}
          >
            {auth}
          </Box>
        )}
      </Box>
      {description && (
        <Box sx={{ px: 2, py: 1.5, fontSize: '0.9rem', color: 'text.secondary' }}>
          {description}
        </Box>
      )}
    </Box>
  );
};
