/**
 * RiskHeatmap Component
 *
 * Visualizes risk concentration across the codebase using a horizontal bar chart
 * with color gradients indicating risk levels.
 *
 * Features:
 * - Color-coded bars from green (minimal) to red (critical)
 * - Interactive hover tooltips with detailed risk factors
 * - Click to drill down into specific modules
 * - Grouping by directory option
 * - WCAG AA accessible with data table alternative
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tooltip,
  Skeleton,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TableChart as TableIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import type { RiskHeatmapProps, RiskData, RiskFactorType } from '../../types/analytics';

/**
 * Risk factor labels
 */
const FACTOR_LABELS: Record<RiskFactorType, string> = {
  complexity: 'Complexity',
  coverage: 'Coverage Gap',
  dependencies: 'Dependencies',
  age: 'Code Age',
  churn: 'Churn Rate',
};

/**
 * Get color for risk score (0-100)
 */
function getRiskColor(score: number): string {
  if (score >= 80) return 'var(--color-risk-critical, #b71c1c)';
  if (score >= 60) return 'var(--color-risk-high, #e53935)';
  if (score >= 40) return 'var(--color-risk-medium, #ff9800)';
  if (score >= 20) return 'var(--color-risk-low, #ffc107)';
  return 'var(--color-risk-minimal, #4caf50)';
}

/**
 * Get background color for risk score
 */
function getRiskBgColor(score: number): string {
  if (score >= 80) return 'rgba(183, 28, 28, 0.15)';
  if (score >= 60) return 'rgba(229, 57, 53, 0.12)';
  if (score >= 40) return 'rgba(255, 152, 0, 0.1)';
  if (score >= 20) return 'rgba(255, 193, 7, 0.08)';
  return 'rgba(76, 175, 80, 0.08)';
}

/**
 * Risk bar component with animation
 */
interface RiskBarProps {
  item: RiskData;
  index: number;
  onClick?: (item: RiskData) => void;
  maxScore: number;
}

function RiskBar({ item, index, onClick, maxScore }: RiskBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const barWidth = (item.riskScore / Math.max(maxScore, 100)) * 100;
  const riskColor = getRiskColor(item.riskScore);

  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {item.path}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Risk Score: {item.riskScore.toFixed(1)} ({item.riskLevel})
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
        Risk Factors:
      </Typography>
      {item.factors.map((factor) => (
        <Box
          key={factor.type}
          sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
        >
          <Typography variant="caption">{FACTOR_LABELS[factor.type]}:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {factor.score.toFixed(0)}
          </Typography>
        </Box>
      ))}
      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
        Confidence: {item.confidence.toFixed(0)}%
      </Typography>
    </Box>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Tooltip title={tooltipContent} arrow placement="right">
        <Box
          onClick={() => onClick?.(item)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 0.75,
            px: 1,
            cursor: onClick ? 'pointer' : 'default',
            borderRadius: 1,
            transition: 'all 0.2s ease',
            bgcolor: isHovered ? getRiskBgColor(item.riskScore) : 'transparent',
            '&:hover': {
              transform: onClick ? 'translateX(4px)' : 'none',
            },
          }}
          role="listitem"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onClick) onClick(item);
          }}
          aria-label={`${item.displayName}: Risk score ${item.riskScore.toFixed(1)}, ${item.riskLevel} risk`}
        >
          {/* Module name */}
          <Typography
            variant="body2"
            sx={{
              width: 180,
              flexShrink: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: item.riskScore >= 60 ? 600 : 400,
            }}
          >
            {item.displayName}
          </Typography>

          {/* Risk bar */}
          <Box sx={{ flex: 1, position: 'relative', height: 24 }}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                bgcolor: 'var(--color-neutral-100, #f0f0f0)',
                borderRadius: 0.5,
              }}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                background: `linear-gradient(90deg, ${riskColor}aa, ${riskColor})`,
                borderRadius: 4,
                boxShadow: isHovered ? `0 0 8px ${riskColor}66` : 'none',
              }}
            />
          </Box>

          {/* Score */}
          <Typography
            variant="body2"
            sx={{
              width: 60,
              textAlign: 'right',
              fontWeight: 600,
              color: riskColor,
            }}
          >
            {item.riskScore.toFixed(1)}%
          </Typography>
        </Box>
      </Tooltip>
    </motion.div>
  );
}

/**
 * Legend component
 */
function RiskLegend() {
  const levels = [
    { label: 'Critical', color: 'var(--color-risk-critical, #b71c1c)', range: '80-100' },
    { label: 'High', color: 'var(--color-risk-high, #e53935)', range: '60-79' },
    { label: 'Medium', color: 'var(--color-risk-medium, #ff9800)', range: '40-59' },
    { label: 'Low', color: 'var(--color-risk-low, #ffc107)', range: '20-39' },
    { label: 'Minimal', color: 'var(--color-risk-minimal, #4caf50)', range: '0-19' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mt: 2,
        pt: 2,
        borderTop: '1px solid var(--color-border, #e0e0e0)',
      }}
      role="img"
      aria-label="Risk level legend"
    >
      {levels.map(({ label, color, range }) => (
        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              bgcolor: color,
              borderRadius: 0.5,
            }}
          />
          <Typography variant="caption">
            {label} ({range})
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Accessible data table alternative
 */
function RiskDataTable({ data }: { data: RiskData[] }) {
  return (
    <TableContainer>
      <Table size="small" aria-label="Risk data table">
        <TableHead>
          <TableRow>
            <TableCell>Module</TableCell>
            <TableCell align="right">Risk Score</TableCell>
            <TableCell>Risk Level</TableCell>
            <TableCell align="right">Confidence</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.path}>
              <TableCell component="th" scope="row">
                {item.displayName}
              </TableCell>
              <TableCell align="right">{item.riskScore.toFixed(1)}%</TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>{item.riskLevel}</TableCell>
              <TableCell align="right">{item.confidence.toFixed(0)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * Loading skeleton
 */
function RiskHeatmapSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.75 }}>
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="rectangular" sx={{ flex: 1 }} height={24} />
          <Skeleton variant="text" width={60} height={24} />
        </Box>
      ))}
    </Box>
  );
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        color: 'text.secondary',
      }}
    >
      <ChartIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
      <Typography variant="h6">No Risk Data Available</Typography>
      <Typography variant="body2">
        Run the analysis pipeline to generate risk assessments
      </Typography>
    </Box>
  );
}

/**
 * RiskHeatmap Component
 */
export function RiskHeatmap({
  data,
  maxItems = 10,
  onItemClick,
  groupByDirectory = false,
  showLegend = true,
  height,
  isLoading = false,
}: RiskHeatmapProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Sort data by risk score descending
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.riskScore - a.riskScore);
  }, [data]);

  // Get visible items
  const visibleData = useMemo(() => {
    if (expanded || sortedData.length <= maxItems) {
      return sortedData;
    }
    return sortedData.slice(0, maxItems);
  }, [sortedData, maxItems, expanded]);

  // Get max score for bar scaling
  const maxScore = useMemo(() => {
    return Math.max(...data.map((d) => d.riskScore), 100);
  }, [data]);

  // Group by directory if enabled
  const groupedData = useMemo(() => {
    if (!groupByDirectory) return null;

    const groups: Record<string, RiskData[]> = {};
    visibleData.forEach((item) => {
      const dir = item.directory || 'root';
      if (!groups[dir]) groups[dir] = [];
      groups[dir].push(item);
    });
    return groups;
  }, [visibleData, groupByDirectory]);

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, height }}>
        <RiskHeatmapSkeleton count={maxItems} />
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 2, height }}>
        <EmptyState />
      </Paper>
    );
  }

  const hasMore = sortedData.length > maxItems;

  return (
    <Paper
      sx={{ p: 2, height }}
      role="figure"
      aria-label="Risk heatmap showing risk levels across codebase modules"
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h6" component="h3">
          Risk Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={viewMode === 'chart' ? 'Show table view' : 'Show chart view'}>
            <IconButton
              size="small"
              onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
              aria-label={viewMode === 'chart' ? 'Switch to table view' : 'Switch to chart view'}
            >
              {viewMode === 'chart' ? <TableIcon /> : <ChartIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Chart view */}
      <AnimatePresence mode="wait">
        {viewMode === 'chart' ? (
          <motion.div
            key="chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box role="list" aria-label="Risk items">
              {groupedData
                ? Object.entries(groupedData).map(([dir, items]) => (
                    <Box key={dir} sx={{ mb: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {dir}
                      </Typography>
                      {items.map((item, index) => (
                        <RiskBar
                          key={item.path}
                          item={item}
                          index={index}
                          onClick={onItemClick}
                          maxScore={maxScore}
                        />
                      ))}
                    </Box>
                  ))
                : visibleData.map((item, index) => (
                    <RiskBar
                      key={item.path}
                      item={item}
                      index={index}
                      onClick={onItemClick}
                      maxScore={maxScore}
                    />
                  ))}
            </Box>

            {/* Show more/less toggle */}
            {hasMore && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <IconButton
                  onClick={() => setExpanded(!expanded)}
                  size="small"
                  aria-label={expanded ? 'Show less' : 'Show more'}
                  aria-expanded={expanded}
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  {expanded
                    ? 'Show less'
                    : `+${sortedData.length - maxItems} more items`}
                </Typography>
              </Box>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RiskDataTable data={visibleData} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      {showLegend && viewMode === 'chart' && <RiskLegend />}

      {/* Screen reader only data table */}
      <Box className="sr-only">
        <RiskDataTable data={visibleData} />
      </Box>
    </Paper>
  );
}

export default RiskHeatmap;
