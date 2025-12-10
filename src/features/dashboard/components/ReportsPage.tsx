/**
 * ReportsPage Component
 *
 * Custom report generation dashboard.
 * Allows users to configure, preview, and export reports.
 */

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid2 as Grid,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  IconButton,
  Collapse,
  Alert,
} from '@mui/material';
import {
  Description as ReportIcon,
  Business as ExecutiveIcon,
  Code as TechnicalIcon,
  Security as ComplianceIcon,
  Build as CustomIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  DragIndicator as DragIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from './DashboardLayout';
import { reportsApi, AVAILABLE_SECTIONS } from '../api/reportsApi';
import type {
  ReportType,
  ReportExportFormat,
  ReportConfig,
} from '../types/reports';

/**
 * Report type cards configuration
 */
const REPORT_TYPES: Array<{
  type: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    type: 'executive',
    title: 'Executive Report',
    description: 'High-level summary for stakeholders with key metrics and trends',
    icon: <ExecutiveIcon />,
    color: '#2196F3',
  },
  {
    type: 'technical',
    title: 'Technical Report',
    description: 'Detailed analysis with code-level insights and recommendations',
    icon: <TechnicalIcon />,
    color: '#4CAF50',
  },
  {
    type: 'compliance',
    title: 'Compliance Report',
    description: 'Security-focused report for audit and compliance requirements',
    icon: <ComplianceIcon />,
    color: '#FF9800',
  },
  {
    type: 'custom',
    title: 'Custom Report',
    description: 'Build your own report with selected sections',
    icon: <CustomIcon />,
    color: '#9C27B0',
  },
];

/**
 * Export format options
 */
const EXPORT_FORMATS: Array<{
  format: ReportExportFormat;
  label: string;
  description: string;
}> = [
  { format: 'markdown', label: 'Markdown', description: 'GitHub-compatible' },
  { format: 'html', label: 'HTML', description: 'Standalone webpage' },
  { format: 'json', label: 'JSON', description: 'Machine-readable' },
  { format: 'csv', label: 'CSV', description: 'Spreadsheet' },
];

/**
 * Main ReportsPage component
 */
export function ReportsPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  /**
   * Handle report type selection
   */
  const handleTypeSelect = useCallback((type: ReportType) => {
    setSelectedType(type);
    const defaultConfig = reportsApi.createDefaultConfig(type);
    setConfig(defaultConfig);
    setPreview(null);
    setShowPreview(false);
  }, []);

  /**
   * Handle section toggle
   */
  const handleSectionToggle = useCallback((sectionId: string) => {
    if (!config) return;

    setConfig({
      ...config,
      sections: config.sections.map(s =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    });
  }, [config]);

  /**
   * Handle adding a new section
   */
  const handleAddSection = useCallback((sectionId: string) => {
    if (!config) return;

    const section = AVAILABLE_SECTIONS.find(s => s.id === sectionId);
    if (!section || config.sections.find(s => s.id === sectionId)) return;

    setConfig({
      ...config,
      sections: [
        ...config.sections,
        {
          id: section.id,
          title: section.title,
          enabled: true,
          order: config.sections.length + 1,
        },
      ],
    });
  }, [config]);

  /**
   * Generate preview
   */
  const handleGeneratePreview = useCallback(async () => {
    if (!config) return;

    const previewContent = await reportsApi.generatePreview(config);
    setPreview(previewContent);
    setShowPreview(true);
  }, [config]);

  /**
   * Export report
   */
  const handleExport = useCallback(async (format: ReportExportFormat) => {
    if (!config) return;

    setExporting(true);
    try {
      await reportsApi.downloadReport({ ...config, format }, format);
      setExportSuccess(`Report exported as ${format.toUpperCase()}`);
      setTimeout(() => setExportSuccess(null), 3000);
    } finally {
      setExporting(false);
    }
  }, [config]);

  /**
   * Reset to type selection
   */
  const handleReset = useCallback(() => {
    setSelectedType(null);
    setConfig(null);
    setPreview(null);
    setShowPreview(false);
  }, []);

  return (
    <DashboardLayout lastGenerated={new Date()} currentPath="/dashboard/reports" onNavigate={(path) => navigate({ to: path })}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Page Header */}
        <Box>
          <Typography variant="h1" gutterBottom>
            Report Generator
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create custom reports to share code quality insights with your team.
          </Typography>
        </Box>

        {/* Success Alert */}
        {exportSuccess && (
          <Alert
            severity="success"
            icon={<CheckIcon />}
            onClose={() => setExportSuccess(null)}
          >
            {exportSuccess}
          </Alert>
        )}

        {/* Step 1: Report Type Selection */}
        {!selectedType && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Report Type
            </Typography>
            <Grid container spacing={2}>
              {REPORT_TYPES.map((rt) => (
                <Grid key={rt.type} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      transition: 'all 0.2s',
                      border: '2px solid transparent',
                      '&:hover': {
                        borderColor: rt.color,
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => handleTypeSelect(rt.type)}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                          color: rt.color,
                        }}
                      >
                        {rt.icon}
                        <Typography variant="h6">{rt.title}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {rt.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" sx={{ color: rt.color }}>
                        Select
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Step 2: Report Configuration */}
        {selectedType && config && (
          <Grid container spacing={3}>
            {/* Left Panel: Configuration */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Configure Report</Typography>
                  <Button size="small" onClick={handleReset}>
                    Change Type
                  </Button>
                </Box>

                {/* Report Title */}
                <TextField
                  label="Report Title"
                  fullWidth
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  sx={{ mb: 3 }}
                />

                {/* Sections */}
                <Typography variant="subtitle2" gutterBottom>
                  Sections
                </Typography>
                <FormGroup sx={{ mb: 2 }}>
                  {config.sections.map((section) => (
                    <FormControlLabel
                      key={section.id}
                      control={
                        <Checkbox
                          checked={section.enabled}
                          onChange={() => handleSectionToggle(section.id)}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DragIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                          {section.title}
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>

                {/* Add Section */}
                {selectedType === 'custom' && (
                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Add Section</InputLabel>
                      <Select
                        label="Add Section"
                        value=""
                        onChange={(e) => handleAddSection(e.target.value)}
                      >
                        {AVAILABLE_SECTIONS
                          .filter(s => !config.sections.find(cs => cs.id === s.id))
                          .map(s => (
                            <MenuItem key={s.id} value={s.id}>
                              {s.title} - {s.description}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={handleGeneratePreview}
                  >
                    Preview
                  </Button>
                  <ButtonGroup variant="contained">
                    {EXPORT_FORMATS.map((ef) => (
                      <Button
                        key={ef.format}
                        onClick={() => handleExport(ef.format)}
                        disabled={exporting}
                        startIcon={ef.format === 'markdown' ? <DownloadIcon /> : undefined}
                      >
                        {ef.label}
                      </Button>
                    ))}
                  </ButtonGroup>
                </Box>
              </Paper>
            </Grid>

            {/* Right Panel: Preview */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 3, minHeight: 400 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Preview</Typography>
                  <IconButton onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? <CollapseIcon /> : <ExpandIcon />}
                  </IconButton>
                </Box>

                {!preview && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 300,
                      color: 'text.secondary',
                    }}
                  >
                    <ReportIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                    <Typography>Click "Preview" to see your report</Typography>
                  </Box>
                )}

                <Collapse in={showPreview && !!preview}>
                  <Box
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      maxHeight: 600,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: 12,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {preview}
                  </Box>
                </Collapse>

                {/* Quick Info */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${config.sections.filter(s => s.enabled).length} sections`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={REPORT_TYPES.find(r => r.type === selectedType)?.title}
                    size="small"
                    sx={{
                      bgcolor: REPORT_TYPES.find(r => r.type === selectedType)?.color,
                      color: 'white',
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default ReportsPage;
