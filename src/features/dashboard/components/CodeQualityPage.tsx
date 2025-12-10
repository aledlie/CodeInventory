/**
 * Code Quality Detail Page
 *
 * Comprehensive view of code quality issues with:
 * - Severity breakdown visualization
 * - Filterable issue list with expandable details
 * - Category distribution chart
 * - File-grouped view option
 *
 * Design: Data-dense analytical view with clear visual hierarchy
 * Aesthetic: Technical precision with subtle depth and smooth animations
 */

import { useState, useMemo, useCallback } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
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
  LinearProgress,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  FilterList as FilterIcon,
  ViewList as ListIcon,
  Folder as FolderIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Code as CodeIcon,
  Lightbulb as LightbulbIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';

// Layout and data imports
import { DashboardLayout } from './DashboardLayout';
import { useDashboardData } from '../hooks/useDashboardData';
import type { PythonQualityIssue } from '../types';

/**
 * Severity configuration with colors and labels
 */
const SEVERITY_CONFIG = {
  error: {
    label: 'Critical',
    color: '#dc3545',
    bgColor: '#ffebee',
    icon: <ErrorIcon fontSize="small" />,
  },
  warning: {
    label: 'Warning',
    color: '#ff9800',
    bgColor: '#fff3e0',
    icon: <WarningIcon fontSize="small" />,
  },
  info: {
    label: 'Info',
    color: '#17a2b8',
    bgColor: '#e1f5fe',
    icon: <InfoIcon fontSize="small" />,
  },
} as const;

/**
 * Category configuration with icons
 */
const CATEGORY_CONFIG = {
  security: { label: 'Security', icon: <SecurityIcon fontSize="small" /> },
  code_smell: { label: 'Code Smell', icon: <BugIcon fontSize="small" /> },
  best_practice: { label: 'Best Practice', icon: <LightbulbIcon fontSize="small" /> },
  documentation: { label: 'Documentation', icon: <CodeIcon fontSize="small" /> },
} as const;

type SeverityFilter = 'all' | 'error' | 'warning' | 'info';
type ViewMode = 'list' | 'grouped';

/**
 * Severity breakdown card component
 */
function SeverityBreakdown({ issuesBySeverity, total }: {
  issuesBySeverity: Record<string, number>;
  total: number;
}) {
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
          mb: 2,
          fontSize: 'var(--font-size-h4, 16px)',
          fontWeight: 600,
          color: 'var(--color-text-primary, #1a1a1a)',
          letterSpacing: '-0.01em',
        }}
      >
        Severity Distribution
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Object.entries(SEVERITY_CONFIG).map(([key, config]) => {
          const count = issuesBySeverity[key] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <Box key={key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: config.color }}>{config.icon}</Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: 'var(--color-text-primary, #1a1a1a)',
                    }}
                  >
                    {config.label}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: config.color,
                    fontFamily: 'var(--font-family-mono, monospace)',
                  }}
                >
                  {count}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 8,
                  borderRadius: 'var(--radius-full, 9999px)',
                  backgroundColor: alpha(config.color, 0.15),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: config.color,
                    borderRadius: 'var(--radius-full, 9999px)',
                  },
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

/**
 * Category breakdown card component
 */
function CategoryBreakdown({ issuesByCategory, total }: {
  issuesByCategory: Record<string, number>;
  total: number;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 'var(--radius-md, 12px)',
        border: '1px solid var(--color-border, #e0e0e0)',
        background: 'var(--color-background-primary, #fff)',
      }}
    >
      <Typography
        variant="h3"
        sx={{
          mb: 2,
          fontSize: 'var(--font-size-h4, 16px)',
          fontWeight: 600,
          color: 'var(--color-text-primary, #1a1a1a)',
          letterSpacing: '-0.01em',
        }}
      >
        Issue Categories
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(issuesByCategory).map(([category, count]) => {
          const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';

          return (
            <Chip
              key={category}
              icon={config?.icon}
              label={`${config?.label || category}: ${count} (${percentage}%)`}
              variant="outlined"
              sx={{
                borderRadius: 'var(--radius-sm, 8px)',
                fontWeight: 500,
                fontSize: 'var(--font-size-small, 12px)',
                '& .MuiChip-icon': {
                  color: 'var(--color-primary, #0066cc)',
                },
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

/**
 * Expandable issue row component
 */
function IssueRow({ issue, isExpanded, onToggle }: {
  issue: PythonQualityIssue;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const severityConfig = SEVERITY_CONFIG[issue.severity];
  const categoryConfig = CATEGORY_CONFIG[issue.category as keyof typeof CATEGORY_CONFIG];

  const handleCopySnippet = useCallback(() => {
    if (issue.code_snippet) {
      navigator.clipboard.writeText(issue.code_snippet);
    }
  }, [issue.code_snippet]);

  return (
    <>
      <TableRow
        hover
        onClick={onToggle}
        sx={{
          cursor: 'pointer',
          transition: 'background-color var(--transition-fast, 150ms) var(--ease-in-out)',
          '&:hover': {
            backgroundColor: alpha(severityConfig.color, 0.04),
          },
          ...(isExpanded && {
            backgroundColor: alpha(severityConfig.color, 0.06),
          }),
        }}
      >
        <TableCell sx={{ width: 48 }}>
          <IconButton size="small" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ width: 100 }}>
          <Chip
            size="small"
            icon={severityConfig.icon}
            label={severityConfig.label}
            sx={{
              backgroundColor: severityConfig.bgColor,
              color: severityConfig.color,
              fontWeight: 600,
              fontSize: 'var(--font-size-tiny, 11px)',
              '& .MuiChip-icon': {
                color: severityConfig.color,
              },
            }}
          />
        </TableCell>
        <TableCell sx={{ width: 120 }}>
          <Chip
            size="small"
            variant="outlined"
            icon={categoryConfig?.icon}
            label={categoryConfig?.label || issue.category}
            sx={{
              fontSize: 'var(--font-size-tiny, 11px)',
              '& .MuiChip-icon': {
                color: 'var(--color-text-secondary, #666)',
              },
            }}
          />
        </TableCell>
        <TableCell>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: 'var(--color-text-primary, #1a1a1a)',
              lineHeight: 1.4,
            }}
          >
            {issue.message}
          </Typography>
        </TableCell>
        <TableCell>
          <Tooltip title={issue.file_path} arrow>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'var(--font-family-mono, monospace)',
                fontSize: 'var(--font-size-small, 12px)',
                color: 'var(--color-text-secondary, #666)',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {issue.file_path.split('/').pop()}
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
            L{issue.line_number}
          </Typography>
        </TableCell>
      </TableRow>

      {/* Expanded details */}
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: isExpanded ? 1 : 0 }}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'var(--color-background-secondary, #f5f5f5)',
                borderRadius: 'var(--radius-sm, 8px)',
                my: 1,
              }}
            >
              {/* File path */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'var(--color-text-secondary, #666)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  File Path
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'var(--font-family-mono, monospace)',
                    color: 'var(--color-text-primary, #1a1a1a)',
                    mt: 0.5,
                  }}
                >
                  {issue.file_path}:{issue.line_number}
                </Typography>
              </Box>

              {/* Rule ID */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'var(--color-text-secondary, #666)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Rule
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'var(--font-family-mono, monospace)',
                    color: 'var(--color-primary, #0066cc)',
                    mt: 0.5,
                  }}
                >
                  {issue.rule_id}
                </Typography>
              </Box>

              {/* Code snippet */}
              {issue.code_snippet && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--color-text-secondary, #666)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Code Snippet
                    </Typography>
                    <Tooltip title="Copy to clipboard" arrow>
                      <IconButton size="small" onClick={handleCopySnippet}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box
                    component="pre"
                    sx={{
                      mt: 0.5,
                      p: 2,
                      backgroundColor: 'var(--color-neutral-800, #2d2d2d)',
                      color: 'var(--color-neutral-100, #f0f0f0)',
                      borderRadius: 'var(--radius-sm, 8px)',
                      fontFamily: 'var(--font-family-mono, monospace)',
                      fontSize: 'var(--font-size-small, 12px)',
                      overflow: 'auto',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    <code>{issue.code_snippet}</code>
                  </Box>
                </Box>
              )}

              {/* Suggestion */}
              {issue.suggestion && (
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'var(--color-success-lightest, #e7f5e1)',
                    borderRadius: 'var(--radius-sm, 8px)',
                    borderLeft: '4px solid var(--color-success, #28a745)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <LightbulbIcon sx={{ color: 'var(--color-success-dark, #1e7e34)', fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--color-success-dark, #1e7e34)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Suggestion
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'var(--color-success-dark, #1e7e34)',
                      lineHeight: 1.5,
                    }}
                  >
                    {issue.suggestion}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

/**
 * Code Quality Page Component
 */
export function CodeQualityPage() {
  const navigate = useNavigate();

  // Fetch data using Suspense-enabled hook
  const { data: result } = useDashboardData('/data');
  const qualityReport = result.data.quality;

  // State for filters and view
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filter issues based on search and severity
  const filteredIssues = useMemo(() => {
    if (!qualityReport?.issues) return [];

    return qualityReport.issues.filter((issue) => {
      // Severity filter
      if (severityFilter !== 'all' && issue.severity !== severityFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          issue.message.toLowerCase().includes(query) ||
          issue.file_path.toLowerCase().includes(query) ||
          issue.rule_id.toLowerCase().includes(query) ||
          issue.category.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [qualityReport?.issues, severityFilter, searchQuery]);

  // Group issues by file for grouped view
  const groupedIssues = useMemo(() => {
    const groups: Record<string, PythonQualityIssue[]> = {};
    filteredIssues.forEach((issue) => {
      if (!groups[issue.file_path]) {
        groups[issue.file_path] = [];
      }
      groups[issue.file_path].push(issue);
    });
    return groups;
  }, [filteredIssues]);

  // Paginated issues for list view
  const paginatedIssues = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredIssues.slice(start, start + rowsPerPage);
  }, [filteredIssues, page, rowsPerPage]);

  // Handlers
  const handleSeverityChange = useCallback((_: MouseEvent<HTMLElement>, newValue: SeverityFilter | null) => {
    if (newValue) {
      setSeverityFilter(newValue);
      setPage(0);
    }
  }, []);

  const handleViewModeChange = useCallback((_: MouseEvent<HTMLElement>, newValue: ViewMode | null) => {
    if (newValue) {
      setViewMode(newValue);
    }
  }, []);

  const handleRowToggle = useCallback((index: number) => {
    setExpandedRow((prev) => (prev === index ? null : index));
  }, []);

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
    setExpandedRow(null);
  }, []);

  const handleRowsPerPageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Handle no data state
  if (!qualityReport) {
    return (
      <DashboardLayout currentPath="/dashboard/quality" onNavigate={(path) => navigate({ to: path })}>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h3" color="text.secondary">
            No quality report available
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Run the analysis pipeline to generate quality reports.
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPath="/dashboard/quality" onNavigate={(path) => navigate({ to: path })}>
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
            Code Quality Analysis
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'var(--color-text-secondary, #666)',
              fontSize: 'var(--font-size-body, 14px)',
            }}
          >
            {qualityReport.total_issues} issues found across {qualityReport.total_files_scanned} files
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
          <SeverityBreakdown
            issuesBySeverity={qualityReport.issues_by_severity}
            total={qualityReport.total_issues}
          />
          <CategoryBreakdown
            issuesByCategory={qualityReport.issues_by_category}
            total={qualityReport.total_issues}
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
              placeholder="Search issues..."
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

            {/* Severity Filter */}
            <ToggleButtonGroup
              value={severityFilter}
              exclusive
              onChange={handleSeverityChange}
              size="small"
              aria-label="Filter by severity"
            >
              <ToggleButton value="all">
                <FilterIcon sx={{ mr: 0.5, fontSize: 18 }} />
                All
              </ToggleButton>
              <ToggleButton value="error" sx={{ color: SEVERITY_CONFIG.error.color }}>
                {SEVERITY_CONFIG.error.icon}
                <Box component="span" sx={{ ml: 0.5 }}>Critical</Box>
              </ToggleButton>
              <ToggleButton value="warning" sx={{ color: SEVERITY_CONFIG.warning.color }}>
                {SEVERITY_CONFIG.warning.icon}
                <Box component="span" sx={{ ml: 0.5 }}>Warning</Box>
              </ToggleButton>
              <ToggleButton value="info" sx={{ color: SEVERITY_CONFIG.info.color }}>
                {SEVERITY_CONFIG.info.icon}
                <Box component="span" sx={{ ml: 0.5 }}>Info</Box>
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

        {/* Issues Table */}
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
                      <TableCell sx={{ width: 48 }} />
                      <TableCell sx={{ fontWeight: 600, width: 100 }}>Severity</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 120 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 60, textAlign: 'right' }}>Line</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedIssues.map((issue, index) => (
                      <IssueRow
                        key={`${issue.file_path}-${issue.line_number}-${index}`}
                        issue={issue}
                        isExpanded={expandedRow === index}
                        onToggle={() => handleRowToggle(index)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredIssues.length}
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
              {Object.entries(groupedIssues).map(([filePath, issues]) => (
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
                      }}
                    >
                      {filePath}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${issues.length} issues`}
                      sx={{
                        ml: 'auto',
                        fontWeight: 600,
                        fontSize: 'var(--font-size-tiny, 11px)',
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {issues.map((issue, index) => {
                      const config = SEVERITY_CONFIG[issue.severity];
                      return (
                        <Box
                          key={index}
                          sx={{
                            p: 1.5,
                            backgroundColor: 'var(--color-background-primary, #fff)',
                            borderRadius: 'var(--radius-xs, 4px)',
                            borderLeft: `4px solid ${config.color}`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'var(--font-family-mono, monospace)',
                              fontSize: 'var(--font-size-small, 12px)',
                              color: 'var(--color-primary, #0066cc)',
                              fontWeight: 600,
                              minWidth: 50,
                            }}
                          >
                            L{issue.line_number}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'var(--color-text-primary, #1a1a1a)',
                              flex: 1,
                            }}
                          >
                            {issue.message}
                          </Typography>
                          <Chip
                            size="small"
                            label={config.label}
                            sx={{
                              backgroundColor: config.bgColor,
                              color: config.color,
                              fontSize: 'var(--font-size-tiny, 11px)',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default CodeQualityPage;
