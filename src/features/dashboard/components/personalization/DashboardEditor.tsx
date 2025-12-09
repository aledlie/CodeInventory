/**
 * DashboardEditor Component
 *
 * Phase 5B: Dashboard Personalization
 * Full-featured dashboard editor with drag-and-drop widget management
 */

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Chip,
  Drawer,
  useTheme,
  alpha,
  Fab,
  Zoom,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
import type {
  DashboardEditorProps,
  WidgetConfig,
  WidgetMetadata,
  WidgetSize,
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

const sizeToGridSpan: Record<WidgetSize, number> = {
  small: 1,
  medium: 1,
  large: 2,
  full: 2,
};

// ============================================================================
// Sortable Widget Item
// ============================================================================

interface SortableWidgetProps {
  widget: WidgetConfig;
  metadata: WidgetMetadata | undefined;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onResize: (size: WidgetSize) => void;
}

function SortableWidget({
  widget,
  metadata,
  isEditMode,
  isSelected,
  onSelect,
  onRemove,
  onResize,
}: SortableWidgetProps) {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.instanceId, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const IconComponent = metadata
    ? iconMap[metadata.icon] || AssessmentIcon
    : AssessmentIcon;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleResize = (size: WidgetSize) => {
    onResize(size);
    handleMenuClose();
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        gridColumn: `span ${sizeToGridSpan[widget.size]}`,
        position: 'relative',
      }}
    >
      <Paper
        elevation={isSelected ? 4 : 1}
        onClick={isEditMode ? onSelect : undefined}
        sx={{
          p: 2,
          height: '100%',
          minHeight: 150,
          cursor: isEditMode ? 'pointer' : 'default',
          border: isSelected
            ? `2px solid ${theme.palette.primary.main}`
            : `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create(['border-color', 'box-shadow']),
          '&:hover': isEditMode
            ? {
                borderColor: theme.palette.primary.light,
                boxShadow: theme.shadows[4],
              }
            : {},
          opacity: widget.visible ? 1 : 0.5,
        }}
      >
        {/* Drag Handle (Edit Mode) */}
        {isEditMode && (
          <Box
            {...attributes}
            {...listeners}
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              cursor: 'grab',
              color: 'action.active',
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
        )}

        {/* Widget Actions (Edit Mode) */}
        {isEditMode && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
            }}
          >
            <Tooltip title="Widget options">
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Widget Content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            pt: isEditMode ? 3 : 0,
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              mb: 1,
            }}
          >
            <IconComponent
              sx={{ fontSize: 32, color: theme.palette.primary.main }}
            />
          </Box>
          <Typography variant="subtitle2" fontWeight={600} textAlign="center">
            {metadata?.name || widget.widgetId}
          </Typography>
          {metadata && (
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              sx={{ mt: 0.5 }}
            >
              {metadata.description}
            </Typography>
          )}
          {isEditMode && (
            <Chip
              label={widget.size}
              size="small"
              sx={{ mt: 1, textTransform: 'capitalize' }}
            />
          )}
        </Box>

        {/* Widget Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            <ListItemText
              primary="Resize Widget"
              secondary="Select a size"
            />
          </MenuItem>
          <Divider />
          {metadata?.availableSizes.map((size) => (
            <MenuItem
              key={size}
              onClick={() => handleResize(size)}
              selected={widget.size === size}
            >
              <ListItemIcon>
                <AspectRatioIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText sx={{ textTransform: 'capitalize' }}>
                {size}
              </ListItemText>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={onRemove}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Remove Widget</ListItemText>
          </MenuItem>
        </Menu>
      </Paper>
    </Box>
  );
}

// ============================================================================
// Widget Palette Drawer
// ============================================================================

interface WidgetPaletteProps {
  open: boolean;
  onClose: () => void;
  widgets: WidgetMetadata[];
  activeWidgetIds: Set<string>;
  onAddWidget: (widgetId: string) => void;
}

function WidgetPalette({
  open,
  onClose,
  widgets,
  activeWidgetIds,
  onAddWidget,
}: WidgetPaletteProps) {
  const theme = useTheme();

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 300, p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Add Widget</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {widgets.map((widget) => {
            const IconComponent = iconMap[widget.icon] || AssessmentIcon;
            const isActive = activeWidgetIds.has(widget.id);

            return (
              <Paper
                key={widget.id}
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  opacity: isActive ? 0.5 : 1,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
                onClick={() => !isActive && onAddWidget(widget.id)}
              >
                <Box
                  sx={{
                    p: 0.75,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <IconComponent
                    sx={{ fontSize: 20, color: theme.palette.primary.main }}
                  />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {widget.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {widget.category}
                  </Typography>
                </Box>
                {isActive ? (
                  <Chip label="Active" size="small" />
                ) : (
                  <AddIcon color="action" fontSize="small" />
                )}
              </Paper>
            );
          })}
        </Box>
      </Box>
    </Drawer>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DashboardEditor({
  layout,
  availableWidgets,
  onLayoutChange,
  onSave,
  onCancel,
  mode,
  onModeChange,
  isSaving = false,
}: DashboardEditorProps) {
  const theme = useTheme();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<typeof layout[]>([]);
  const [redoStack, setRedoStack] = useState<typeof layout[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get metadata for widgets
  const widgetMetadataMap = useMemo(() => {
    const map = new Map<string, WidgetMetadata>();
    for (const w of availableWidgets) {
      map.set(w.id, w);
    }
    return map;
  }, [availableWidgets]);

  // Get active widget IDs
  const activeWidgetIds = useMemo(
    () => new Set(layout.widgets.map((w) => w.widgetId)),
    [layout.widgets]
  );

  // Sorted widgets for rendering
  const sortedWidgets = useMemo(() => {
    return [...layout.widgets].sort((a, b) => {
      if (a.position.row !== b.position.row) {
        return a.position.row - b.position.row;
      }
      return a.position.column - b.position.column;
    });
  }, [layout.widgets]);

  // Save current state to undo stack
  const saveToUndoStack = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-19), layout]);
    setRedoStack([]);
  }, [layout]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      saveToUndoStack();

      const oldIndex = sortedWidgets.findIndex(
        (w) => w.instanceId === active.id
      );
      const newIndex = sortedWidgets.findIndex(
        (w) => w.instanceId === over.id
      );

      const newWidgets = arrayMove(sortedWidgets, oldIndex, newIndex).map(
        (widget, index) => ({
          ...widget,
          position: {
            row: Math.floor(index / layout.grid.columns),
            column: index % layout.grid.columns,
          },
        })
      );

      onLayoutChange({
        ...layout,
        widgets: newWidgets,
      });
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousLayout = undoStack[undoStack.length - 1];
      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, layout]);
      onLayoutChange(previousLayout);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextLayout = redoStack[redoStack.length - 1];
      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => [...prev, layout]);
      onLayoutChange(nextLayout);
    }
  };

  // Handle add widget
  const handleAddWidget = (widgetId: string) => {
    saveToUndoStack();

    const metadata = widgetMetadataMap.get(widgetId);
    if (!metadata) return;

    const newWidget: WidgetConfig = {
      instanceId: `${widgetId}-${Date.now()}`,
      widgetId: widgetId as WidgetConfig['widgetId'],
      visible: true,
      size: metadata.defaultSize,
      position: {
        row: Math.floor(layout.widgets.length / layout.grid.columns),
        column: layout.widgets.length % layout.grid.columns,
      },
      settings: {},
    };

    onLayoutChange({
      ...layout,
      widgets: [...layout.widgets, newWidget],
    });
  };

  // Handle remove widget
  const handleRemoveWidget = (instanceId: string) => {
    saveToUndoStack();
    onLayoutChange({
      ...layout,
      widgets: layout.widgets.filter((w) => w.instanceId !== instanceId),
    });
    if (selectedWidgetId === instanceId) {
      setSelectedWidgetId(null);
    }
  };

  // Handle resize widget
  const handleResizeWidget = (instanceId: string, size: WidgetSize) => {
    saveToUndoStack();
    onLayoutChange({
      ...layout,
      widgets: layout.widgets.map((w) =>
        w.instanceId === instanceId ? { ...w, size } : w
      ),
    });
  };

  const isEditMode = mode === 'edit';

  return (
    <Box sx={{ position: 'relative', minHeight: 400 }}>
      {/* Editor Toolbar */}
      <Paper
        elevation={2}
        sx={{
          mb: 2,
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Dashboard Editor
          </Typography>
          <Chip
            label={isEditMode ? 'Editing' : 'Viewing'}
            size="small"
            color={isEditMode ? 'primary' : 'default'}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditMode && (
            <>
              <Tooltip title="Undo">
                <span>
                  <IconButton
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    size="small"
                  >
                    <UndoIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Redo">
                <span>
                  <IconButton
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    size="small"
                  >
                    <RedoIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            </>
          )}

          {isEditMode ? (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={onCancel}
                startIcon={<CloseIcon />}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={onSave}
                startIcon={<SaveIcon />}
                disabled={isSaving}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              size="small"
              onClick={() => onModeChange('edit')}
              startIcon={<EditIcon />}
            >
              Edit Layout
            </Button>
          )}
        </Box>
      </Paper>

      {/* Widget Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedWidgets.map((w) => w.instanceId)}
          strategy={rectSortingStrategy}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${layout.grid.columns}, 1fr)`,
              gap: `${layout.grid.gap}px`,
              p: `${layout.grid.padding}px`,
              bgcolor: isEditMode
                ? alpha(theme.palette.primary.main, 0.02)
                : 'transparent',
              borderRadius: 2,
              border: isEditMode
                ? `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`
                : 'none',
              minHeight: 300,
            }}
          >
            <AnimatePresence>
              {sortedWidgets.map((widget) => (
                <motion.div
                  key={widget.instanceId}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'contents' }}
                >
                  <SortableWidget
                    widget={widget}
                    metadata={widgetMetadataMap.get(widget.widgetId)}
                    isEditMode={isEditMode}
                    isSelected={selectedWidgetId === widget.instanceId}
                    onSelect={() => setSelectedWidgetId(widget.instanceId)}
                    onRemove={() => handleRemoveWidget(widget.instanceId)}
                    onResize={(size) =>
                      handleResizeWidget(widget.instanceId, size)
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        </SortableContext>

        <DragOverlay>
          {activeId && (
            <Paper
              elevation={8}
              sx={{
                p: 2,
                minHeight: 150,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              <Typography variant="subtitle2">Moving widget...</Typography>
            </Paper>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add Widget FAB (Edit Mode) */}
      <Zoom in={isEditMode}>
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => setPaletteOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Zoom>

      {/* Widget Palette Drawer */}
      <WidgetPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        widgets={availableWidgets}
        activeWidgetIds={activeWidgetIds}
        onAddWidget={handleAddWidget}
      />
    </Box>
  );
}

export default DashboardEditor;
