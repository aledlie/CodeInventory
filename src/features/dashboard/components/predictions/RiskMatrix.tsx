/**
 * RiskMatrix Component
 *
 * Displays risks on a 2D matrix with:
 * - X-axis: Probability (low to high)
 * - Y-axis: Impact (low to critical)
 * - Bubbles sized by estimated effort
 * - Colors by risk level
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Timer as EffortIcon,
  Build as MitigationIcon,
} from '@mui/icons-material';
import type { Risk, RiskImpact, RiskProbability } from '../../types';

/**
 * Props for RiskMatrix
 */
export interface RiskMatrixProps {
  /** List of risks to display */
  risks: Risk[];
  /** Callback when a risk is clicked */
  onRiskClick?: (risk: Risk) => void;
  /** Height of the matrix */
  height?: number;
  /** Show quadrant labels */
  showLabels?: boolean;
}

/**
 * Risk color by calculated level
 */
function getRiskColor(impact: RiskImpact, probability: RiskProbability): string {
  const impactScore = { low: 1, medium: 2, high: 3, critical: 4 }[impact];
  const probScore = { low: 1, medium: 2, high: 3 }[probability];
  const totalScore = impactScore + probScore;

  if (totalScore >= 6) return '#dc3545'; // Critical - red
  if (totalScore >= 5) return '#ff5722'; // High - orange
  if (totalScore >= 4) return '#ff9800'; // Medium - yellow
  return '#28a745'; // Low - green
}

/**
 * Get position coordinates for risk
 */
function getRiskPosition(risk: Risk): { x: number; y: number } {
  const probMap: Record<RiskProbability, number> = { low: 16.67, medium: 50, high: 83.33 };
  const impactMap: Record<RiskImpact, number> = { low: 12.5, medium: 37.5, high: 62.5, critical: 87.5 };

  return {
    x: probMap[risk.probability],
    y: impactMap[risk.impact],
  };
}

/**
 * Get bubble size based on effort
 */
function getBubbleSize(effort: number): number {
  // Map effort (hours) to size (30-80px)
  const minSize = 30;
  const maxSize = 80;
  const minEffort = 1;
  const maxEffort = 40; // Cap at 40 hours

  const normalized = Math.min(Math.max(effort, minEffort), maxEffort);
  const ratio = (normalized - minEffort) / (maxEffort - minEffort);
  return minSize + ratio * (maxSize - minSize);
}

/**
 * Risk detail dialog
 */
function RiskDetailDialog({
  risk,
  open,
  onClose,
}: {
  risk: Risk | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!risk) return null;

  const riskColor = getRiskColor(risk.impact, risk.probability);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: riskColor,
            }}
          />
          <Typography variant="h6">{risk.name}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          {risk.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`Impact: ${risk.impact}`}
            size="small"
            sx={{
              bgcolor:
                risk.impact === 'critical'
                  ? 'error.light'
                  : risk.impact === 'high'
                  ? 'warning.light'
                  : 'success.light',
            }}
          />
          <Chip
            label={`Probability: ${risk.probability}`}
            size="small"
            color={risk.probability === 'high' ? 'error' : risk.probability === 'medium' ? 'warning' : 'success'}
            variant="outlined"
          />
          <Chip label={risk.category} size="small" variant="outlined" />
          <Chip
            label={`${risk.confidence}% confidence`}
            size="small"
            color="info"
            variant="outlined"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <EffortIcon color="action" fontSize="small" />
            <Typography variant="subtitle2">Estimated Effort</Typography>
          </Box>
          <Typography variant="body2">{risk.estimatedEffort} hours to mitigate</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MitigationIcon color="action" fontSize="small" />
            <Typography variant="subtitle2">Mitigation Strategy</Typography>
          </Box>
          <Typography variant="body2">{risk.mitigation}</Typography>
        </Box>

        {risk.affectedFiles.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Affected Files ({risk.affectedFiles.length})
            </Typography>
            <List dense disablePadding>
              {risk.affectedFiles.slice(0, 5).map((file, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <FileIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={file}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { fontFamily: 'monospace', fontSize: 12 },
                    }}
                  />
                </ListItem>
              ))}
              {risk.affectedFiles.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  +{risk.affectedFiles.length - 5} more files
                </Typography>
              )}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary">
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}


/**
 * RiskMatrix component
 */
export function RiskMatrix({
  risks,
  onRiskClick,
  height = 400,
  showLabels = true,
}: RiskMatrixProps) {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Position risks with slight jitter to avoid overlap
  const positionedRisks = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const offset = 3; // Pixels to offset for overlap prevention

    return risks.map((risk, index) => {
      const basePos = getRiskPosition(risk);
      const key = `${basePos.x}-${basePos.y}`;

      // Check for overlaps and adjust
      let adjustedX = basePos.x;
      let adjustedY = basePos.y;

      if (positions[key]) {
        // Add slight offset based on index
        adjustedX += (index % 3 - 1) * offset;
        adjustedY += (Math.floor(index / 3) % 3 - 1) * offset;
      }

      positions[key] = { x: adjustedX, y: adjustedY };

      return {
        risk,
        x: adjustedX,
        y: adjustedY,
        size: getBubbleSize(risk.estimatedEffort),
        color: getRiskColor(risk.impact, risk.probability),
      };
    });
  }, [risks]);

  const handleRiskClick = (risk: Risk) => {
    setSelectedRisk(risk);
    setDialogOpen(true);
    onRiskClick?.(risk);
  };

  if (risks.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography color="text.secondary">No risks identified</Typography>
      </Box>
    );
  }

  return (
    <>
      <Paper
        sx={{
          height,
          position: 'relative',
          overflow: 'hidden',
          p: 2,
        }}
      >
        {/* Y-axis label */}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'rotate(-90deg) translateX(-50%)',
            transformOrigin: 'left center',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          Impact
        </Typography>

        {/* X-axis label */}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          Probability
        </Typography>

        {/* Matrix grid */}
        <Box
          sx={{
            position: 'absolute',
            top: 24,
            left: 40,
            right: 16,
            bottom: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: '1px',
            bgcolor: 'divider',
          }}
        >
          {/* Quadrant cells */}
          {['critical', 'high', 'medium', 'low'].map((impact) =>
            ['low', 'medium', 'high'].map((prob) => {
              const bgColor = getRiskColor(impact as RiskImpact, prob as RiskProbability);
              return (
                <Box
                  key={`${impact}-${prob}`}
                  sx={{
                    bgcolor: `${bgColor}15`,
                    position: 'relative',
                  }}
                >
                  {showLabels && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        fontSize: 9,
                        color: 'text.disabled',
                        textTransform: 'capitalize',
                      }}
                    >
                      {impact === 'critical' && prob === 'low' && 'Monitor'}
                      {impact === 'critical' && prob === 'medium' && 'High Risk'}
                      {impact === 'critical' && prob === 'high' && 'Critical'}
                      {impact === 'high' && prob === 'low' && 'Monitor'}
                      {impact === 'high' && prob === 'medium' && 'Medium'}
                      {impact === 'high' && prob === 'high' && 'High Risk'}
                      {impact === 'medium' && prob === 'low' && 'Low'}
                      {impact === 'medium' && prob === 'medium' && 'Low'}
                      {impact === 'medium' && prob === 'high' && 'Medium'}
                      {impact === 'low' && prob === 'low' && 'Minimal'}
                      {impact === 'low' && prob === 'medium' && 'Low'}
                      {impact === 'low' && prob === 'high' && 'Low'}
                    </Typography>
                  )}
                </Box>
              );
            })
          )}
        </Box>

        {/* Risk bubbles */}
        <Box
          sx={{
            position: 'absolute',
            top: 24,
            left: 40,
            right: 16,
            bottom: 32,
          }}
        >
          {positionedRisks.map(({ risk, x, y, size, color }) => (
            <Tooltip
              key={risk.id}
              title={
                <Box>
                  <Typography variant="subtitle2">{risk.name}</Typography>
                  <Typography variant="caption">
                    {risk.impact} impact, {risk.probability} probability
                  </Typography>
                  <br />
                  <Typography variant="caption">{risk.estimatedEffort}h effort</Typography>
                </Box>
              }
              arrow
            >
              <Box
                onClick={() => handleRiskClick(risk)}
                sx={{
                  position: 'absolute',
                  left: `${x}%`,
                  bottom: `${y}%`,
                  transform: 'translate(-50%, 50%)',
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  bgcolor: color,
                  opacity: risk.isActive ? 0.9 : 0.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600,
                  textAlign: 'center',
                  boxShadow: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translate(-50%, 50%) scale(1.1)',
                    boxShadow: 4,
                    zIndex: 10,
                  },
                  animation: risk.impact === 'critical' ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 0.9 },
                    '50%': { opacity: 0.6 },
                  },
                }}
              >
                {risk.name.slice(0, 8)}
              </Box>
            </Tooltip>
          ))}
        </Box>

        {/* Y-axis labels */}
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            top: 24,
            bottom: 32,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
          }}
        >
          {['Critical', 'High', 'Medium', 'Low'].map((label) => (
            <Typography key={label} variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              {label}
            </Typography>
          ))}
        </Box>

        {/* X-axis labels */}
        <Box
          sx={{
            position: 'absolute',
            left: 40,
            right: 16,
            bottom: 16,
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          {['Low', 'Medium', 'High'].map((label) => (
            <Typography key={label} variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              {label}
            </Typography>
          ))}
        </Box>
      </Paper>

      <RiskDetailDialog
        risk={selectedRisk}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}

export default RiskMatrix;
