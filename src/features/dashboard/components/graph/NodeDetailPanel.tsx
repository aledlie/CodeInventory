/**
 * NodeDetailPanel Component
 *
 * Displays detailed information about a selected graph node.
 */

import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowUpward as ImportIcon,
  ArrowDownward as ExportIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { GraphNode, DependencyGraph, NodeType } from '../../types/graph';

interface NodeDetailPanelProps {
  node: GraphNode | null;
  graph: DependencyGraph;
  open: boolean;
  onClose: () => void;
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  app: 'Application',
  util: 'Utility',
  service: 'Service',
  config: 'Configuration',
  test: 'Test',
  external: 'External',
};

const NODE_TYPE_COLORS: Record<NodeType, string> = {
  app: '#2196F3',
  util: '#4CAF50',
  service: '#FF9800',
  config: '#9C27B0',
  test: '#607D8B',
  external: '#F44336',
};

export function NodeDetailPanel({ node, graph, open, onClose }: NodeDetailPanelProps) {
  if (!node) return null;

  // Find dependencies (what this node imports)
  const dependencies = graph.edges
    .filter((edge) => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      return sourceId === node.id;
    })
    .map((edge) => {
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      return graph.nodes.find((n) => n.id === targetId);
    })
    .filter(Boolean) as GraphNode[];

  // Find dependents (what imports this node)
  const dependents = graph.edges
    .filter((edge) => {
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      return targetId === node.id;
    })
    .map((edge) => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      return graph.nodes.find((n) => n.id === sourceId);
    })
    .filter(Boolean) as GraphNode[];

  // Find circular chains this node belongs to
  const circularChains = graph.circularChains.filter((chain) =>
    chain.nodes.includes(node.id)
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 360, p: 2 },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" noWrap sx={{ flex: 1 }}>
          {node.label}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Type badge */}
      <Box sx={{ mb: 2 }}>
        <Chip
          label={NODE_TYPE_LABELS[node.type]}
          size="small"
          sx={{
            bgcolor: NODE_TYPE_COLORS[node.type],
            color: '#fff',
          }}
        />
        {node.isCircular && (
          <Chip
            icon={<WarningIcon />}
            label="Circular Dependency"
            size="small"
            color="error"
            sx={{ ml: 1 }}
          />
        )}
      </Box>

      {/* Path */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, wordBreak: 'break-all' }}>
        {node.path}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Metrics */}
      <Typography variant="subtitle2" gutterBottom>
        Metrics
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="h5">{node.metrics.imports}</Typography>
          <Typography variant="caption" color="text.secondary">
            Imports
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="h5">{node.metrics.importedBy}</Typography>
          <Typography variant="caption" color="text.secondary">
            Imported By
          </Typography>
        </Box>
      </Box>

      {/* Circular dependencies warning */}
      {circularChains.length > 0 && (
        <>
          <Typography variant="subtitle2" color="error" gutterBottom>
            Circular Dependencies ({circularChains.length})
          </Typography>
          {circularChains.map((chain) => (
            <Box
              key={chain.id}
              sx={{
                mb: 1,
                p: 1,
                bgcolor: 'error.light',
                borderRadius: 1,
                opacity: 0.2,
              }}
            >
              <Typography variant="caption" color="error.dark">
                Cycle: {chain.nodes.map((n) => n.split('/').pop()).join(' → ')}
              </Typography>
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Dependencies list */}
      <Typography variant="subtitle2" gutterBottom>
        Dependencies ({dependencies.length})
      </Typography>
      {dependencies.length > 0 ? (
        <List dense disablePadding sx={{ mb: 2 }}>
          {dependencies.slice(0, 10).map((dep) => (
            <ListItem key={dep.id} disablePadding>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <ImportIcon fontSize="small" color="action" />
              </ListItemIcon>
              <ListItemText
                primary={dep.label}
                secondary={dep.module}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
          {dependencies.length > 10 && (
            <Typography variant="caption" color="text.secondary">
              +{dependencies.length - 10} more
            </Typography>
          )}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No dependencies
        </Typography>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Dependents list */}
      <Typography variant="subtitle2" gutterBottom>
        Imported By ({dependents.length})
      </Typography>
      {dependents.length > 0 ? (
        <List dense disablePadding>
          {dependents.slice(0, 10).map((dep) => (
            <ListItem key={dep.id} disablePadding>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <ExportIcon fontSize="small" color="action" />
              </ListItemIcon>
              <ListItemText
                primary={dep.label}
                secondary={dep.module}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
          {dependents.length > 10 && (
            <Typography variant="caption" color="text.secondary">
              +{dependents.length - 10} more
            </Typography>
          )}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Not imported by any file
        </Typography>
      )}
    </Drawer>
  );
}

export default NodeDetailPanel;
