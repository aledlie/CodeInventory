/**
 * HealthSummary Component
 *
 * Displays overall system health metrics with:
 * - Status badge (error/warning/success)
 * - Progress bars for key metrics (quality, coverage, dependencies)
 * - Action items list with severity indicators
 */

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  useTheme,
} from '@mui/material';
import {
  ErrorOutline as CriticalIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

/**
 * Action item to be displayed in the health summary
 */
export interface ActionItem {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  link?: string;
}

/**
 * Props for the HealthSummary component
 */
export interface HealthSummaryProps {
  metrics: {
    qualityScore: number;
    coveragePercentage: number;
    circularDeps: number;
    criticalIssues: number;
    untestedFunctions: number;
  };
  actionItems?: ActionItem[];
}

/**
 * Calculate overall health status based on metrics
 */
function calculateHealthStatus(metrics: HealthSummaryProps['metrics']): 'error' | 'warning' | 'success' {
  if (metrics.criticalIssues > 0) return 'error';
  if (metrics.coveragePercentage < 50) return 'error';
  if (metrics.circularDeps > 0) return 'warning';
  if (metrics.coveragePercentage >= 80) return 'success';
  return 'warning';
}

/**
 * Get color for progress bar based on percentage
 */
function getProgressColor(percentage: number): 'error' | 'warning' | 'success' {
  if (percentage < 50) return 'error';
  if (percentage < 80) return 'warning';
  return 'success';
}

/**
 * Get dependency health percentage
 * 100% if no circular dependencies, decreases based on count
 */
function getDependencyHealth(circularDeps: number): number {
  if (circularDeps === 0) return 100;
  // Each circular dependency reduces score by 10%, minimum 0%
  return Math.max(0, 100 - (circularDeps * 10));
}

/**
 * Get severity icon for action items
 */
function getSeverityIcon(severity: ActionItem['severity']) {
  switch (severity) {
    case 'critical':
      return <CriticalIcon color="error" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'info':
      return <InfoIcon color="info" />;
  }
}

/**
 * Progress bar with label and percentage overlay
 */
interface ProgressBarWithLabelProps {
  label: string;
  value: number;
  color: 'error' | 'warning' | 'success';
}

function ProgressBarWithLabel({ label, value, color }: ProgressBarWithLabelProps) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight="medium">
          {value.toFixed(1)}%
        </Typography>
      </Box>
      <Box sx={{ position: 'relative' }}>
        <LinearProgress
          variant="determinate"
          value={value}
          color={color}
          sx={{
            height: 8,
            borderRadius: 1,
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
          }}
        />
      </Box>
    </Box>
  );
}

/**
 * Generate default action items based on metrics
 */
function generateActionItems(metrics: HealthSummaryProps['metrics']): ActionItem[] {
  const items: ActionItem[] = [];

  if (metrics.criticalIssues > 0) {
    items.push({
      severity: 'critical',
      message: `${metrics.criticalIssues} critical code quality issues need immediate attention`,
      link: '#quality',
    });
  }

  if (metrics.coveragePercentage < 50) {
    items.push({
      severity: 'critical',
      message: `Test coverage is critically low at ${metrics.coveragePercentage.toFixed(1)}%`,
      link: '#coverage',
    });
  } else if (metrics.coveragePercentage < 80) {
    items.push({
      severity: 'warning',
      message: `Test coverage should be improved from ${metrics.coveragePercentage.toFixed(1)}%`,
      link: '#coverage',
    });
  }

  if (metrics.circularDeps > 0) {
    items.push({
      severity: 'warning',
      message: `${metrics.circularDeps} circular ${metrics.circularDeps === 1 ? 'dependency' : 'dependencies'} detected`,
      link: '#dependencies',
    });
  }

  if (metrics.untestedFunctions > 0) {
    items.push({
      severity: 'info',
      message: `${metrics.untestedFunctions} functions lack test coverage`,
      link: '#coverage',
    });
  }

  // If no issues, add success message
  if (items.length === 0) {
    items.push({
      severity: 'info',
      message: 'All metrics are healthy. Keep up the good work!',
    });
  }

  // Return only top 5 items
  return items.slice(0, 5);
}

/**
 * HealthSummary Component
 *
 * Displays a comprehensive health overview of the codebase with:
 * - Overall status badge
 * - Progress bars for quality, coverage, and dependency health
 * - Actionable items list
 */
export function HealthSummary({ metrics, actionItems }: HealthSummaryProps) {
  const status = calculateHealthStatus(metrics);
  const dependencyHealth = getDependencyHealth(metrics.circularDeps);
  const items = actionItems || generateActionItems(metrics);

  const statusLabel = {
    error: 'Needs Attention',
    warning: 'Fair',
    success: 'Healthy',
  }[status];

  const statusColor = {
    error: 'error' as const,
    warning: 'warning' as const,
    success: 'success' as const,
  }[status];

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header with Status Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            System Health
          </Typography>
          <Chip
            label={statusLabel}
            color={statusColor}
            size="small"
            sx={{ fontWeight: 'medium' }}
          />
        </Box>

        {/* Progress Bars */}
        <Box sx={{ mb: 3 }}>
          <ProgressBarWithLabel
            label="Code Quality"
            value={metrics.qualityScore}
            color={getProgressColor(metrics.qualityScore)}
          />
          <ProgressBarWithLabel
            label="Test Coverage"
            value={metrics.coveragePercentage}
            color={getProgressColor(metrics.coveragePercentage)}
          />
          <ProgressBarWithLabel
            label="Dependency Health"
            value={dependencyHealth}
            color={getProgressColor(dependencyHealth)}
          />
        </Box>

        {/* Action Items */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Action Items
          </Typography>
          <List dense disablePadding>
            {items.map((item, index) => (
              <ListItem
                key={index}
                disablePadding
                sx={{
                  py: 0.5,
                  '&:hover': item.link ? {
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                  } : undefined,
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {getSeverityIcon(item.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    item.link ? (
                      <Link
                        href={item.link}
                        underline="hover"
                        color="text.primary"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {item.message}
                      </Link>
                    ) : (
                      <Typography variant="body2" color="text.primary">
                        {item.message}
                      </Typography>
                    )
                  }
                  sx={{ my: 0 }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
}
