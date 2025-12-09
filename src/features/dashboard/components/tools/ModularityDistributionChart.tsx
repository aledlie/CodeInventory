import { Box, Stack, Typography } from '@mui/material';
import type { ModularityScore } from '../../types/tools';

interface ModularityDistributionChartProps {
  distribution: Record<ModularityScore, number>;
  total: number;
}

const MODULARITY_COLORS: Record<ModularityScore, string> = {
  highly_modular: '#2e7d32', // success.main
  modular: '#0288d1',        // info.main
  semi_modular: '#ed6c02',   // warning.main
  coupled: '#d32f2f',        // error.main
};

const MODULARITY_LABELS: Record<ModularityScore, string> = {
  highly_modular: 'Highly Modular',
  modular: 'Modular',
  semi_modular: 'Semi-Modular',
  coupled: 'Coupled',
};

export function ModularityDistributionChart({
  distribution,
  total
}: ModularityDistributionChartProps) {
  const segments: Array<{ score: ModularityScore; count: number; percentage: number }> = [
    'highly_modular',
    'modular',
    'semi_modular',
    'coupled'
  ].map(score => ({
    score: score as ModularityScore,
    count: distribution[score as ModularityScore] || 0,
    percentage: ((distribution[score as ModularityScore] || 0) / total) * 100
  }));

  return (
    <Box>
      {/* Stacked Bar */}
      <Stack
        direction="row"
        spacing={0}
        sx={{
          height: 40,
          borderRadius: 1,
          overflow: 'hidden',
          mb: 2
        }}
      >
        {segments.map(({ score, percentage }) => (
          percentage > 0 && (
            <Box
              key={score}
              sx={{
                width: `${percentage}%`,
                bgcolor: MODULARITY_COLORS[score],
                transition: 'all 0.3s ease',
                '&:hover': {
                  opacity: 0.8,
                }
              }}
            />
          )
        ))}
      </Stack>

      {/* Legend */}
      <Stack
        direction="row"
        spacing={3}
        justifyContent="center"
        flexWrap="wrap"
        sx={{ gap: 1 }}
      >
        {segments.map(({ score, count, percentage }) => (
          <Stack
            key={score}
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                bgcolor: MODULARITY_COLORS[score],
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {MODULARITY_LABELS[score]}:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {count} ({percentage.toFixed(0)}%)
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
