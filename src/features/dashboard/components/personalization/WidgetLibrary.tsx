/**
 * WidgetLibrary Component
 *
 * Phase 5B: Dashboard Personalization
 * Displays available widgets with toggle checkboxes for customization
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Grid2 as Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Collapse,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ErrorIcon from '@mui/icons-material/Error';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TimelineIcon from '@mui/icons-material/Timeline';
import LoopIcon from '@mui/icons-material/Loop';
import BugReportIcon from '@mui/icons-material/BugReport';
import GroupIcon from '@mui/icons-material/Group';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type {
  WidgetLibraryProps,
  WidgetMetadata,
  WidgetCategory,
  WidgetId,
} from '../../types';

// ============================================================================
// Icon Mapping
// ============================================================================

const iconMap: Record<string, typeof AssessmentIcon> = {
  Assessment: AssessmentIcon,
  CheckCircle: CheckCircleIcon,
  AccountTree: AccountTreeIcon,
  Error: ErrorIcon,
  TrendingUp: TrendingUpIcon,
  Psychology: PsychologyIcon,
  Timeline: TimelineIcon,
  Loop: LoopIcon,
  BugReport: BugReportIcon,
  Group: GroupIcon,
  Notifications: NotificationsIcon,
  FlashOn: FlashOnIcon,
};

const categoryLabels: Record<WidgetCategory | 'all', string> = {
  all: 'All Widgets',
  metrics: 'Metrics',
  quality: 'Quality',
  coverage: 'Coverage',
  dependencies: 'Dependencies',
  ai: 'AI & Predictions',
  collaboration: 'Collaboration',
};

// ============================================================================
// Widget Card Component
// ============================================================================

interface WidgetCardProps {
  widget: WidgetMetadata;
  isActive: boolean;
  onToggle: (widgetId: WidgetId, visible: boolean) => void;
  onAdd: (widgetId: WidgetId) => void;
  onRemove?: (instanceId: string) => void;
  activeInstanceId?: string;
}

function WidgetCard({
  widget,
  isActive,
  onToggle,
  onAdd,
}: WidgetCardProps) {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  const IconComponent = iconMap[widget.icon] || AssessmentIcon;

  return (
    <Card
      elevation={isActive ? 2 : 1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isActive
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(['border-color', 'box-shadow'], {
          duration: theme.transitions.duration.short,
        }),
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(
                isActive ? theme.palette.primary.main : theme.palette.grey[500],
                0.1
              ),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent
              sx={{
                fontSize: 24,
                color: isActive
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
              }}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {widget.name}
              </Typography>
              {widget.isPremium && (
                <Tooltip title="Premium feature">
                  <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                </Tooltip>
              )}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {widget.description}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={isActive}
                onChange={(e) => onToggle(widget.id, e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label=""
            sx={{ m: 0 }}
          />
        </Box>

        <Collapse in={showDetails}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body2">
                  {categoryLabels[widget.category]}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Default Size
                </Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {widget.defaultSize}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Available Sizes
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {widget.availableSizes.map((size) => (
                    <Chip
                      key={size}
                      label={size}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
        <Button
          size="small"
          startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setShowDetails(!showDetails)}
          sx={{ textTransform: 'none' }}
        >
          {showDetails ? 'Less' : 'Details'}
        </Button>
        {isActive ? (
          <Button
            size="small"
            color="error"
            startIcon={<RemoveIcon />}
            onClick={() => onToggle(widget.id, false)}
            sx={{ textTransform: 'none' }}
          >
            Remove
          </Button>
        ) : (
          <Button
            size="small"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => onAdd(widget.id)}
            sx={{ textTransform: 'none' }}
          >
            Add
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function WidgetCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Skeleton variant="rounded" width={40} height={40} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="80%" />
          </Box>
          <Skeleton variant="circular" width={24} height={24} />
        </Box>
      </CardContent>
      <CardActions>
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </CardActions>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WidgetLibrary({
  widgets,
  activeWidgets,
  onToggleWidget,
  onAddWidget,
  selectedCategory = 'all',
  onCategoryChange,
  isLoading = false,
}: WidgetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get active widget IDs
  const activeWidgetIds = useMemo(
    () => new Set(activeWidgets.map((w) => w.widgetId)),
    [activeWidgets]
  );

  // Get unique categories from widgets
  const categories = useMemo(() => {
    const cats = new Set(widgets.map((w) => w.category));
    return ['all', ...Array.from(cats)] as (WidgetCategory | 'all')[];
  }, [widgets]);

  // Filter widgets based on category and search
  const filteredWidgets = useMemo(() => {
    let filtered = widgets;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((w) => w.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [widgets, selectedCategory, searchQuery]);

  // Count by category
  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: widgets.length };
    for (const widget of widgets) {
      counts[widget.category] = (counts[widget.category] || 0) + 1;
    }
    return counts;
  }, [widgets]);

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={48} sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <WidgetCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Widget Library
        </Typography>
        <Tooltip title="Customize your dashboard by adding or removing widgets">
          <IconButton size="small">
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search widgets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onChange={(_, value) => onCategoryChange?.(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {categories.map((cat) => (
          <Tab
            key={cat}
            value={cat}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {categoryLabels[cat]}
                <Chip
                  label={countByCategory[cat] || 0}
                  size="small"
                  sx={{ height: 20, '& .MuiChip-label': { px: 1 } }}
                />
              </Box>
            }
            sx={{ textTransform: 'none' }}
          />
        ))}
      </Tabs>

      {/* Active Widgets Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {activeWidgetIds.size} of {widgets.length} widgets active
        </Typography>
      </Box>

      {/* Widget Grid */}
      {filteredWidgets.length > 0 ? (
        <Grid container spacing={2}>
          {filteredWidgets.map((widget) => (
            <Grid key={widget.id} size={{ xs: 12, md: 6 }}>
              <WidgetCard
                widget={widget}
                isActive={activeWidgetIds.has(widget.id)}
                onToggle={onToggleWidget}
                onAdd={onAddWidget}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No widgets found matching your criteria
          </Typography>
          {searchQuery && (
            <Button
              size="small"
              onClick={() => setSearchQuery('')}
              sx={{ mt: 1 }}
            >
              Clear search
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default WidgetLibrary;
