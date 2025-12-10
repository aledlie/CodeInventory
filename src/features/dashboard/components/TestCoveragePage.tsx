/**
 * Test Coverage Detail Page
 *
 * Comprehensive view of test coverage analysis with:
 * - Coverage percentage visualization
 * - Untested functions list with file grouping
 * - Function search and filtering
 * - Async function indicator
 *
 * Design: Clean analytical dashboard with focus on actionable insights
 * Aesthetic: Precise metrics with clear call-to-action styling
 */

import { useState, useMemo, useCallback } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
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
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Folder as FolderIcon,
  FilterList as FilterIcon,
  ViewList as ListIcon,
  Functions as FunctionIcon,
  Speed as AsyncIcon,
  Link as LinkIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// Layout and data imports
import { DashboardLayout } from './DashboardLayout';
import { useDashboardData } from '../hooks/useDashboardData';
import type { PythonFunctionInfo } from '../types';

type FilterMode = 'all' | 'tested' | 'untested';
type ViewMode = 'list' | 'grouped';

/**
 * Coverage gauge component - circular progress indicator
 */
function CoverageGauge({ percentage, testedFunctions, totalFunctions }: {
  percentage: number;
  testedFunctions: number;
  totalFunctions: number;
}) {
  // Determine color based on coverage
  const getColor = (pct: number) => {
    if (pct >= 80) return 'var(--color-success, #28a745)';
    if (pct >= 60) return 'var(--color-warning, #ff9800)';
    return 'var(--color-error, #dc3545)';
  };

  const color = getColor(percentage);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 'var(--radius-md, 12px)',
        border: '1px solid var(--color-border, #e0e0e0)',
        background: 'linear-gradient(135deg, var(--color-background-primary, #fff) 0%, var(--color-background-secondary, #f5f5f5) 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {/* Circular Gauge */}
      <Box sx={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--color-border, #e0e0e0)"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            style={{
              transition: 'stroke-dashoffset 1s var(--ease-out)',
            }}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: '28px',
              fontWeight: 700,
              color,
              lineHeight: 1,
              fontFamily: 'var(--font-family-mono, monospace)',
            }}
          >
            {percentage.toFixed(1)}%
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h3"
          sx={{
            fontSize: 'var(--font-size-h4, 16px)',
            fontWeight: 600,
            color: 'var(--color-text-primary, #1a1a1a)',
            mb: 2,
          }}
        >
          Test Coverage
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ color: 'var(--color-success, #28a745)', fontSize: 20 }} />
            <Typography variant="body2">
              <strong>{testedFunctions}</strong> tested functions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CancelIcon sx={{ color: 'var(--color-error, #dc3545)', fontSize: 20 }} />
            <Typography variant="body2">
              <strong>{totalFunctions - testedFunctions}</strong> untested functions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FunctionIcon sx={{ color: 'var(--color-primary, #0066cc)', fontSize: 20 }} />
            <Typography variant="body2">
              <strong>{totalFunctions}</strong> total functions
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

/**
 * Action card for untested functions summary
 */
function ActionCard({ untestedCount, topFiles }: {
  untestedCount: number;
  topFiles: { file: string; count: number }[];
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 'var(--radius-md, 12px)',
        border: '1px solid var(--color-border, #e0e0e0)',
        background: untestedCount > 0
          ? 'linear-gradient(135deg, var(--color-warning-lightest, #fff3e0) 0%, var(--color-background-primary, #fff) 100%)'
          : 'linear-gradient(135deg, var(--color-success-lightest, #e7f5e1) 0%, var(--color-background-primary, #fff) 100%)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        {untestedCount > 0 ? (
          <WarningIcon sx={{ color: 'var(--color-warning-dark, #d97706)', fontSize: 28 }} />
        ) : (
          <TrendingUpIcon sx={{ color: 'var(--color-success-dark, #1e7e34)', fontSize: 28 }} />
        )}
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontSize: 'var(--font-size-h4, 16px)',
              fontWeight: 600,
              color: untestedCount > 0
                ? 'var(--color-warning-dark, #d97706)'
                : 'var(--color-success-dark, #1e7e34)',
              mb: 0.5,
            }}
          >
            {untestedCount > 0 ? 'Coverage Opportunities' : 'Excellent Coverage!'}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'var(--color-text-secondary, #666)' }}
          >
            {untestedCount > 0
              ? `${untestedCount} functions need test coverage`
              : 'All functions have test coverage'}
          </Typography>
        </Box>
      </Box>

      {untestedCount > 0 && topFiles.length > 0 && (
        <>
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
            Priority Files
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {topFiles.slice(0, 5).map(({ file, count }) => (
              <Box
                key={file}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: 'var(--radius-xs, 4px)',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'var(--font-family-mono, monospace)',
                    fontSize: 'var(--font-size-small, 12px)',
                    color: 'var(--color-text-primary, #1a1a1a)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                  }}
                >
                  {file.split('/').pop()}
                </Typography>
                <Chip
                  size="small"
                  label={`${count} untested`}
                  sx={{
                    backgroundColor: 'var(--color-warning-lightest, #fff3e0)',
                    color: 'var(--color-warning-dark, #d97706)',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-tiny, 11px)',
                  }}
                />
              </Box>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
};

/**
 * Function row component
 */
function FunctionRow({ func }: {
  func: PythonFunctionInfo;
}) {
  return (
    <TableRow
      hover
      sx={{
        transition: 'background-color var(--transition-fast, 150ms) var(--ease-in-out)',
        '&:hover': {
          backgroundColor: func.is_tested
            ? alpha('#28a745', 0.04)
            : alpha('#dc3545', 0.04),
        },
      }}
    >
      <TableCell sx={{ width: 100 }}>
        <Chip
          size="small"
          icon={func.is_tested ? <CheckCircleIcon /> : <CancelIcon />}
          label={func.is_tested ? 'Tested' : 'Untested'}
          sx={{
            backgroundColor: func.is_tested
              ? 'var(--color-success-lightest, #e7f5e1)'
              : 'var(--color-error-lightest, #ffebee)',
            color: func.is_tested
              ? 'var(--color-success-dark, #1e7e34)'
              : 'var(--color-error-dark, #c82829)',
            fontWeight: 600,
            fontSize: 'var(--font-size-tiny, 11px)',
            '& .MuiChip-icon': {
              color: 'inherit',
            },
          }}
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FunctionIcon sx={{ color: 'var(--color-primary, #0066cc)', fontSize: 18 }} />
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'var(--font-family-mono, monospace)',
              fontWeight: 600,
              color: 'var(--color-text-primary, #1a1a1a)',
            }}
          >
            {func.name}
          </Typography>
          {func.is_async && (
            <Tooltip title="Async function" arrow>
              <Chip
                size="small"
                icon={<AsyncIcon />}
                label="async"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: 'var(--font-size-tiny, 11px)',
                  '& .MuiChip-icon': {
                    fontSize: 14,
                  },
                }}
              />
            </Tooltip>
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Tooltip title={func.file_path} arrow>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'var(--font-family-mono, monospace)',
              fontSize: 'var(--font-size-small, 12px)',
              color: 'var(--color-text-secondary, #666)',
              maxWidth: 250,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {func.file_path.split('/').pop()}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ width: 60, textAlign: 'right' }}>
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'var(--font-family-mono, monospace)',
            fontSize: 'var(--font-size-small, 12px)',
            color: 'var(--color-primary, #0066cc)',
            fontWeight: 600,
          }}
        >
          L{func.line_number}
        </Typography>
      </TableCell>
      <TableCell>
        {func.test_file ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LinkIcon sx={{ color: 'var(--color-success, #28a745)', fontSize: 16 }} />
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'var(--font-family-mono, monospace)',
                fontSize: 'var(--font-size-small, 12px)',
                color: 'var(--color-success-dark, #1e7e34)',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {func.test_file.split('/').pop()}
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: 'var(--color-text-tertiary, #999)',
              fontStyle: 'italic',
              fontSize: 'var(--font-size-small, 12px)',
            }}
          >
            No test file
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
};

/**
 * Test Coverage Page Component
 */
export function TestCoveragePage() {
  // Fetch data using Suspense-enabled hook
  const { data: result } = useDashboardData('/data');
  const coverageReport = result.data.coverage;

  // State for filters and view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filter functions based on search and filter mode
  const filteredFunctions = useMemo(() => {
    if (!coverageReport?.functions) return [];

    return coverageReport.functions.filter((func) => {
      // Coverage filter
      if (filterMode === 'tested' && !func.is_tested) return false;
      if (filterMode === 'untested' && func.is_tested) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          func.name.toLowerCase().includes(query) ||
          func.file_path.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [coverageReport?.functions, filterMode, searchQuery]);

  // Group functions by file for grouped view
  const groupedFunctions = useMemo(() => {
    const groups: Record<string, PythonFunctionInfo[]> = {};
    filteredFunctions.forEach((func) => {
      if (!groups[func.file_path]) {
        groups[func.file_path] = [];
      }
      groups[func.file_path].push(func);
    });
    return groups;
  }, [filteredFunctions]);

  // Calculate top files with untested functions
  const topUntestedFiles = useMemo(() => {
    if (!coverageReport?.functions) return [];

    const fileCounts: Record<string, number> = {};
    coverageReport.functions.forEach((func) => {
      if (!func.is_tested) {
        fileCounts[func.file_path] = (fileCounts[func.file_path] || 0) + 1;
      }
    });

    return Object.entries(fileCounts)
      .map(([file, count]) => ({ file, count }))
      .sort((a, b) => b.count - a.count);
  }, [coverageReport?.functions]);

  // Paginated functions for list view
  const paginatedFunctions = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredFunctions.slice(start, start + rowsPerPage);
  }, [filteredFunctions, page, rowsPerPage]);

  // Handlers
  const handleFilterChange = useCallback((_: MouseEvent<HTMLElement>, newValue: FilterMode | null) => {
    if (newValue) {
      setFilterMode(newValue);
      setPage(0);
    }
  }, []);

  const handleViewModeChange = useCallback((_: MouseEvent<HTMLElement>, newValue: ViewMode | null) => {
    if (newValue) {
      setViewMode(newValue);
    }
  }, []);

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Handle no data state
  if (!coverageReport) {
    return (
      <DashboardLayout currentPath="/dashboard/coverage">
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h3" color="text.secondary">
            No coverage report available
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Run the analysis pipeline to generate coverage reports.
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPath="/dashboard/coverage">
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
            Test Coverage Analysis
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'var(--color-text-secondary, #666)',
              fontSize: 'var(--font-size-body, 14px)',
            }}
          >
            {coverageReport.tested_functions} of {coverageReport.total_functions} functions have test coverage
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          <CoverageGauge
            percentage={coverageReport.coverage_percentage}
            testedFunctions={coverageReport.tested_functions}
            totalFunctions={coverageReport.total_functions}
          />
          <ActionCard
            untestedCount={coverageReport.untested_functions}
            topFiles={topUntestedFiles}
          />
        </Box>

        {/* Filters and Controls */}
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
              placeholder="Search functions..."
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

            {/* Coverage Filter */}
            <ToggleButtonGroup
              value={filterMode}
              exclusive
              onChange={handleFilterChange}
              size="small"
              aria-label="Filter by coverage"
            >
              <ToggleButton value="all">
                <FilterIcon sx={{ mr: 0.5, fontSize: 18 }} />
                All
              </ToggleButton>
              <ToggleButton value="tested" sx={{ color: 'var(--color-success, #28a745)' }}>
                <CheckCircleIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Tested
              </ToggleButton>
              <ToggleButton value="untested" sx={{ color: 'var(--color-error, #dc3545)' }}>
                <CancelIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Untested
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            aria-label="View mode"
          >
            <ToggleButton value="list">
              <ListIcon sx={{ mr: 0.5, fontSize: 18 }} />
              List
            </ToggleButton>
            <ToggleButton value="grouped">
              <FolderIcon sx={{ mr: 0.5, fontSize: 18 }} />
              By File
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {/* Functions Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 'var(--radius-md, 12px)',
            border: '1px solid var(--color-border, #e0e0e0)',
            overflow: 'hidden',
          }}
        >
          {viewMode === 'list' ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: 100 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Function</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 60, textAlign: 'right' }}>Line</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Test File</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedFunctions.map((func, index) => (
                      <FunctionRow
                        key={`${func.file_path}-${func.name}-${index}`}
                        func={func}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredFunctions.length}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          ) : (
            /* Grouped View */
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.entries(groupedFunctions).map(([filePath, functions]) => {
                const testedCount = functions.filter(f => f.is_tested).length;
                const filePercentage = (testedCount / functions.length) * 100;

                return (
                  <Paper
                    key={filePath}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 'var(--radius-sm, 8px)',
                      border: '1px solid var(--color-border-subtle, #f0f0f0)',
                      backgroundColor: 'var(--color-background-secondary, #f5f5f5)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <FolderIcon sx={{ color: 'var(--color-primary, #0066cc)' }} />
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: 'var(--font-family-mono, monospace)',
                          fontSize: 'var(--font-size-body, 14px)',
                          fontWeight: 600,
                          color: 'var(--color-text-primary, #1a1a1a)',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {filePath}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${filePercentage.toFixed(0)}%`}
                        sx={{
                          backgroundColor: filePercentage >= 80
                            ? 'var(--color-success-lightest, #e7f5e1)'
                            : filePercentage >= 60
                              ? 'var(--color-warning-lightest, #fff3e0)'
                              : 'var(--color-error-lightest, #ffebee)',
                          color: filePercentage >= 80
                            ? 'var(--color-success-dark, #1e7e34)'
                            : filePercentage >= 60
                              ? 'var(--color-warning-dark, #d97706)'
                              : 'var(--color-error-dark, #c82829)',
                          fontWeight: 600,
                          fontSize: 'var(--font-size-tiny, 11px)',
                        }}
                      />
                      <Chip
                        size="small"
                        label={`${testedCount}/${functions.length}`}
                        variant="outlined"
                        sx={{
                          fontWeight: 500,
                          fontSize: 'var(--font-size-tiny, 11px)',
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {functions.map((func, index) => (
                        <Chip
                          key={index}
                          icon={<FunctionIcon />}
                          label={func.name}
                          size="small"
                          sx={{
                            backgroundColor: func.is_tested
                              ? 'var(--color-success-lightest, #e7f5e1)'
                              : 'var(--color-error-lightest, #ffebee)',
                            color: func.is_tested
                              ? 'var(--color-success-dark, #1e7e34)'
                              : 'var(--color-error-dark, #c82829)',
                            fontFamily: 'var(--font-family-mono, monospace)',
                            fontSize: 'var(--font-size-small, 12px)',
                            '& .MuiChip-icon': {
                              color: 'inherit',
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default TestCoveragePage;
