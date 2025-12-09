/**
 * SavedViewsDropdown Component
 *
 * Phase 5B: Dashboard Personalization
 * Dropdown for managing and switching between saved dashboard views
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Chip,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckIcon from '@mui/icons-material/Check';
import type { SavedViewsDropdownProps, SavedView } from '../../types';

// ============================================================================
// Create/Edit View Dialog
// ============================================================================

interface ViewDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialName?: string;
  initialDescription?: string;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => void;
  isLoading?: boolean;
}

function ViewDialog({
  open,
  mode,
  initialName = '',
  initialDescription = '',
  onClose,
  onSubmit,
  isLoading = false,
}: ViewDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [nameError, setNameError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError('View name is required');
      return;
    }
    onSubmit(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    setNameError('');
  };

  const handleClose = () => {
    setName(initialName);
    setDescription(initialDescription);
    setNameError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Create New View' : 'Edit View'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="View Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError('');
          }}
          error={!!nameError}
          helperText={nameError}
          margin="normal"
          placeholder="e.g., Development Overview"
        />
        <TextField
          fullWidth
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={2}
          placeholder="Describe this dashboard view..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !name.trim()}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
        >
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// Delete Confirmation Dialog
// ============================================================================

interface DeleteDialogProps {
  open: boolean;
  viewName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

function DeleteDialog({
  open,
  viewName,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete View</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete the view "{viewName}"? This action
          cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SavedViewsDropdown({
  views,
  activeViewId,
  onSelectView,
  onCreateView,
  onDeleteView,
  onRenameView,
  onShareView,
  onSetDefault,
  isLoading = false,
}: SavedViewsDropdownProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingView, setEditingView] = useState<SavedView | null>(null);
  const [deletingView, setDeletingView] = useState<SavedView | null>(null);

  const open = Boolean(anchorEl);
  const activeView = views.find((v) => v.id === activeViewId);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectView = useCallback(
    (viewId: string) => {
      onSelectView(viewId);
      handleClose();
    },
    [onSelectView]
  );

  const handleCreateView = useCallback(
    (name: string, description?: string) => {
      onCreateView(name, description);
      setCreateDialogOpen(false);
    },
    [onCreateView]
  );

  const handleEditClick = useCallback(
    (view: SavedView, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingView(view);
      setEditDialogOpen(true);
      handleClose();
    },
    []
  );

  const handleRenameView = useCallback(
    (name: string, _description?: string) => {
      if (editingView) {
        onRenameView(editingView.id, name);
        setEditDialogOpen(false);
        setEditingView(null);
      }
    },
    [editingView, onRenameView]
  );

  const handleDeleteClick = useCallback(
    (view: SavedView, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeletingView(view);
      setDeleteDialogOpen(true);
      handleClose();
    },
    []
  );

  const handleConfirmDelete = useCallback(() => {
    if (deletingView) {
      onDeleteView(deletingView.id);
      setDeleteDialogOpen(false);
      setDeletingView(null);
    }
  }, [deletingView, onDeleteView]);

  const handleSetDefault = useCallback(
    (viewId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onSetDefault(viewId);
    },
    [onSetDefault]
  );

  const handleShareClick = useCallback(
    (viewId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onShareView?.(viewId);
      handleClose();
    },
    [onShareView]
  );

  return (
    <>
      {/* Dropdown Button */}
      <Button
        variant="outlined"
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        startIcon={<DashboardIcon />}
        disabled={isLoading}
        sx={{
          minWidth: 180,
          justifyContent: 'space-between',
          textTransform: 'none',
          borderColor: theme.palette.divider,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="body2"
            noWrap
            sx={{ maxWidth: 120 }}
          >
            {activeView?.name || 'Select View'}
          </Typography>
          {activeView?.isDefault && (
            <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
          )}
        </Box>
      </Button>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 280, maxWidth: 360 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Views List */}
        {views.length > 0 ? (
          views.map((view) => (
            <MenuItem
              key={view.id}
              onClick={() => handleSelectView(view.id)}
              selected={view.id === activeViewId}
              sx={{
                py: 1,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {view.id === activeViewId ? (
                  <CheckIcon color="primary" fontSize="small" />
                ) : (
                  <DashboardIcon fontSize="small" color="action" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                      {view.name}
                    </Typography>
                    {view.isDefault && (
                      <Chip
                        label="Default"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          height: 18,
                          '& .MuiChip-label': { px: 0.5, fontSize: 10 },
                        }}
                      />
                    )}
                    {view.isShared && (
                      <Chip
                        label="Shared"
                        size="small"
                        sx={{
                          height: 18,
                          '& .MuiChip-label': { px: 0.5, fontSize: 10 },
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  view.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: 'block', maxWidth: 160 }}
                    >
                      {view.description}
                    </Typography>
                  )
                }
              />
              <Box
                sx={{
                  display: 'flex',
                  ml: 1,
                  opacity: 0.6,
                  '&:hover': { opacity: 1 },
                }}
              >
                <Tooltip title={view.isDefault ? 'Default view' : 'Set as default'}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleSetDefault(view.id, e)}
                    disabled={view.isDefault}
                  >
                    {view.isDefault ? (
                      <StarIcon fontSize="small" color="warning" />
                    ) : (
                      <StarBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit view">
                  <IconButton
                    size="small"
                    onClick={(e) => handleEditClick(view, e)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {onShareView && (
                  <Tooltip title="Share view">
                    <IconButton
                      size="small"
                      onClick={(e) => handleShareClick(view.id, e)}
                    >
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete view">
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteClick(view, e)}
                    disabled={views.length === 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No saved views
            </Typography>
          </MenuItem>
        )}

        <Divider />

        {/* Create New View */}
        <MenuItem onClick={() => setCreateDialogOpen(true)}>
          <ListItemIcon>
            <AddIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" color="primary">
                Create New View
              </Typography>
            }
          />
        </MenuItem>
      </Menu>

      {/* Create View Dialog */}
      <ViewDialog
        open={createDialogOpen}
        mode="create"
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateView}
        isLoading={isLoading}
      />

      {/* Edit View Dialog */}
      <ViewDialog
        open={editDialogOpen}
        mode="edit"
        initialName={editingView?.name || ''}
        initialDescription={editingView?.description || ''}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingView(null);
        }}
        onSubmit={handleRenameView}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        viewName={deletingView?.name || ''}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingView(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </>
  );
}

export default SavedViewsDropdown;
