/**
 * VisualizationBuilder Component
 *
 * Main component for the drag-and-drop visualization builder.
 * Combines sidebar controls with a live preview canvas.
 */

import { useState, useCallback, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as NewIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';
import { BuilderSidebar } from './BuilderSidebar';
import { BuilderCanvas } from './BuilderCanvas';
import {
  useVisualization,
  useCreateVisualization,
  useSaveVisualization,
  useExportVisualization,
} from '../../hooks/useVisualization';
import type { VisualizationConfig, ExportFormat } from '../../types/visualizations';

/**
 * Props for VisualizationBuilder
 */
export interface VisualizationBuilderProps {
  /** ID of visualization to edit (null for new) */
  visualizationId?: string | null;
  /** Callback when save completes */
  onSave?: (config: VisualizationConfig) => void;
  /** Callback when cancelled */
  onCancel?: () => void;
}

/**
 * Loading skeleton
 */
function BuilderSkeleton() {
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 200px)', gap: 2, p: 2 }}>
      <Skeleton variant="rectangular" width={280} height="100%" />
      <Skeleton variant="rectangular" sx={{ flex: 1 }} height="100%" />
    </Box>
  );
}

/**
 * Export dialog
 */
function ExportDialog({
  open,
  onClose,
  onExport,
}: {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Export Visualization</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Choose an export format:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
          <Button variant="outlined" onClick={() => onExport('png')}>
            PNG Image
          </Button>
          <Button variant="outlined" onClick={() => onExport('svg')}>
            SVG Vector
          </Button>
          <Button variant="outlined" onClick={() => onExport('pdf')}>
            PDF Document
          </Button>
          <Button variant="outlined" onClick={() => onExport('json')}>
            JSON Config
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * VisualizationBuilder content
 */
function VisualizationBuilderContent({
  visualizationId,
  onSave,
}: VisualizationBuilderProps) {
  // Fetch existing visualization or create new one
  const { data: existingViz } = useVisualization(visualizationId ?? null);
  const { mutate: createViz, isPending: isCreating } = useCreateVisualization();
  const { mutate: saveViz, isPending: isSaving } = useSaveVisualization();
  const { mutate: exportViz } = useExportVisualization();

  // Local state
  const [config, setConfig] = useState<VisualizationConfig | null>(
    existingViz ?? null
  );
  const [isDirty, setIsDirty] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Initialize config when visualization loads
  if (existingViz && !config) {
    setConfig(existingViz);
  }

  // Handle creating new visualization
  const handleCreate = useCallback(() => {
    createViz(undefined, {
      onSuccess: (newViz) => {
        setConfig(newViz);
        setIsDirty(false);
      },
    });
  }, [createViz]);

  // Handle config changes
  const handleConfigChange = useCallback((newConfig: VisualizationConfig) => {
    setConfig(newConfig);
    setIsDirty(true);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (!config) return;
    saveViz(config, {
      onSuccess: (savedViz) => {
        setIsDirty(false);
        setSnackbar({
          open: true,
          message: 'Visualization saved successfully',
          severity: 'success',
        });
        onSave?.(savedViz);
      },
      onError: () => {
        setSnackbar({
          open: true,
          message: 'Failed to save visualization',
          severity: 'error',
        });
      },
    });
  }, [config, saveViz, onSave]);

  // Handle export
  const handleExport = useCallback(
    (format: ExportFormat) => {
      if (!config) return;
      setExportDialogOpen(false);

      if (format === 'json') {
        // Download JSON directly
        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.title.replace(/\s+/g, '-').toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Use export API for other formats
        exportViz(
          { id: config.id, options: { format } },
          {
            onSuccess: (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${config.title.replace(/\s+/g, '-').toLowerCase()}.${format}`;
                a.click();
                URL.revokeObjectURL(url);
              }
            },
          }
        );
      }
    },
    [config, exportViz]
  );

  // No visualization yet - show create prompt
  if (!config) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 400,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h5" gutterBottom>
            Create a Custom Visualization
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Build interactive charts to visualize your code metrics.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<NewIcon />}
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create New Visualization'}
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Visualization Builder</Typography>
          {isDirty && (
            <Typography variant="caption" color="warning.main">
              (unsaved changes)
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DuplicateIcon />}
            onClick={handleCreate}
          >
            New
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      {/* Builder area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <BuilderSidebar
          config={config}
          onChange={handleConfigChange}
        />
        <BuilderCanvas
          config={config}
          onExport={() => setExportDialogOpen(true)}
        />
      </Box>

      {/* Export dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/**
 * VisualizationBuilder with Suspense
 */
export function VisualizationBuilder(props: VisualizationBuilderProps) {
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <VisualizationBuilderContent {...props} />
    </Suspense>
  );
}

export default VisualizationBuilder;
