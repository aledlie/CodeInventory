import { Box, Typography } from '@mui/material';

interface ExtractionGaugeProps {
  value: number; // 0.0 - 1.0
  size?: number;
}

function getGaugeColor(value: number): string {
  if (value >= 0.8) return '#43a047'; // success
  if (value >= 0.5) return '#0288d1'; // info
  return '#ed6c02'; // warning
}

export function ExtractionGauge({ value, size = 200 }: ExtractionGaugeProps) {
  const percentage = Math.round(value * 100);
  const angle = -90 + (value * 180); // -90 to 90 degrees
  const centerX = 100;
  const centerY = 100;

  // Calculate needle endpoint
  const needleLength = 70;
  const needleX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
  const needleY = centerY + needleLength * Math.sin((angle * Math.PI) / 180);

  // Arc path for progress
  const arcLength = 251; // Approximate arc length for semicircle
  const dashOffset = arcLength - (value * arcLength);

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size * 0.6,
        mx: 'auto',
      }}
    >
      <svg
        width={size}
        height={size * 0.6}
        viewBox="0 0 200 120"
        style={{ overflow: 'visible' }}
      >
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(0, 0, 0, 0.08)"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={getGaugeColor(value)}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 1s ease, stroke 0.3s ease',
          }}
        />

        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="5"
          fill="rgba(0, 0, 0, 0.3)"
        />

        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="rgba(0, 0, 0, 0.7)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            transition: 'all 1s ease',
          }}
        />
      </svg>

      {/* Percentage Label */}
      <Typography
        variant="h3"
        sx={{
          position: 'absolute',
          top: '60%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontWeight: 700,
          color: getGaugeColor(value),
        }}
      >
        {percentage}%
      </Typography>

      {/* Min/Max Labels */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
        }}
      >
        0%
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
        }}
      >
        100%
      </Typography>
    </Box>
  );
}
