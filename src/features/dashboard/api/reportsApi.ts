/**
 * Reports API
 *
 * Handles report generation and export functionality.
 */

import type {
  ReportConfig,
  ReportType,
  ExportFormat,
  ReportSection,
  ReportSectionConfig,
} from '../types/reports';

/**
 * Default section configurations by report type
 */
const DEFAULT_SECTIONS: Record<ReportType, ReportSectionConfig[]> = {
  executive: [
    { id: 'executive-summary', title: 'Executive Summary', enabled: true, order: 1 },
    { id: 'quality-trends', title: 'Quality Trends', enabled: true, order: 2 },
    { id: 'coverage-summary', title: 'Coverage Summary', enabled: true, order: 3 },
    { id: 'recommendations', title: 'Recommendations', enabled: true, order: 4 },
  ],
  technical: [
    { id: 'executive-summary', title: 'Overview', enabled: true, order: 1 },
    { id: 'quality-issues-detailed', title: 'Quality Issues', enabled: true, order: 2 },
    { id: 'coverage-by-file', title: 'Coverage by File', enabled: true, order: 3 },
    { id: 'untested-functions', title: 'Untested Functions', enabled: true, order: 4 },
    { id: 'dependency-graph', title: 'Dependency Graph', enabled: true, order: 5 },
    { id: 'circular-dependencies', title: 'Circular Dependencies', enabled: true, order: 6 },
    { id: 'appendix', title: 'Appendix', enabled: true, order: 7 },
  ],
  compliance: [
    { id: 'executive-summary', title: 'Compliance Overview', enabled: true, order: 1 },
    { id: 'quality-issues', title: 'Security Issues', enabled: true, order: 2 },
    { id: 'coverage-summary', title: 'Coverage Requirements', enabled: true, order: 3 },
    { id: 'external-dependencies', title: 'External Dependencies', enabled: true, order: 4 },
    { id: 'recommendations', title: 'Remediation Steps', enabled: true, order: 5 },
  ],
  custom: [
    { id: 'executive-summary', title: 'Summary', enabled: true, order: 1 },
  ],
};

/**
 * Available report sections with descriptions
 */
export const AVAILABLE_SECTIONS: Array<{
  id: ReportSection;
  title: string;
  description: string;
  category: 'quality' | 'coverage' | 'dependencies' | 'general';
}> = [
  { id: 'executive-summary', title: 'Executive Summary', description: 'High-level overview with key metrics', category: 'general' },
  { id: 'quality-trends', title: 'Quality Trends', description: 'Quality score trends over time', category: 'quality' },
  { id: 'quality-issues', title: 'Quality Issues', description: 'Summary of code quality issues', category: 'quality' },
  { id: 'quality-issues-detailed', title: 'Detailed Issues', description: 'Full list of issues with code context', category: 'quality' },
  { id: 'coverage-summary', title: 'Coverage Summary', description: 'Test coverage metrics overview', category: 'coverage' },
  { id: 'coverage-trends', title: 'Coverage Trends', description: 'Coverage trends over time', category: 'coverage' },
  { id: 'coverage-by-file', title: 'Coverage by File', description: 'File-by-file coverage breakdown', category: 'coverage' },
  { id: 'untested-functions', title: 'Untested Functions', description: 'List of functions without tests', category: 'coverage' },
  { id: 'dependency-summary', title: 'Dependency Summary', description: 'Overview of project dependencies', category: 'dependencies' },
  { id: 'dependency-graph', title: 'Dependency Graph', description: 'Visual dependency graph', category: 'dependencies' },
  { id: 'circular-dependencies', title: 'Circular Dependencies', description: 'Circular dependency chains', category: 'dependencies' },
  { id: 'external-dependencies', title: 'External Dependencies', description: 'Third-party package analysis', category: 'dependencies' },
  { id: 'comparison', title: 'Historical Comparison', description: 'Compare with previous runs', category: 'general' },
  { id: 'recommendations', title: 'Recommendations', description: 'Actionable improvement suggestions', category: 'general' },
  { id: 'appendix', title: 'Appendix', description: 'Additional data and methodology', category: 'general' },
];

/**
 * Generate report content
 */
async function generateReportContent(config: ReportConfig): Promise<string> {
  const sections: string[] = [];

  // Report header
  sections.push(`# ${config.title}`);
  sections.push(`\n**Generated:** ${new Date().toLocaleString()}`);
  sections.push(`**Report Type:** ${config.type.charAt(0).toUpperCase() + config.type.slice(1)}`);
  sections.push(`\n---\n`);

  // Generate each enabled section
  const enabledSections = config.sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  for (const section of enabledSections) {
    sections.push(`## ${section.title}\n`);
    sections.push(generateSectionContent(section, config));
    sections.push('\n');
  }

  return sections.join('\n');
}

/**
 * Generate content for a specific section
 */
function generateSectionContent(section: ReportSectionConfig, config: ReportConfig): string {
  switch (section.id) {
    case 'executive-summary':
      return generateExecutiveSummary(config);
    case 'quality-trends':
    case 'quality-issues':
    case 'quality-issues-detailed':
      return generateQualitySection(section.id, config);
    case 'coverage-summary':
    case 'coverage-trends':
    case 'coverage-by-file':
    case 'untested-functions':
      return generateCoverageSection(section.id, config);
    case 'dependency-summary':
    case 'dependency-graph':
    case 'circular-dependencies':
    case 'external-dependencies':
      return generateDependencySection(section.id, config);
    case 'recommendations':
      return generateRecommendations(config);
    default:
      return '*Section content not available*';
  }
}

function generateExecutiveSummary(_config: ReportConfig): string {
  return `
### Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Quality Score | 85/100 | Good |
| Test Coverage | 78% | Fair |
| Critical Issues | 2 | Needs Attention |
| Circular Dependencies | 3 | Warning |

### Highlights

- Code quality has improved by 5% since last analysis
- Test coverage increased from 72% to 78%
- 5 critical issues were resolved

### Areas for Improvement

- Add tests for 12 untested functions
- Resolve remaining circular dependencies
- Update 8 outdated dependencies
`;
}

function generateQualitySection(sectionId: ReportSection, _config: ReportConfig): string {
  if (sectionId === 'quality-issues') {
    return `
### Issue Summary

| Severity | Count | Change |
|----------|-------|--------|
| Critical | 2 | -3 |
| High | 8 | +1 |
| Medium | 24 | -5 |
| Low | 45 | +2 |

**Total Issues:** 79 (reduced from 84)
`;
  }
  return `*Quality section: ${sectionId}*`;
}

function generateCoverageSection(sectionId: ReportSection, _config: ReportConfig): string {
  if (sectionId === 'coverage-summary') {
    return `
### Coverage Overview

| Type | Coverage | Target |
|------|----------|--------|
| Overall | 78% | 80% |
| Unit Tests | 85% | 80% |
| Integration | 65% | 70% |
| E2E | 42% | 50% |

**Files with < 50% coverage:** 8
**Fully untested files:** 3
`;
  }
  return `*Coverage section: ${sectionId}*`;
}

function generateDependencySection(sectionId: ReportSection, _config: ReportConfig): string {
  if (sectionId === 'circular-dependencies') {
    return `
### Circular Dependency Chains

1. **src/services/auth.ts** → src/utils/session.ts → src/services/auth.ts
2. **src/api/client.ts** → src/middleware/auth.ts → src/api/client.ts
3. **src/store/index.ts** → src/reducers/app.ts → src/store/index.ts

**Impact:** Circular dependencies can cause runtime issues and make code harder to maintain.

**Recommendation:** Refactor shared logic into separate utility modules.
`;
  }
  return `*Dependency section: ${sectionId}*`;
}

function generateRecommendations(_config: ReportConfig): string {
  return `
### Priority Actions

1. **High Priority**
   - Fix 2 remaining critical issues in authentication module
   - Add unit tests for payment processing functions

2. **Medium Priority**
   - Increase E2E test coverage to 50%
   - Resolve circular dependencies in services layer

3. **Low Priority**
   - Update outdated dev dependencies
   - Refactor legacy utility functions

### Estimated Effort

- Critical fixes: ~8 hours
- Test coverage improvements: ~16 hours
- Refactoring: ~24 hours
`;
}

/**
 * Export report to specified format
 */
async function exportReport(config: ReportConfig, format: ExportFormat): Promise<Blob> {
  const content = await generateReportContent(config);

  switch (format) {
    case 'markdown':
      return new Blob([content], { type: 'text/markdown' });

    case 'html':
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
${markdownToHtml(content)}
</body>
</html>`;
      return new Blob([html], { type: 'text/html' });

    case 'json':
      const jsonReport = {
        title: config.title,
        type: config.type,
        generatedAt: new Date().toISOString(),
        sections: config.sections.filter(s => s.enabled),
        content: content,
      };
      return new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' });

    case 'csv':
      const csv = 'Section,Title,Enabled\n' +
        config.sections.map(s => `${s.id},"${s.title}",${s.enabled}`).join('\n');
      return new Blob([csv], { type: 'text/csv' });

    default:
      return new Blob([content], { type: 'text/plain' });
  }
}

/**
 * Simple markdown to HTML conversion
 */
function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\|(.+)\|$/gm, (_match, content) => {
      const cells = content.split('|').map((c: string) => c.trim());
      return '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>');
}

/**
 * Reports API
 */
export const reportsApi = {
  /**
   * Get default sections for a report type
   */
  getDefaultSections(reportType: ReportType): ReportSectionConfig[] {
    return [...DEFAULT_SECTIONS[reportType]];
  },

  /**
   * Get all available sections
   */
  getAvailableSections() {
    return AVAILABLE_SECTIONS;
  },

  /**
   * Create default report config
   */
  createDefaultConfig(reportType: ReportType, title?: string): ReportConfig {
    return {
      type: reportType,
      title: title || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      format: 'markdown',
      sections: this.getDefaultSections(reportType),
      data: {
        currentRun: {
          runId: 'current',
          timestamp: new Date().toISOString(),
          metrics: {
            qualityScore: 85,
            coveragePercentage: 78,
            criticalIssues: 2,
            highIssues: 8,
            mediumIssues: 24,
            lowIssues: 45,
            circularDeps: 3,
            totalFiles: 150,
            testedFunctions: 328,
            untestedFunctions: 92,
          },
          reportPaths: {
            quality: '/data/quality/quality_report.json',
            coverage: '/data/coverage/coverage_report.json',
            dependencies: '/data/dependencies/dependency_report.json',
          },
        },
      },
    };
  },

  /**
   * Generate report preview
   */
  async generatePreview(config: ReportConfig): Promise<string> {
    return generateReportContent(config);
  },

  /**
   * Export report to specified format
   */
  async exportReport(config: ReportConfig, format: ExportFormat): Promise<Blob> {
    return exportReport(config, format);
  },

  /**
   * Download report
   */
  async downloadReport(config: ReportConfig, format: ExportFormat): Promise<void> {
    const blob = await this.exportReport(config, format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext = format === 'markdown' ? 'md' : format;
    a.href = url;
    a.download = `${config.title.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
