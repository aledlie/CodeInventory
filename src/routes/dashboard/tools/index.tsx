import { Suspense, useState, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Box,
  Paper,
  Typography,
} from '@mui/material';
import {
  Folder as FolderIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  RocketLaunch as RocketLaunchIcon,
} from '@mui/icons-material';
import { DashboardLayout } from '../../../features/dashboard/components/DashboardLayout';
import { MetricGrid } from '../../../features/dashboard/components/MetricGrid';
import { SuspenseLoader } from '../../../components/SuspenseLoader';
import { useToolsReport, useToolsStatistics } from '../../../features/dashboard/hooks/useToolsData';
import { ModularityDistributionChart } from '../../../features/dashboard/components/tools/ModularityDistributionChart';
import { UtilityModulesTable } from '../../../features/dashboard/components/tools/UtilityModulesTable';
import { ToolsFilterToolbar } from '../../../features/dashboard/components/tools/ToolsFilterToolbar';
import type { ModularityScore } from '../../../features/dashboard/types/tools';

export const Route = createFileRoute('/dashboard/tools/')({
  component: ToolsOverviewPage,
});

function ToolsOverviewPageContent() {
  const { data: report } = useToolsReport();
  const { data: stats } = useToolsStatistics();

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'extraction' | 'modularity' | 'name'>('extraction');
  const [modularityFilter, setModularityFilter] = useState<ModularityScore | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'classes' | 'functions' | 'both'>('all');

  // Filter and sort modules
  const filteredModules = useMemo(() => {
    let filtered = [...report.utility_modules];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.file_path.toLowerCase().includes(query)
      );
    }

    // Modularity filter
    if (modularityFilter !== 'all') {
      filtered = filtered.filter(m => m.modularity_score === modularityFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'classes') {
        filtered = filtered.filter(m => m.class_count > 0 && m.function_count === 0);
      } else if (typeFilter === 'functions') {
        filtered = filtered.filter(m => m.function_count > 0 && m.class_count === 0);
      } else if (typeFilter === 'both') {
        filtered = filtered.filter(m => m.class_count > 0 && m.function_count > 0);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'extraction') {
        return b.extraction_potential - a.extraction_potential;
      } else if (sortBy === 'modularity') {
        const order: Record<ModularityScore, number> = {
          highly_modular: 0,
          modular: 1,
          semi_modular: 2,
          coupled: 3
        };
        return order[a.modularity_score] - order[b.modularity_score];
      } else {
        return a.file_path.localeCompare(b.file_path);
      }
    });

    return filtered;
  }, [report.utility_modules, searchQuery, sortBy, modularityFilter, typeFilter]);

  const avgExtractionPercentage = Math.round(stats.avgExtractionPotential * 100);
  const highModularPercentage = Math.round(
    (stats.modularityDistribution.highly_modular / stats.totalModules) * 100
  );

  return (
    <DashboardLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Tools & Utility Modules
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Identify modular code with high extraction potential
        </Typography>
      </Box>

      {/* Metrics Overview */}
      <MetricGrid
        metrics={[
          {
            label: "Total Modules",
            value: stats.totalModules,
            unit: "utility modules",
            icon: <FolderIcon />,
          },
          {
            label: "Avg Extraction Potential",
            value: `${avgExtractionPercentage}%`,
            trend: `${stats.avgExtractionPotential.toFixed(2)} avg score`,
            icon: <TrendingUpIcon />,
          },
          {
            label: "Highly Modular",
            value: stats.modularityDistribution.highly_modular || 0,
            trend: `${highModularPercentage}% of modules`,
            status: "success" as const,
            icon: <CheckCircleIcon />,
          },
          {
            label: "Ready for Extraction",
            value: stats.highPotentialCandidates,
            trend: "high-potential candidates",
            status: "primary" as const,
            icon: <RocketLaunchIcon />,
          },
        ]}
      />

      {/* Modularity Distribution */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Modularity Distribution
        </Typography>
        <ModularityDistributionChart
          distribution={stats.modularityDistribution}
          total={stats.totalModules}
        />
      </Paper>

      {/* Modules Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Utility Modules
        </Typography>

        <ToolsFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          modularityFilter={modularityFilter}
          onModularityFilterChange={setModularityFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />

        <UtilityModulesTable modules={filteredModules} />
      </Paper>
    </DashboardLayout>
  );
}

function ToolsOverviewPage() {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <ToolsOverviewPageContent />
    </Suspense>
  );
}
