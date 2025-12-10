/**
 * ChartTimeRangeSelector Component
 *
 * Toggle button group for selecting time range filter.
 */

import type { MouseEvent } from 'react';
import { ToggleButtonGroup, ToggleButton, Box } from '@mui/material';
import type { ChartTimeRange } from '../../types/charts';

interface ChartTimeRangeSelectorProps {
  value: ChartTimeRange;
  onChange: (value: ChartTimeRange) => void;
  disabled?: boolean;
}

export function ChartTimeRangeSelector({
  value,
  onChange,
  disabled = false,
}: ChartTimeRangeSelectorProps) {
  const handleChange = (_event: MouseEvent<HTMLElement>, newValue: ChartTimeRange | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="time range selector"
        size="small"
        disabled={disabled}
      >
        <ToggleButton value="7d" aria-label="7 days">
          7 Days
        </ToggleButton>
        <ToggleButton value="30d" aria-label="30 days">
          30 Days
        </ToggleButton>
        <ToggleButton value="90d" aria-label="90 days">
          90 Days
        </ToggleButton>
        <ToggleButton value="all" aria-label="all time">
          All Time
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ChartTimeRangeSelector;
