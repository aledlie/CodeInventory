import { useMemo } from 'react';
import { Box, Typography, Paper, Skeleton, Stack, Chip } from '@mui/material';
import { useChartData } from '../../hooks/useToolsData';
import type { DashboardData, PrecomputedChart as ChartDataType } from '../../types/tools';

interface PrecomputedChartProps {
  chartName: keyof DashboardData['charts'];
  title?: string;
  height?: number;
  showLegend?: boolean;
}

/**
 * Renders pre-computed chart data from the preprocessing pipeline.
 * Uses simple visualization since the data is already aggregated.
 */
export function PrecomputedChart({
  chartName,
  title,
  height = 200,
  showLegend = true,
}: PrecomputedChartProps) {
  const { data: chartData, isLoading } = useChartData(chartName);

  const displayTitle = useMemo(() => {
    if (title) return title;
    return chartName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }, [title, chartName]);

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, height }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rectangular" height={height - 60} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (!chartData || chartData.data.length === 0) {
    return (
      <Paper sx={{ p: 2, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {displayTitle}
      </Typography>

      {chartData.type === 'donut' || chartData.type === 'pie' ? (
        <DonutVisualization data={chartData} height={height} showLegend={showLegend} />
      ) : (
        <BarVisualization data={chartData} height={height} showLegend={showLegend} />
      )}
    </Paper>
  );
}

interface VisualizationProps {
  data: ChartDataType;
  height: number;
  showLegend: boolean;
}

/**
 * Simple donut/pie visualization using CSS
 */
function DonutVisualization({ data, height, showLegend }: VisualizationProps) {
  const total = useMemo(() =>
    data.data.reduce((sum, item) => sum + item.value, 0),
    [data.data]
  );

  const segments = useMemo(() => {
    let currentAngle = 0;
    return data.data.map((item) => {
      const angle = (item.value / total) * 360;
      const segment = {
        ...item,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        percentage: ((item.value / total) * 100).toFixed(1),
      };
      currentAngle += angle;
      return segment;
    });
  }, [data.data, total]);

  // Generate conic gradient for donut
  const conicGradient = useMemo(() => {
    const stops = segments
      .map((seg) => `${seg.color} ${seg.startAngle}deg ${seg.endAngle}deg`)
      .join(', ');
    return `conic-gradient(${stops})`;
  }, [segments]);

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: height - 40,
          height: height - 40,
          borderRadius: '50%',
          background: conicGradient,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            bgcolor: 'background.paper',
          },
        }}
      />

      {showLegend && (
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          {segments.slice(0, 5).map((item) => (
            <Stack
              key={item.key}
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 0.5,
                  bgcolor: item.color,
                }}
              />
              <Typography variant="caption" sx={{ flex: 1 }}>
                {item.label}
              </Typography>
              <Chip
                label={`${item.percentage}%`}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
            </Stack>
          ))}
          {segments.length > 5 && (
            <Typography variant="caption" color="text.secondary">
              +{segments.length - 5} more
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
}

/**
 * Simple bar visualization using CSS
 */
function BarVisualization({ data, height, showLegend }: VisualizationProps) {
  const maxValue = useMemo(() =>
    Math.max(...data.data.map((item) => item.value)),
    [data.data]
  );

  return (
    <Box sx={{ height }}>
      <Stack spacing={1}>
        {data.data.slice(0, 8).map((item) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <Stack
              key={item.key}
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Typography
                variant="caption"
                sx={{ width: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {item.label}
              </Typography>
              <Box sx={{ flex: 1, position: 'relative', height: 20 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${percentage}%`,
                    bgcolor: item.color,
                    borderRadius: 0.5,
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              {showLegend && (
                <Typography variant="caption" sx={{ width: 30, textAlign: 'right' }}>
                  {item.value}
                </Typography>
              )}
            </Stack>
          );
        })}
        {data.data.length > 8 && (
          <Typography variant="caption" color="text.secondary">
            +{data.data.length - 8} more categories
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

/**
 * Grid of all available pre-computed charts
 */
export function PrecomputedChartsGrid() {
  const chartNames: Array<keyof DashboardData['charts']> = [
    'modularity_distribution',
    'type_distribution',
    'pattern_distribution',
    'utility_score_distribution',
    'abstraction_level_distribution',
    'dependency_type_distribution',
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 2,
      }}
    >
      {chartNames.map((chartName) => (
        <PrecomputedChart key={chartName} chartName={chartName} />
      ))}
    </Box>
  );
}
