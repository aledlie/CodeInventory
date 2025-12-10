/**
 * QualityTrendChart Component
 *
 * Displays quality score trend over time with threshold indicators.
 */

import { useMemo } from 'react';
import type { ChartData } from 'chart.js';
import { TrendChart } from './TrendChart';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { TrendData } from '../../types/charts';

interface QualityTrendChartProps {
  trendData: TrendData;
  loading?: boolean;
  error?: string | null;
}

export function QualityTrendChart({
  trendData,
  loading,
  error,
}: QualityTrendChartProps) {
  const { colors } = useChartTheme();

  const chartData: ChartData<'line'> = useMemo(
    () => ({
      labels: trendData.dataPoints.map((dp) => dp.label || dp.timestamp),
      datasets: [
        {
          label: 'Quality Score',
          data: trendData.dataPoints.map((dp) => dp.value),
          borderColor: colors.default.primary,
          backgroundColor: colors.default.backgroundFill,
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: colors.default.primary,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
      ],
    }),
    [trendData, colors]
  );

  const getTrendIndicator = () => {
    const { trend, changePercentage } = trendData.summary;
    const arrow = trend === 'improving' ? '\u2197' : trend === 'declining' ? '\u2198' : '\u2192';
    const percentText = Math.abs(changePercentage).toFixed(1);
    return `${arrow} ${percentText}%`;
  };

  const subtitle = `Latest: ${trendData.summary.average.toFixed(1)}% | ${
    trendData.summary.trend === 'improving'
      ? 'Improving'
      : trendData.summary.trend === 'declining'
        ? 'Declining'
        : 'Stable'
  }`;

  return (
    <TrendChart
      title="Quality Score Over Time"
      subtitle={subtitle}
      data={chartData}
      height={300}
      loading={loading}
      error={error}
      trendIndicator={getTrendIndicator()}
      ariaLabel={`Quality score trend showing ${trendData.summary.trend} pattern over ${trendData.dataPoints.length} data points`}
    />
  );
};

export default QualityTrendChart;
