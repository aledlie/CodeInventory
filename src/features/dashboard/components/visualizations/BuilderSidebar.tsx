/**
 * BuilderSidebar Component
 *
 * Sidebar panel for the visualization builder containing:
 * - Draggable metric cards
 * - Chart type selection
 * - Configuration options
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ShowChart as LineIcon,
  BarChart as BarIcon,
  PieChart as PieIcon,
  ScatterPlot as ScatterIcon,
  Radar as RadarIcon,
  StackedLineChart as AreaIcon,
  DragIndicator as DragIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type {
  ChartType,
  TimeRange,
  Aggregation,
  VisualizationConfig,
  VisualizationMetric,
} from '../../types/visualizations';
import { useAvailableMetrics, useAvailableChartTypes } from '../../hooks/useVisualization';

/**
 * Props for BuilderSidebar
 */
export interface BuilderSidebarProps {
  /** Current visualization config */
  config: VisualizationConfig;
  /** Callback when config changes */
  onChange: (config: VisualizationConfig) => void;
  /** Callback when metric is added */
  onAddMetric?: (metric: VisualizationMetric) => void;
}

/**
 * Chart type icon mapping
 */
const chartIcons: Record<ChartType, React.ReactNode> = {
  line: <LineIcon />,
  bar: <BarIcon />,
  area: <AreaIcon />,
  pie: <PieIcon />,
  scatter: <ScatterIcon />,
  radar: <RadarIcon />,
};

/**
 * BuilderSidebar component
 */
export function BuilderSidebar({
  config,
  onChange,
  onAddMetric,
}: BuilderSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | false>('metrics');
  const availableMetrics = useAvailableMetrics();
  const availableChartTypes = useAvailableChartTypes();

  // Get metrics not already in use
  const unusedMetrics = availableMetrics.filter(
    (m) => !config.metrics.find((cm) => cm.metric === m.id)
  );

  const handleSectionChange = (section: string) => (_: unknown, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? section : false);
  };

  const handleChartTypeChange = useCallback(
    (chartType: ChartType) => {
      onChange({ ...config, chartType });
    },
    [config, onChange]
  );

  const handleTimeRangeChange = useCallback(
    (timeRange: TimeRange) => {
      onChange({ ...config, timeRange });
    },
    [config, onChange]
  );

  const handleAggregationChange = useCallback(
    (aggregation: Aggregation) => {
      onChange({ ...config, aggregation });
    },
    [config, onChange]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      onChange({ ...config, title });
    },
    [config, onChange]
  );

  const handleToggle = useCallback(
    (field: 'showLegend' | 'showGrid' | 'showDataLabels') => {
      onChange({ ...config, [field]: !config[field] });
    },
    [config, onChange]
  );

  const handleAddMetric = useCallback(
    (metricId: VisualizationMetric) => {
      const metricInfo = availableMetrics.find((m) => m.id === metricId);
      if (!metricInfo) return;

      const newMetric = {
        metric: metricId,
        label: metricInfo.label,
        color: metricInfo.color,
        visible: true,
        yAxis: 'left' as const,
      };

      onChange({
        ...config,
        metrics: [...config.metrics, newMetric],
      });

      onAddMetric?.(metricId);
    },
    [config, onChange, onAddMetric, availableMetrics]
  );

  return (
    <Paper
      sx={{
        width: 280,
        height: '100%',
        overflow: 'auto',
        borderRadius: 0,
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      {/* Title Section */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          label="Visualization Title"
          value={config.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          size="small"
        />
      </Box>

      {/* Metrics Section */}
      <Accordion
        expanded={expandedSection === 'metrics'}
        onChange={handleSectionChange('metrics')}
        disableGutters
        elevation={0}
        sx={{ '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Typography variant="subtitle2" fontWeight={600}>
            Metrics
          </Typography>
          <Chip
            label={config.metrics.length}
            size="small"
            sx={{ ml: 1, height: 20 }}
          />
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense disablePadding>
            {/* Current metrics */}
            {config.metrics.map((metric) => (
              <ListItem
                key={metric.metric}
                sx={{ bgcolor: 'action.selected' }}
                secondaryAction={
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: metric.color,
                    }}
                  />
                }
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <DragIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={metric.label}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}

            {/* Divider */}
            {config.metrics.length > 0 && unusedMetrics.length > 0 && (
              <Divider sx={{ my: 1 }} />
            )}

            {/* Available metrics to add */}
            {unusedMetrics.map((metric) => (
              <ListItemButton
                key={metric.id}
                onClick={() => handleAddMetric(metric.id)}
                sx={{ opacity: 0.7 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <AddIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={metric.label}
                  secondary={metric.category}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Chart Type Section */}
      <Accordion
        expanded={expandedSection === 'chartType'}
        onChange={handleSectionChange('chartType')}
        disableGutters
        elevation={0}
        sx={{ '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Typography variant="subtitle2" fontWeight={600}>
            Chart Type
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableChartTypes.map((type) => (
              <Tooltip key={type.id} title={type.description}>
                <IconButton
                  onClick={() => handleChartTypeChange(type.id)}
                  sx={{
                    border: 1,
                    borderColor: config.chartType === type.id ? 'primary.main' : 'divider',
                    bgcolor: config.chartType === type.id ? 'primary.lighter' : 'transparent',
                    borderRadius: 1,
                    width: 48,
                    height: 48,
                  }}
                >
                  {chartIcons[type.id]}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Time Range Section */}
      <Accordion
        expanded={expandedSection === 'timeRange'}
        onChange={handleSectionChange('timeRange')}
        disableGutters
        elevation={0}
        sx={{ '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Typography variant="subtitle2" fontWeight={600}>
            Time Range
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Range</InputLabel>
            <Select
              value={config.timeRange}
              label="Range"
              onChange={(e) => handleTimeRangeChange(e.target.value as TimeRange)}
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="14d">Last 14 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="60d">Last 60 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Aggregation</InputLabel>
            <Select
              value={config.aggregation}
              label="Aggregation"
              onChange={(e) => handleAggregationChange(e.target.value as Aggregation)}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      {/* Display Options Section */}
      <Accordion
        expanded={expandedSection === 'display'}
        onChange={handleSectionChange('display')}
        disableGutters
        elevation={0}
        sx={{ '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Typography variant="subtitle2" fontWeight={600}>
            Display Options
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControlLabel
            control={
              <Switch
                checked={config.showLegend}
                onChange={() => handleToggle('showLegend')}
                size="small"
              />
            }
            label="Show Legend"
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.showGrid}
                onChange={() => handleToggle('showGrid')}
                size="small"
              />
            }
            label="Show Grid"
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.showDataLabels}
                onChange={() => handleToggle('showDataLabels')}
                size="small"
              />
            }
            label="Show Data Labels"
          />
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}

export default BuilderSidebar;
