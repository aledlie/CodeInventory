import { Box, LinearProgress, Typography } from '@mui/material';

interface ExtractionPotentialBarProps {
  value: number; // 0.0 - 1.0
  showLabel?: boolean;
  height?: number;
}

function getExtractionColor(value: number): 'success' | 'info' | 'warning' {
  if (value >= 0.8) return 'success';
  if (value >= 0.5) return 'info';
  return 'warning';
}

export function ExtractionPotentialBar({
  value,
  showLabel = true,
  height = 8
}: ExtractionPotentialBarProps) {
  const percentage = Math.round(value * 100);
  const color = getExtractionColor(value);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={color}
          sx={{
            height,
            borderRadius: height / 2,
            bgcolor: 'rgba(0, 0, 0, 0.08)',
          }}
        />
      </Box>
      {showLabel && (
        <Typography
          variant="body2"
          sx={{
            minWidth: 45,
            fontWeight: 600,
            color: `${color}.main`,
          }}
        >
          {percentage}%
        </Typography>
      )}
    </Box>
  );
}
