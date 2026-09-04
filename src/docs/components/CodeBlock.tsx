import { useState, useMemo } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { tokenize, TOKEN_COLORS, type Language } from '../syntax/highlight';

export interface CodeSnippet {
  label: string;
  language: Language;
  code: string;
}

interface CodeBlockProps {
  /** Single snippet — pass either this or `tabs`. */
  language?: Language;
  code?: string;
  /** Filename or label shown in the chrome strip. */
  filename?: string;
  /** Multiple tabs (e.g., Python / Node / cURL). */
  tabs?: CodeSnippet[];
  /** Show line numbers. */
  lineNumbers?: boolean;
  /** Maximum visible height before scroll. */
  maxHeight?: number | string;
}

export const CodeBlock = ({
  language = 'python',
  code = '',
  filename,
  tabs,
  lineNumbers = false,
  maxHeight,
}: CodeBlockProps) => {
  const activeTabs = tabs ?? [{ label: filename ?? language, language, code }];
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = activeTabs[active];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const tokens = useMemo(
    () => tokenize(current.code, current.language),
    [current.code, current.language],
  );

  // Render tokens, preserving newlines for proper wrapping
  const rendered = useMemo(() => {
    const lines: { tokens: { text: string; color: string }[] }[] = [
      { tokens: [] },
    ];
    tokens.forEach((tok) => {
      const parts = tok.text.split('\n');
      parts.forEach((part, idx) => {
        if (part) {
          lines[lines.length - 1].tokens.push({
            text: part,
            color: TOKEN_COLORS[tok.type],
          });
        }
        if (idx < parts.length - 1) lines.push({ tokens: [] });
      });
    });
    return lines;
  }, [tokens]);

  return (
    <Box
      sx={{
        my: 3,
        borderRadius: 2.5,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #14182b 0%, #0f1325 100%)',
        border: '1px solid rgba(47,99,149,0.18)',
        boxShadow: '0 14px 36px rgba(11,16,32,0.18)',
      }}
    >
      {/* Tab / filename strip */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          pl: 0.5,
          pr: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflowX: 'auto' }}>
          {activeTabs.map((tab, idx) => (
            <Box
              key={tab.label + idx}
              role="tab"
              tabIndex={0}
              onClick={() => setActive(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setActive(idx);
              }}
              sx={{
                px: 1.75,
                py: 1.1,
                fontSize: '0.78rem',
                fontWeight: 600,
                color: active === idx ? '#fff' : 'rgba(255,255,255,0.45)',
                cursor: activeTabs.length > 1 ? 'pointer' : 'default',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.01em',
                position: 'relative',
                whiteSpace: 'nowrap',
                outline: 'none',
                transition: 'color 0.16s',
                '&:hover': activeTabs.length > 1 ? { color: '#fff' } : undefined,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 6,
                  right: 6,
                  bottom: 0,
                  height: 2,
                  background: active === idx ? 'linear-gradient(90deg, #efc03c, #e53540)' : 'transparent',
                  borderRadius: 2,
                },
              }}
            >
              {tab.label}
            </Box>
          ))}
        </Box>

        <Tooltip title={copied ? 'Copied' : 'Copy code'} placement="left">
          <IconButton
            aria-label="Copy code"
            size="small"
            onClick={handleCopy}
            sx={{
              color: copied ? '#a7e3a3' : 'rgba(255,255,255,0.55)',
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            {copied ? (
              <CheckRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <ContentCopyOutlinedIcon sx={{ fontSize: 15 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Code body */}
      <Box
        component="pre"
        sx={{
          m: 0,
          px: 2,
          py: 1.75,
          maxHeight,
          overflowX: 'auto',
          overflowY: maxHeight ? 'auto' : 'visible',
          fontFamily: '"JetBrains Mono", "SFMono-Regular", Menlo, monospace',
          fontSize: { xs: '0.78rem', md: '0.83rem' },
          lineHeight: 1.65,
          color: '#e6e8f0',
        }}
      >
        {rendered.map((line, idx) => (
          <Box key={idx} component="span" sx={{ display: 'block', whiteSpace: 'pre' }}>
            {lineNumbers && (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 28,
                  color: 'rgba(255,255,255,0.25)',
                  userSelect: 'none',
                  pr: 1.5,
                  textAlign: 'right',
                }}
              >
                {idx + 1}
              </Box>
            )}
            {line.tokens.length === 0 ? (
              <span>&nbsp;</span>
            ) : (
              line.tokens.map((t, ti) => (
                <span key={ti} style={{ color: t.color }}>
                  {t.text}
                </span>
              ))
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
