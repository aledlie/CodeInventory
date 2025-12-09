import { Chip } from '@mui/material';
import type { ExtractionComplexity } from '../../types/tools';

interface ExtractionComplexityChipProps {
  complexity: ExtractionComplexity;
  size?: 'small' | 'medium';
}

const COMPLEXITY_CONFIG = {
  trivial: {
    label: 'Trivial',
    color: 'success' as const,
  },
  moderate: {
    label: 'Moderate',
    color: 'info' as const,
  },
  complex: {
    label: 'Complex',
    color: 'warning' as const,
  },
  high: {
    label: 'High',
    color: 'error' as const,
  },
};

export function ExtractionComplexityChip({
  complexity,
  size = 'small'
}: ExtractionComplexityChipProps) {
  const config = COMPLEXITY_CONFIG[complexity];

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant="outlined"
    />
  );
}
