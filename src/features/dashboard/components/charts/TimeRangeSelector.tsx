/**
 * TimeRangeSelector Component
 *
 * Toggle button group for selecting time range filter.
 */

import { ToggleButtonGroup, ToggleButton, Box } from '@mui/material';
import type { TimeRange } from '../../types/charts';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  disabled?: boolean;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: TimeRange | null) => {
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

export default TimeRangeSelector;
