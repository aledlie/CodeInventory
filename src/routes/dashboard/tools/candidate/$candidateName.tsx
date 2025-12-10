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
  Avatar,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { DashboardLayout } from '../../../../features/dashboard/components/DashboardLayout';
import { SuspenseLoader } from '../../../../components/SuspenseLoader';
import { useToolCandidate } from '../../../../features/dashboard/hooks/useToolsData';
import { ModularityChip } from '../../../../features/dashboard/components/tools/ModularityChip';
import { ExtractionComplexityChip } from '../../../../features/dashboard/components/tools/ExtractionComplexityChip';
import { DependencyBreakdown } from '../../../../features/dashboard/components/tools/DependencyBreakdown';
import { CodePreview } from '../../../../features/dashboard/components/tools/CodePreview';
import { DependencyGraph } from '../../../../features/dashboard/components/tools/DependencyGraph';
import type { UtilityModule } from '../../../../features/dashboard/types/tools';

export const Route = createFileRoute('/dashboard/tools/candidate/$candidateName')({
  component: CandidateDetailPage,
});

function CandidateDetailPageContent() {
  const { candidateName } = Route.useParams();
  const navigate = useNavigate();

  const { data: candidate } = useToolCandidate(candidateName);

  if (!candidate) {
    return (
      <DashboardLayout currentPath="/dashboard/tools" onNavigate={(path) => navigate({ to: path })}>
        <Typography variant="h5" color="error">
          Tool candidate not found: {candidateName}
        </Typography>
      </DashboardLayout>
    );
  }

  const percentage = Math.round(candidate.extraction_potential * 100);

  // Categorize dependencies
  const externalDeps = candidate.dependencies.filter(d =>
    !d.startsWith('.') && !d.includes('/')
  );
  const internalDeps = candidate.dependencies.filter(d =>
    d.startsWith('.') || d.includes('/')
  );

  // Mock code preview - in real implementation, this would fetch from file
  const mockCode = `class ${candidate.name}:
    """${candidate.description}"""

    def __init__(self):
        pass

    # ... implementation ...`;

  // Create a mock module for the dependency graph
  const mockModule: UtilityModule = {
    file_path: candidate.file_path,
    function_count: candidate.type === 'function' ? 1 : 0,
    class_count: candidate.type === 'class' ? 1 : 0,
    external_dependencies: externalDeps,
    internal_dependencies: internalDeps,
    modularity_score: candidate.modularity_score,
    extraction_potential: candidate.extraction_potential,
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
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate({
              to: '/dashboard/tools/$moduleId',
              params: { moduleId: encodeURIComponent(candidate.file_path) }
            });
          }}
        >
          {candidate.file_path.split('/').pop()}
        </Link>
        <Typography color="text.primary">{candidate.name}</Typography>
      </Breadcrumbs>

      {/* Hero Section */}
      <Paper sx={{ p: 4, mb: 3, bgcolor: 'background.default' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <CodeIcon />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h4" gutterBottom>
              {candidate.name}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body1" color="text.secondary">
                {candidate.type}
              </Typography>
              <ModularityChip score={candidate.modularity_score} size="medium" />
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Extraction Potential: {percentage}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={percentage}
            color={percentage >= 80 ? 'success' : percentage >= 50 ? 'info' : 'warning'}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
          <Chip
            label={candidate.file_path}
            size="small"
            icon={<CodeIcon />}
          />
          <Chip label={`Line ${candidate.line_number}`} size="small" />
          <Chip label={candidate.description} size="small" variant="outlined" />
        </Stack>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Type
            </Typography>
            <Typography variant="h6">{candidate.type}</Typography>
            <Typography variant="caption" color="text.secondary">
              {candidate.description}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Complexity
            </Typography>
            <Box sx={{ mt: 1 }}>
              <ExtractionComplexityChip
                complexity={candidate.extraction_complexity}
                size="medium"
              />
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Dependencies
            </Typography>
            <Typography variant="h6">{candidate.dependencies.length}</Typography>
            <Typography variant="caption" color="text.secondary">
              {externalDeps.length} external
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Package Name
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', mt: 1 }}
            >
              {candidate.suggested_package_name}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Rationale */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Why Extract This?</AlertTitle>
        {candidate.rationale}
      </Alert>

      {/* Dependency Analysis */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dependency Analysis
        </Typography>
        <DependencyBreakdown
          dependencies={candidate.dependencies}
          externalDeps={externalDeps}
          internalDeps={internalDeps}
        />
      </Paper>

      {/* Dependency Graph */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dependency Graph
        </Typography>
        <DependencyGraph
          module={mockModule}
          external={externalDeps}
          internal={internalDeps}
        />
      </Paper>

      {/* Code Preview */}
      <Paper sx={{ p: 0, mb: 3 }}>
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="h6">Code Preview</Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <CodePreview
            code={mockCode}
            startLine={candidate.line_number}
          />
        </Box>
        <Box sx={{ p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Full implementation available in {candidate.file_path}
          </Typography>
        </Box>
      </Paper>

      {/* Extraction Instructions */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Extraction Instructions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            {/* Step 1 */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Step 1: Create Package Structure
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ fontFamily: 'monospace', m: 0 }}
                >
                  {`$ mkdir -p ${candidate.suggested_package_name}/src
$ cd ${candidate.suggested_package_name}`}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button size="small" startIcon={<CopyIcon />}>
                    Copy Commands
                  </Button>
                </Stack>
              </Paper>
            </Box>

            <Divider />

            {/* Step 2 */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Step 2: Extract {candidate.type === 'class' ? 'Class' : 'Function'} Definition
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Copy lines starting from {candidate.line_number} in {candidate.file_path.split('/').pop()}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<CopyIcon />}>
                  Copy Code
                </Button>
                <Button size="small" startIcon={<DownloadIcon />}>
                  Download as File
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* Step 3 */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Step 3: Abstract Dependencies
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Replace internal imports with standard alternatives:
              </Typography>
              {internalDeps.length > 0 ? (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {internalDeps.map((dep) => (
                    <Alert severity="warning" key={dep}>
                      <Typography variant="body2" fontFamily="monospace">
                        {dep}
                      </Typography>
                      <Typography variant="caption">
                        Consider parameterizing or using a standard interface
                      </Typography>
                    </Alert>
                  ))}
                </Stack>
              ) : (
                <Alert severity="success">
                  No internal dependencies to abstract
                </Alert>
              )}
            </Box>

            <Divider />

            {/* Step 4 */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Step 4: Configure Package
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', m: 0 }}>
{`[project]
name = "${candidate.suggested_package_name}"
version = "1.0.0"
dependencies = [${externalDeps.map(d => `"${d}"`).join(', ')}]`}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button size="small" startIcon={<CopyIcon />}>
                    Copy Configuration
                  </Button>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Impact Analysis */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Impact Analysis
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Estimated Effort
            </Typography>
            <Typography variant="h6">
              {candidate.extraction_complexity === 'trivial' ? '< 1 hour' :
               candidate.extraction_complexity === 'moderate' ? '2-3 hours' :
               candidate.extraction_complexity === 'complex' ? '4-6 hours' : '1-2 days'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Risk Level
            </Typography>
            <Chip
              label={
                candidate.extraction_complexity === 'trivial' || candidate.extraction_complexity === 'moderate'
                  ? 'Low'
                  : candidate.extraction_complexity === 'complex'
                  ? 'Medium'
                  : 'High'
              }
              color={
                candidate.extraction_complexity === 'trivial' || candidate.extraction_complexity === 'moderate'
                  ? 'success'
                  : candidate.extraction_complexity === 'complex'
                  ? 'warning'
                  : 'error'
              }
              sx={{ mt: 1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Breaking Changes
            </Typography>
            <Typography variant="h6">
              {internalDeps.length === 0 ? 'None' : 'Possible'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </DashboardLayout>
  );
}

function CandidateDetailPage() {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <CandidateDetailPageContent />
    </Suspense>
  );
}
