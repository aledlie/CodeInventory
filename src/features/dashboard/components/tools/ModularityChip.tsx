import { Chip } from '@mui/material';
import type { ModularityScore } from '../../types/tools';

interface ModularityChipProps {
  score: ModularityScore;
  size?: 'small' | 'medium';
}

const MODULARITY_CONFIG = {
  highly_modular: {
    label: 'Highly Modular',
    color: 'success' as const,
  },
  modular: {
    label: 'Modular',
    color: 'info' as const,
  },
  semi_modular: {
    label: 'Semi-Modular',
    color: 'warning' as const,
  },
  coupled: {
    label: 'Coupled',
    color: 'error' as const,
  },
};

export function ModularityChip({ score, size = 'small' }: ModularityChipProps) {
  const config = MODULARITY_CONFIG[score];

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{ fontWeight: 600 }}
    />
  );
}
