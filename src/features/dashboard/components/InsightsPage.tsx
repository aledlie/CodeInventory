/**
 * InsightsPage Component
 *
 * Main page for AI-powered insights displaying:
 * - Summary hero card with AI-generated headline
 * - Category tabs for filtering
 * - List of insight cards
 * - Empty states and loading states
 */

import { useState, useMemo, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Alert,
  AlertTitle,
  Skeleton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import {
  InsightCard,
  InsightsSummaryCard,
  InsightsCategoryTabs,
} from './insights';
import type { TabValue } from './insights';
import {
  useInsightsReport,
  useAcknowledgeInsight,
  useRegenerateInsights,
} from '../hooks/useInsights';
import type { AIInsight, InsightsSortConfig } from '../types';

/**
 * Props for InsightsPage
 */
export interface InsightsPageProps {
  /** Data path for reports */
  dataPath?: string;
}

/**
 * Loading skeleton for insights list
 */
function InsightsListSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rounded" height={180} />
      ))}
    </Box>
  );
}

/**
 * Empty state when no insights available
 */
function EmptyState({ filtered = false }: { filtered?: boolean }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 4,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      <AIIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {filtered ? 'No matching insights' : 'No insights available'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {filtered
          ? 'Try adjusting your filters or search query.'
          : 'Run the analysis pipeline to generate AI-powered insights about your codebase.'}
      </Typography>
    </Box>
  );
}

/**
 * Sort insights by configuration
 */
function sortInsights(insights: AIInsight[], config: InsightsSortConfig): AIInsight[] {
  const sorted = [...insights];
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (config.field) {
      case 'severity':
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;
      case 'confidence':
        comparison = b.confidence - a.confidence;
        break;
      case 'createdAt':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      default:
        break;
    }

    return config.direction === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * InsightsPage content (wrapped with Suspense)
 */
function InsightsPageContent({ dataPath = '/data' }: InsightsPageProps) {
  const { data: report } = useInsightsReport(dataPath);
  const { mutate: acknowledge, isPending: isAcknowledging } = useAcknowledgeInsight();
  const { mutate: regenerate, isPending: isRegenerating } = useRegenerateInsights();

  // Local state
  const [selectedTab, setSelectedTab] = useState<TabValue>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<InsightsSortConfig>({
    field: 'severity',
    direction: 'asc',
  });

  // Filter and sort insights
  const filteredInsights = useMemo(() => {
    if (!report) return [];

    let filtered = [...report.insights];

    // Filter by tab
    if (selectedTab !== 'all') {
      filtered = filtered.filter((i) => i.type === selectedTab);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.explanation.toLowerCase().includes(query)
      );
    }

    // Sort
    return sortInsights(filtered, sortConfig);
  }, [report, selectedTab, searchQuery, sortConfig]);

  // Calculate counts
  const counts = useMemo(() => {
    if (!report) {
      return { all: 0, improvement: 0, concern: 0, recommendation: 0, prediction: 0 };
    }
    return {
      all: report.summary.total,
      improvement: report.summary.byType.improvement || 0,
      concern: report.summary.byType.concern || 0,
      recommendation: report.summary.byType.recommendation || 0,
      prediction: report.summary.byType.prediction || 0,
    };
  }, [report]);

  const handleAcknowledge = (insightId: string) => {
    acknowledge({ insightId, userId: 'current-user' });
  };

  const handleRefresh = () => {
    regenerate();
  };

  // No report available
  if (!report) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          <AlertTitle>No Insights Available</AlertTitle>
          Run the analysis pipeline with AI insights enabled to generate insights about your codebase.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          AI Insights
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered analysis and recommendations for your codebase.
        </Typography>
      </Box>

      {/* Summary Card */}
      <Box sx={{ mb: 4 }}>
        <InsightsSummaryCard
          summary={report.summary}
          keyMetrics={report.keyMetrics}
          onRefresh={handleRefresh}
          isRefreshing={isRegenerating}
        />
      </Box>

      {/* Category Tabs */}
      <InsightsCategoryTabs
        value={selectedTab}
        onChange={setSelectedTab}
        counts={counts}
      />

      {/* Filters Row */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search insights..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: '1 1 300px', maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="sort-by-label">Sort by</InputLabel>
          <Select
            labelId="sort-by-label"
            value={sortConfig.field}
            label="Sort by"
            onChange={(e) =>
              setSortConfig((prev) => ({
                ...prev,
                field: e.target.value as InsightsSortConfig['field'],
              }))
            }
            startAdornment={<FilterIcon sx={{ mr: 1, color: 'action.active' }} />}
          >
            <MenuItem value="severity">Severity</MenuItem>
            <MenuItem value="confidence">Confidence</MenuItem>
            <MenuItem value="createdAt">Date</MenuItem>
            <MenuItem value="type">Type</MenuItem>
          </Select>
        </FormControl>

        {/* Results count */}
        <Chip
          label={`${filteredInsights.length} insights`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Insights List */}
      {filteredInsights.length === 0 ? (
        <EmptyState filtered={searchQuery !== '' || selectedTab !== 'all'} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onAcknowledge={handleAcknowledge}
              onViewDetails={(id) => console.log('View details:', id)}
              isLoading={isAcknowledging}
            />
          ))}
        </Box>
      )}
    </Container>
  );
}

/**
 * InsightsPage with Suspense boundary
 */
export function InsightsPage(props: InsightsPageProps) {
  return (
    <Suspense
      fallback={
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="text" width={200} height={48} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={250} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
          <InsightsListSkeleton />
        </Container>
      }
    >
      <InsightsPageContent {...props} />
    </Suspense>
  );
}

export default InsightsPage;
