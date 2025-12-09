/**
 * InsightsCategoryTabs Component
 *
 * Tab navigation for filtering insights by type:
 * - All insights
 * - Improvements (green)
 * - Concerns (red)
 * - Recommendations (blue)
 * - Predictions (purple)
 */

import { Tabs, Tab, Badge, Box } from '@mui/material';
import {
  ViewList as AllIcon,
  TrendingUp as ImprovementIcon,
  Warning as ConcernIcon,
  Lightbulb as RecommendationIcon,
  Timeline as PredictionIcon,
} from '@mui/icons-material';
import type { InsightType } from '../../types';

/**
 * Tab value can be 'all' or an InsightType
 */
export type TabValue = 'all' | InsightType;

/**
 * Props for InsightsCategoryTabs
 */
export interface InsightsCategoryTabsProps {
  /** Currently selected tab */
  value: TabValue;
  /** Callback when tab is changed */
  onChange: (value: TabValue) => void;
  /** Count of insights by type */
  counts: {
    all: number;
    improvement: number;
    concern: number;
    recommendation: number;
    prediction: number;
  };
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Tab configuration
 */
const tabConfig: Array<{
  value: TabValue;
  label: string;
  icon: JSX.Element;
  color: string;
  badgeColor: 'primary' | 'success' | 'error' | 'info' | 'secondary';
}> = [
  {
    value: 'all',
    label: 'All',
    icon: <AllIcon />,
    color: 'primary.main',
    badgeColor: 'primary',
  },
  {
    value: 'improvement',
    label: 'Improvements',
    icon: <ImprovementIcon />,
    color: 'success.main',
    badgeColor: 'success',
  },
  {
    value: 'concern',
    label: 'Concerns',
    icon: <ConcernIcon />,
    color: 'error.main',
    badgeColor: 'error',
  },
  {
    value: 'recommendation',
    label: 'Recommendations',
    icon: <RecommendationIcon />,
    color: 'info.main',
    badgeColor: 'info',
  },
  {
    value: 'prediction',
    label: 'Predictions',
    icon: <PredictionIcon />,
    color: 'secondary.main',
    badgeColor: 'secondary',
  },
];

/**
 * InsightsCategoryTabs component
 */
export function InsightsCategoryTabs({
  value,
  onChange,
  counts,
  disabled = false,
}: InsightsCategoryTabsProps) {
  const handleChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    onChange(newValue);
  };

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: 1,
        mb: 2,
      }}
    >
      <Tabs
        value={value}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Insights category tabs"
        sx={{
          '& .MuiTab-root': {
            minHeight: 56,
            textTransform: 'none',
            fontWeight: 500,
          },
          '& .Mui-selected': {
            fontWeight: 600,
          },
        }}
      >
        {tabConfig.map((tab) => {
          const count = tab.value === 'all' ? counts.all : counts[tab.value];

          return (
            <Tab
              key={tab.value}
              value={tab.value}
              disabled={disabled || (tab.value !== 'all' && count === 0)}
              icon={
                <Badge
                  badgeContent={count}
                  color={tab.badgeColor}
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: 10,
                      height: 18,
                      minWidth: 18,
                    },
                  }}
                >
                  <Box
                    sx={{
                      color: value === tab.value ? tab.color : 'action.active',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {tab.icon}
                  </Box>
                </Badge>
              }
              label={tab.label}
              iconPosition="start"
              aria-label={`${tab.label} (${count})`}
              sx={{
                '&.Mui-selected': {
                  color: tab.color,
                },
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
}

export default InsightsCategoryTabs;
