/**
 * Dependencies Detail Page
 *
 * Comprehensive view of dependency analysis with:
 * - Circular dependency detection and visualization
 * - Dependency graph overview
 * - External vs internal dependency breakdown
 * - File-level dependency exploration
 *
 * Design: Network-style visualization with clear cycle highlighting
 * Aesthetic: Technical depth with interactive exploration
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Collapse,
  IconButton,
  LinearProgress,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Loop as LoopIcon,
  CallMade as ExportIcon,
  CallReceived as ImportIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Folder as FolderIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  ViewList as ListIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

// Layout and data imports
import { DashboardLayout } from './DashboardLayout';
import { useDashboardData } from '../hooks/useDashboardData';

/**
 * Circular dependency chain visualization
 */
const CircularDependencyCard: React.FC<{
  chain: readonly string[];
  index: number;
}> = ({ chain, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: 'hidden',
        borderRadius: 'var(--radius-sm, 8px)',
        border: '1px solid var(--color-error-light, #e57373)',
        backgroundColor: 'var(--color-error-lightest, #ffebee)',
        transition: 'all var(--transition-normal, 200ms) var(--ease-in-out)',
        '&:hover': {
          borderColor: 'var(--color-error, #dc3545)',
          boxShadow: '0 4px 12px rgba(220, 53, 69, 0.15)',
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-full, 9999px)',
            backgroundColor: 'var(--color-error, #dc3545)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 'var(--font-size-body, 14px)',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: 'var(--color-error-dark, #c82829)',
              mb: 0.5,
            }}
          >
            Circular Dependency Cycle
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'var(--color-text-secondary, #666)',
              fontSize: 'var(--font-size-small, 12px)',
            }}
          >
            {chain.length} files involved in this cycle
          </Typography>
        </Box>
        <Chip
          size="small"
          icon={<LoopIcon />}
          label={`${chain.length} files`}
          sx={{
            backgroundColor: 'var(--color-error, #dc3545)',
            color: 'white',
            fontWeight: 600,
            '& .MuiChip-icon': { color: 'white' },
          }}
        />
        <IconButton size="small">
          {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box
          sx={{
            px: 2,
            pb: 2,
            pt: 0,
          }}
        >
          {/* Visual cycle representation */}
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 'var(--radius-sm, 8px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {chain.map((file, idx) => {
              const fileName = file.split('/').pop() || file;
              const isLast = idx === chain.length - 1;

              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 'var(--radius-full, 9999px)',
                        backgroundColor: isLast
                          ? 'var(--color-error, #dc3545)'
                          : 'var(--color-primary, #0066cc)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--font-size-tiny, 11px)',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Tooltip title={file} arrow>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'var(--font-family-mono, monospace)',
                          fontSize: 'var(--font-size-small, 12px)',
                          color: isLast
                            ? 'var(--color-error-dark, #c82829)'
                            : 'var(--color-text-primary, #1a1a1a)',
                          fontWeight: isLast ? 600 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {fileName}
                      </Typography>
                    </Tooltip>
                  </Box>
                  {!isLast && (
                    <ArrowIcon
                      sx={{
                        color: 'var(--color-text-secondary, #666)',
                        fontSize: 18,
                        mx: 1,
                      }}
                    />
                  )}
                  {isLast && (
                    <LoopIcon
                      sx={{
                        color: 'var(--color-error, #dc3545)',
                        fontSize: 18,
                        ml: 1,
                      }}
                    />
                  )}
                </Box>
              );
            })}
            {/* Loop back indicator */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 1,
                borderTop: '1px dashed var(--color-error-light, #e57373)',
                mt: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--color-error, #dc3545)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <LoopIcon sx={{ fontSize: 14 }} />
                Loops back to step 1
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

/**
 * Dependency statistics card
 */
const DependencyStats: React.FC<{
  totalDependencies: number;
  externalDeps: number;
  internalDeps: number;
  circularCount: number;
}> = ({ totalDependencies, externalDeps, internalDeps, circularCount }) => {
  const externalPercentage = totalDependencies > 0 ? (externalDeps / totalDependencies) * 100 : 0;
  const internalPercentage = totalDependencies > 0 ? (internalDeps / totalDependencies) * 100 : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 'var(--radius-md, 12px)',
        border: '1px solid var(--color-border, #e0e0e0)',
        background: 'linear-gradient(135deg, var(--color-background-primary, #fff) 0%, var(--color-background-secondary, #f5f5f5) 100%)',
      }}
    >
      <Typography
        variant="h3"
        sx={{
          fontSize: 'var(--font-size-h4, 16px)',
          fontWeight: 600,
          color: 'var(--color-text-primary, #1a1a1a)',
          mb: 3,
        }}
      >
        Dependency Overview
      </Typography>

      {/* Total dependencies */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography
          variant="h2"
          sx={{
            fontSize: '48px',
            fontWeight: 700,
            color: 'var(--color-primary, #0066cc)',
            fontFamily: 'var(--font-family-mono, monospace)',
            lineHeight: 1,
          }}
        >
          {totalDependencies}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'var(--color-text-secondary, #666)', mt: 0.5 }}
        >
          Total Dependencies
        </Typography>
      </Box>

      {/* External vs Internal */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExportIcon sx={{ color: 'var(--color-info, #17a2b8)', fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              External ({externalDeps})
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'var(--font-family-mono, monospace)',
              color: 'var(--color-info, #17a2b8)',
              fontWeight: 600,
            }}
          >
            {externalPercentage.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={externalPercentage}
          sx={{
            height: 8,
            borderRadius: 'var(--radius-full, 9999px)',
            backgroundColor: alpha('#17a2b8', 0.15),
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'var(--color-info, #17a2b8)',
              borderRadius: 'var(--radius-full, 9999px)',
            },
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImportIcon sx={{ color: 'var(--color-primary, #0066cc)', fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Internal ({internalDeps})
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'var(--font-family-mono, monospace)',
              color: 'var(--color-primary, #0066cc)',
              fontWeight: 600,
            }}
          >
            {internalPercentage.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={internalPercentage}
          sx={{
            height: 8,
            borderRadius: 'var(--radius-full, 9999px)',
            backgroundColor: alpha('#0066cc', 0.15),
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'var(--color-primary, #0066cc)',
              borderRadius: 'var(--radius-full, 9999px)',
            },
          }}
        />
      </Box>

      {/* Circular dependencies indicator */}
      <Box
        sx={{
          p: 2,
          borderRadius: 'var(--radius-sm, 8px)',
          backgroundColor: circularCount > 0
            ? 'var(--color-error-lightest, #ffebee)'
            : 'var(--color-success-lightest, #e7f5e1)',
          border: `1px solid ${circularCount > 0
            ? 'var(--color-error-light, #e57373)'
            : 'var(--color-success-light, #51cf66)'
          }`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {circularCount > 0 ? (
          <WarningIcon sx={{ color: 'var(--color-error, #dc3545)' }} />
        ) : (
          <CheckIcon sx={{ color: 'var(--color-success, #28a745)' }} />
        )}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: circularCount > 0
                ? 'var(--color-error-dark, #c82829)'
                : 'var(--color-success-dark, #1e7e34)',
            }}
          >
            {circularCount > 0
              ? `${circularCount} Circular Dependencies`
              : 'No Circular Dependencies'
            }
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'var(--color-text-secondary, #666)',
              fontSize: 'var(--font-size-small, 12px)',
            }}
          >
            {circularCount > 0
              ? 'Refactoring recommended'
              : 'Clean dependency structure'
            }
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

/**
 * File dependency row with expandable details
 */
const FileDependencyRow: React.FC<{
  filePath: string;
  imports: string[];
  isExpanded: boolean;
  onToggle: () => void;
  inCircular: boolean;
}> = ({ filePath, imports, isExpanded, onToggle, inCircular }) => {
  const fileName = filePath.split('/').pop() || filePath;

  return (
    <>
      <TableRow
        hover
        onClick={onToggle}
        sx={{
          cursor: 'pointer',
          transition: 'background-color var(--transition-fast, 150ms) var(--ease-in-out)',
          ...(inCircular && {
            backgroundColor: alpha('#dc3545', 0.04),
          }),
        }}
      >
        <TableCell sx={{ width: 48 }}>
          <IconButton size="small">
            {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon sx={{ color: 'var(--color-primary, #0066cc)', fontSize: 18 }} />
            <Tooltip title={filePath} arrow>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'var(--font-family-mono, monospace)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary, #1a1a1a)',
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {fileName}
              </Typography>
            </Tooltip>
            {inCircular && (
              <Chip
                size="small"
                icon={<LoopIcon />}
                label="Circular"
                sx={{
                  backgroundColor: 'var(--color-error-lightest, #ffebee)',
                  color: 'var(--color-error-dark, #c82829)',
                  fontWeight: 600,
                  fontSize: 'var(--font-size-tiny, 11px)',
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            )}
          </Box>
        </TableCell>
        <TableCell sx={{ width: 100, textAlign: 'center' }}>
          <Chip
            size="small"
            label={imports.length}
            sx={{
              fontWeight: 600,
              fontSize: 'var(--font-size-small, 12px)',
              fontFamily: 'var(--font-family-mono, monospace)',
            }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={3} sx={{ py: 0, borderBottom: isExpanded ? 1 : 0 }}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'var(--color-background-secondary, #f5f5f5)',
                borderRadius: 'var(--radius-sm, 8px)',
                my: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--color-text-secondary, #666)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  mb: 1,
                }}
              >
                Imports ({imports.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {imports.length > 0 ? (
                  imports.map((imp, idx) => (
                    <Chip
                      key={idx}
                      label={imp}
                      size="small"
                      sx={{
                        fontFamily: 'var(--font-family-mono, monospace)',
                        fontSize: 'var(--font-size-small, 12px)',
                        backgroundColor: imp.startsWith('.')
                          ? 'var(--color-primary-lightest, #e6f2ff)'
                          : 'var(--color-info-lightest, #e1f5fe)',
                        color: imp.startsWith('.')
                          ? 'var(--color-primary-dark, #004099)'
                          : 'var(--color-info-dark, #0097a7)',
                      }}
                    />
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'var(--color-text-tertiary, #999)',
                      fontStyle: 'italic',
                    }}
                  >
                    No imports
                  </Typography>
                )}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

type ViewMode = 'circular' | 'all';

/**
 * Dependencies Page Component
 */
export const DependenciesPage: React.FC = () => {
  // Fetch data using Suspense-enabled hook
  const { data: result } = useDashboardData('/data');
  const dependencyReport = result.data.dependencies;

  // State for filters and view
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('circular');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Get files involved in circular dependencies
  const circularFiles = useMemo(() => {
    if (!dependencyReport?.circular_dependencies) return new Set<string>();
    const files = new Set<string>();
    dependencyReport.circular_dependencies.forEach((chain) => {
      chain.forEach((file) => files.add(file));
    });
    return files;
  }, [dependencyReport?.circular_dependencies]);

  // Filter and prepare file dependencies
  const fileDependencies = useMemo(() => {
    if (!dependencyReport?.dependency_graph) return [];

    return Object.entries(dependencyReport.dependency_graph)
      .map(([file, imports]) => ({
        file,
        imports,
        inCircular: circularFiles.has(file),
      }))
      .filter((item) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return item.file.toLowerCase().includes(query);
        }
        return true;
      })
      .sort((a, b) => {
        // Sort circular files first
        if (a.inCircular && !b.inCircular) return -1;
        if (!a.inCircular && b.inCircular) return 1;
        return b.imports.length - a.imports.length;
      });
  }, [dependencyReport?.dependency_graph, searchQuery, circularFiles]);

  // Paginated files
  const paginatedFiles = useMemo(() => {
    const start = page * rowsPerPage;
    return fileDependencies.slice(start, start + rowsPerPage);
  }, [fileDependencies, page, rowsPerPage]);

  // Handlers
  const handleViewModeChange = useCallback((_: React.MouseEvent<HTMLElement>, newValue: ViewMode | null) => {
    if (newValue) {
      setViewMode(newValue);
    }
  }, []);

  const handleRowToggle = useCallback((file: string) => {
    setExpandedRow((prev) => (prev === file ? null : file));
  }, []);

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
    setExpandedRow(null);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Handle no data state
  if (!dependencyReport) {
    return (
      <DashboardLayout currentPath="/dashboard/dependencies">
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h3" color="text.secondary">
            No dependency report available
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Run the analysis pipeline to generate dependency reports.
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPath="/dashboard/dependencies">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          width: '100%',
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      >
        {/* Page Header */}
        <Box>
          <Typography
            variant="h1"
            sx={{
              fontSize: 'var(--font-size-h2, 24px)',
              fontWeight: 700,
              color: 'var(--color-text-primary, #1a1a1a)',
              letterSpacing: '-0.02em',
              mb: 1,
            }}
          >
            Dependency Analysis
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'var(--color-text-secondary, #666)',
              fontSize: 'var(--font-size-body, 14px)',
            }}
          >
            {dependencyReport.total_dependencies} dependencies analyzed across {Object.keys(dependencyReport.dependency_graph || {}).length} files
          </Typography>
        </Box>

        {/* Stats Card */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
            gap: 2,
          }}
        >
          <DependencyStats
            totalDependencies={dependencyReport.total_dependencies}
            externalDeps={dependencyReport.external_dependencies}
            internalDeps={dependencyReport.internal_dependencies}
            circularCount={dependencyReport.circular_dependencies?.length || 0}
          />

          {/* Circular Dependencies Section */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 'var(--radius-md, 12px)',
              border: '1px solid var(--color-border, #e0e0e0)',
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LoopIcon sx={{ color: 'var(--color-error, #dc3545)' }} />
              <Typography
                variant="h3"
                sx={{
                  fontSize: 'var(--font-size-h4, 16px)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #1a1a1a)',
                }}
              >
                Circular Dependencies
              </Typography>
            </Box>

            {dependencyReport.circular_dependencies?.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dependencyReport.circular_dependencies.map((chain, index) => (
                  <CircularDependencyCard
                    key={index}
                    chain={chain}
                    index={index}
                  />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: 'var(--color-success-lightest, #e7f5e1)',
                  borderRadius: 'var(--radius-sm, 8px)',
                }}
              >
                <CheckIcon sx={{ fontSize: 48, color: 'var(--color-success, #28a745)', mb: 1 }} />
                <Typography
                  variant="h4"
                  sx={{
                    color: 'var(--color-success-dark, #1e7e34)',
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  No Circular Dependencies
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'var(--color-text-secondary, #666)' }}
                >
                  Your codebase has a clean dependency structure
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* View Controls */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 'var(--radius-md, 12px)',
            border: '1px solid var(--color-border, #e0e0e0)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <TextField
              size="small"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'var(--color-text-secondary, #666)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: 250,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 'var(--radius-sm, 8px)',
                },
              }}
            />
          </Box>

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            aria-label="View mode"
          >
            <ToggleButton value="circular" sx={{ color: 'var(--color-error, #dc3545)' }}>
              <LoopIcon sx={{ mr: 0.5, fontSize: 18 }} />
              Circular First
            </ToggleButton>
            <ToggleButton value="all">
              <ListIcon sx={{ mr: 0.5, fontSize: 18 }} />
              All Files
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {/* File Dependencies Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 'var(--radius-md, 12px)',
            border: '1px solid var(--color-border, #e0e0e0)',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 48 }} />
                  <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 100, textAlign: 'center' }}>Imports</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedFiles.map((item) => (
                  <FileDependencyRow
                    key={item.file}
                    filePath={item.file}
                    imports={item.imports}
                    isExpanded={expandedRow === item.file}
                    onToggle={() => handleRowToggle(item.file)}
                    inCircular={item.inCircular}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={fileDependencies.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default DependenciesPage;
