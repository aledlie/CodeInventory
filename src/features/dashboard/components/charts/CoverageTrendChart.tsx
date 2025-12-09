/**
 * CoverageTrendChart Component
 *
 * Displays test coverage percentage trend over time.
 */

import { useMemo } from 'react';
import type { ChartData } from 'chart.js';
import { TrendChart } from './TrendChart';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { TrendData } from '../../types/charts';

interface CoverageTrendChartProps {
  trendData: TrendData;
  loading?: boolean;
  error?: string | null;
}

export const CoverageTrendChart: React.FC<CoverageTrendChartProps> = ({
  trendData,
  loading,
  error,
}) => {
  const { colors } = useChartTheme();

  const chartData: ChartData<'line'> = useMemo(
    () => ({
      labels: trendData.dataPoints.map((dp) => dp.label || dp.timestamp),
      datasets: [
        {
          label: 'Coverage %',
          data: trendData.dataPoints.map((dp) => dp.value),
          borderColor: colors.default.success,
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: colors.default.success,
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

  const subtitle = `Current: ${trendData.dataPoints[trendData.dataPoints.length - 1]?.value.toFixed(1) || 0}% | Target: 80%`;

  return (
    <TrendChart
      title="Test Coverage Over Time"
      subtitle={subtitle}
      data={chartData}
      height={300}
      loading={loading}
      error={error}
      trendIndicator={getTrendIndicator()}
      ariaLabel={`Test coverage trend showing ${trendData.summary.trend} pattern over ${trendData.dataPoints.length} data points`}
    />
  );
};

export default CoverageTrendChart;
