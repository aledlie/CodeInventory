/**
 * DateRangeSelector Component
 *
 * Allows users to select preset time ranges or custom dates for comparison.
 */

import { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import type { ComparisonPreset } from '../../types/comparison';

interface DateRangeSelectorProps {
  /** Selected preset */
  preset: ComparisonPreset;
  /** Current date */
  currentDate: string;
  /** Previous date */
  previousDate: string;
  /** Callback when preset changes */
  onPresetChange: (preset: ComparisonPreset) => void;
  /** Callback when custom dates change */
  onCustomDatesChange: (current: string, previous: string) => void;
}

const PRESET_LABELS: Record<Exclude<ComparisonPreset, 'custom'>, { label: string; days: number }> = {
  day: { label: '1 Day', days: 1 },
  week: { label: '1 Week', days: 7 },
  month: { label: '1 Month', days: 30 },
  quarter: { label: '3 Months', days: 90 },
};

export function DateRangeSelector({
  preset,
  currentDate,
  previousDate,
  onPresetChange,
  onCustomDatesChange,
}: DateRangeSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [customCurrent, setCustomCurrent] = useState(currentDate);
  const [customPrevious, setCustomPrevious] = useState(previousDate);

  const handlePresetClick = (newPreset: ComparisonPreset) => {
    if (newPreset === 'custom') {
      // Custom is handled by popover
      return;
    }
    onPresetChange(newPreset);
  };

  const handleCustomClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setCustomCurrent(currentDate);
    setCustomPrevious(previousDate);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleApplyCustom = () => {
    onCustomDatesChange(customCurrent, customPrevious);
    onPresetChange('custom');
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        Compare:
      </Typography>

      <ButtonGroup size="small" variant="outlined">
        {Object.entries(PRESET_LABELS).map(([key, { label }]) => (
          <Button
            key={key}
            variant={preset === key ? 'contained' : 'outlined'}
            onClick={() => handlePresetClick(key as ComparisonPreset)}
          >
            {label}
          </Button>
        ))}
        <Button
          variant={preset === 'custom' ? 'contained' : 'outlined'}
          onClick={handleCustomClick}
          startIcon={<CalendarIcon />}
        >
          Custom
        </Button>
      </ButtonGroup>

      {/* Custom Date Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
          <Typography variant="subtitle2">Select Date Range</Typography>

          <TextField
            label="Current Date"
            type="date"
            value={customCurrent}
            onChange={(e) => setCustomCurrent(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
            fullWidth
          />

          <TextField
            label="Previous Date"
            type="date"
            value={customPrevious}
            onChange={(e) => setCustomPrevious(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
            fullWidth
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleClose} size="small">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleApplyCustom}
              size="small"
              disabled={customCurrent === customPrevious}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Current range display */}
      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
        {new Date(previousDate).toLocaleDateString()} → {new Date(currentDate).toLocaleDateString()}
      </Typography>
    </Box>
  );
}

export default DateRangeSelector;
