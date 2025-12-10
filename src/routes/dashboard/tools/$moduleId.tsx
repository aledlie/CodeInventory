import { Suspense } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  Breadcrumbs,
  Link,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import {
  Code as CodeIcon,
  Inventory2 as PackageIcon,
  Link as LinkIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { DashboardLayout } from '../../../features/dashboard/components/DashboardLayout';
import { SuspenseLoader } from '../../../components/SuspenseLoader';
import {
  useUtilityModule,
  useModuleToolCandidates
} from '../../../features/dashboard/hooks/useToolsData';
import { ModularityChip } from '../../../features/dashboard/components/tools/ModularityChip';
import { ExtractionGauge } from '../../../features/dashboard/components/tools/ExtractionGauge';
import { DependencyCard } from '../../../features/dashboard/components/tools/DependencyCard';
import { DependencyGraph } from '../../../features/dashboard/components/tools/DependencyGraph';
import { ToolCandidateCard } from '../../../features/dashboard/components/tools/ToolCandidateCard';

export const Route = createFileRoute('/dashboard/tools/$moduleId')({
  component: ModuleDetailPage,
});

function ModuleDetailPageContent() {
  const { moduleId } = Route.useParams();
  const navigate = useNavigate();
  const decodedPath = decodeURIComponent(moduleId);

  const { data: module } = useUtilityModule(decodedPath);
  const { data: toolCandidates } = useModuleToolCandidates(decodedPath);

  if (!module) {
    return (
      <DashboardLayout currentPath="/dashboard/tools" onNavigate={(path) => navigate({ to: path })}>
        <Typography variant="h5" color="error">
          Module not found: {decodedPath}
        </Typography>
      </DashboardLayout>
    );
  }

  const fileName = module.file_path.split('/').pop() || 'Unknown';

  const handleCandidateClick = (candidateName: string) => {
    navigate({
      to: '/dashboard/tools/candidate/$candidateName',
      params: { candidateName }
    });
  };

  return (
    <DashboardLayout currentPath="/dashboard/tools" onNavigate={(path) => navigate({ to: path })}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate({ to: '/dashboard/tools' });
          }}
        >
          Tools
        </Link>
        <Typography color="text.primary">{fileName}</Typography>
      </Breadcrumbs>

      {/* Hero Section */}
      <Paper sx={{ p: 4, mb: 3, bgcolor: 'background.default' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CodeIcon fontSize="large" color="primary" />
          <Box flex={1}>
            <Typography variant="h4" gutterBottom>
              {fileName}
            </Typography>
            <ModularityChip score={module.modularity_score} size="medium" />
          </Box>
        </Stack>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Extraction Potential
          </Typography>
          <ExtractionGauge value={module.extraction_potential} />
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }} flexWrap="wrap" useFlexGap>
          <Chip label={`${module.function_count} Functions`} size="small" />
          <Chip label={`${module.class_count} Classes`} size="small" />
          <Chip label={module.file_path} size="small" variant="outlined" />
        </Stack>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <DependencyCard
              title="External Dependencies"
              count={module.external_dependencies.length}
              items={module.external_dependencies}
              icon={<PackageIcon />}
              severity="info"
            />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <DependencyCard
              title="Internal Dependencies"
              count={module.internal_dependencies.length}
              items={module.internal_dependencies}
              icon={<LinkIcon />}
              severity={module.internal_dependencies.length > 10 ? 'warning' : 'info'}
            />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" color="primary.main">
                  {toolCandidates.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tool Candidates
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Extractable components in this module
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  const section = document.getElementById('tool-candidates');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View Details
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Dependency Graph */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dependency Visualization
        </Typography>
        <DependencyGraph
          module={module}
          external={module.external_dependencies}
          internal={module.internal_dependencies}
        />
      </Paper>

      {/* Tool Candidates List */}
      <Paper id="tool-candidates" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tool Candidates in This Module
        </Typography>
        {toolCandidates.length > 0 ? (
          <Stack spacing={2}>
            {toolCandidates.map((candidate) => (
              <ToolCandidateCard
                key={candidate.name}
                candidate={candidate}
                onClick={() => handleCandidateClick(candidate.name)}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No tool candidates identified in this module.
          </Typography>
        )}
      </Paper>

      {/* Extraction Guide */}
      <Accordion defaultExpanded={toolCandidates.length > 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Extraction Guide</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Follow these steps to extract components from this module:
            </Typography>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Step 1: Assess Dependencies
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={`${module.external_dependencies.length} external dependencies`}
                    secondary={
                      module.external_dependencies.length === 0
                        ? 'No external dependencies - excellent for extraction'
                        : 'Review external dependencies for compatibility'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={`${module.internal_dependencies.length} internal dependencies`}
                    secondary={
                      module.internal_dependencies.length > 5
                        ? 'High internal coupling - may need refactoring'
                        : 'Low coupling - good extraction candidate'
                    }
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Step 2: Create Package Structure
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Suggested package name: {fileName.replace('.py', '-utils')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Step 3: Extract Tool Candidates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {toolCandidates.length} candidate(s) ready for extraction. Review each
                candidate's detail page for specific instructions.
              </Typography>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </DashboardLayout>
  );
}

function ModuleDetailPage() {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <ModuleDetailPageContent />
    </Suspense>
  );
}
