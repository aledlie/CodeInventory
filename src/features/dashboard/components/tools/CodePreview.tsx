import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { useState } from 'react';

interface CodePreviewProps {
  code: string;
  language?: string;
  startLine?: number;
  highlightLines?: number[];
  maxHeight?: number;
}

export function CodePreview({
  code,
  language = 'python',
  startLine = 1,
  highlightLines = [],
  maxHeight = 400
}: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
        }}
      >
        <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <CopyIcon fontSize="small" sx={{ color: 'grey.50' }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          bgcolor: 'grey.900',
          color: 'grey.50',
          p: 2,
          borderRadius: 1,
          fontFamily: '"Fira Code", "Courier New", monospace',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          overflow: 'auto',
          maxHeight,
        }}
      >
        <pre style={{ margin: 0 }}>
          {lines.map((line, i) => {
            const lineNumber = startLine + i;
            const isHighlighted = highlightLines.includes(lineNumber);

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  backgroundColor: isHighlighted
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'transparent',
                  paddingLeft: '0.5em',
                  paddingRight: '0.5em',
                }}
              >
                <span
                  style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    width: '3em',
                    textAlign: 'right',
                    paddingRight: '1em',
                    userSelect: 'none',
                    flexShrink: 0,
                  }}
                >
                  {lineNumber}
                </span>
                <code style={{ flex: 1 }}>{line}</code>
              </div>
            );
          })}
        </pre>
      </Box>
    </Box>
  );
}
