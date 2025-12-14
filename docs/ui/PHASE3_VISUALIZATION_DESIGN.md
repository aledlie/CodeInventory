# Phase 3 Visualization Design Specification

**Code Inventory Dashboard - Visual Storytelling Enhancement**

## Overview

Phase 3 transforms static metrics into interactive visual narratives that help developers understand code health trends, identify critical patterns, and take informed actions. This document provides detailed specifications for four visualization features:

1. **Trend Charts** - Historical metrics over time
2. **Interactive Dependency Graph** - Visual module relationship explorer
3. **Historical Metrics Comparison** - Multi-run analysis comparison
4. **Custom Report Generation** - Export and sharing capabilities

---

## Design Principles

### Visual Hierarchy
- **Primary**: Immediate insights (big numbers, trend direction)
- **Secondary**: Supporting details (axes, labels, tooltips)
- **Tertiary**: Contextual information (legends, annotations)

### Colorblind-Friendly Palette
Building on the existing MUI theme, we extend with accessible color schemes:

```typescript
// Sequential scale (intensity)
qualityScale: ['#e7f5e1', '#51cf66', '#28a745', '#1e7e34']  // Light to dark green

// Diverging scale (good/neutral/bad)
divergingScale: ['#28a745', '#ff9800', '#dc3545']  // Green/Orange/Red

// Categorical scale (distinct items)
categoricalPalette: [
  '#0066cc',  // Primary blue
  '#ff9800',  // Warning orange
  '#28a745',  // Success green
  '#17a2b8',  // Info cyan
  '#6c757d',  // Gray
  '#dc3545',  // Error red
]

// Colorblind-safe alternatives (Okabe-Ito palette)
colorblindSafe: [
  '#0173B2',  // Blue
  '#DE8F05',  // Orange
  '#029E73',  // Green
  '#CC78BC',  // Purple
  '#CA9161',  // Brown
  '#949494',  // Gray
]
```

### Accessibility Standards
- WCAG AA contrast ratios maintained
- All charts include ARIA labels and descriptions
- Keyboard navigation for interactive elements
- Screen reader support with data tables as fallbacks
- Motion respects `prefers-reduced-motion`

---

## 1. Trend Charts

### Visual Narrative
"Tell the story of code health evolution over time"

### Chart Types & Metrics

#### A. Quality Score Timeline (Line Chart)
**Story**: "Is our code quality improving or degrading?"

```
Quality Score Over Time
100% ┤                                    ╭─╮
 90% ┤                          ╭────────╯ ╰─
 80% ┤                    ╭─────╯
 70% ┤          ╭─────────╯
 60% ┤    ╭─────╯
 50% ┼────╯
     └────────────────────────────────────────
      Week 1  Week 2  Week 3  Week 4  Week 5

Visual Elements:
- Line: #0066cc (primary blue), 3px width
- Area fill: rgba(0, 102, 204, 0.1) - subtle gradient
- Threshold lines: 80% (green), 60% (orange)
- Data points: Circles on hover (8px)
- Annotations: "Refactored auth module" on improvement spikes
```

**Interaction Patterns**:
- **Hover**: Tooltip shows exact score, date, delta from previous
- **Click point**: Navigate to that specific analysis run
- **Drag select**: Zoom into time range
- **Right-click point**: "View issues from this run"

**Chart Configuration**:
```typescript
{
  type: 'line',
  data: {
    labels: ['Jan 1', 'Jan 8', 'Jan 15', 'Jan 22', 'Jan 29'],
    datasets: [{
      label: 'Quality Score',
      data: [65, 72, 78, 82, 85],
      borderColor: '#0066cc',
      backgroundColor: 'rgba(0, 102, 204, 0.1)',
      tension: 0.3, // Smooth curves
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 8,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const prev = context.dataset.data[context.dataIndex - 1];
            const delta = prev ? ((value - prev) / prev * 100).toFixed(1) : null;
            return [
              `Score: ${value}%`,
              delta ? `Change: ${delta > 0 ? '+' : ''}${delta}%` : ''
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 50,
        max: 100,
        ticks: { callback: (value) => `${value}%` }
      }
    }
  }
}
```

#### B. Test Coverage Timeline (Line Chart with Bands)
**Story**: "Are we writing tests as we add features?"

```
Test Coverage with New Functions
100% ┤
 80% ┤                          ██████████  (Target Zone)
 60% ┤          ╭───────────────█─────────
 40% ┤    ╭─────╯              ░░░░░░░░░░  (Warning Zone)
 20% ┤────╯
  0% ┼────────────────────────────────────

Visual Elements:
- Line: #28a745 (success green)
- Band 80-100%: rgba(40, 167, 69, 0.1) - "Excellent zone"
- Band 60-80%: rgba(255, 152, 0, 0.1) - "Acceptable zone"
- Secondary line (dashed): Total functions count
- Dual Y-axis: Left (%), Right (absolute count)
```

#### C. Issue Velocity (Stacked Area Chart)
**Story**: "What types of issues are we creating and resolving?"

```
Issue Trends by Severity
100 ┤
 80 ┤              ████████████      Critical
 60 ┤         █████░░░░░░░░░░░░      High
 40 ┤    ████░░░░░▒▒▒▒▒▒▒▒▒▒▒▒      Medium
 20 ┤███░░░░░▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓      Low
  0 ┼────────────────────────────

Visual Elements:
- Stacked areas show composition
- Colors: Critical (#dc3545), High (#ff9800),
          Medium (#17a2b8), Low (#6c757d)
- Total line overlay in bold black
- Smooth transitions between data points
```

#### D. Circular Dependencies Over Time (Bar Chart)
**Story**: "Are we untangling our architecture?"

```
Circular Dependency Chains
12 ┤  ██
10 ┤  ██  ██
 8 ┤  ██  ██
 6 ┤  ██  ██  ██
 4 ┤  ██  ██  ██  ▓▓
 2 ┤  ██  ██  ██  ▓▓  ▓▓
 0 ┼──────────────────────
    W1  W2  W3  W4  W5

Visual Elements:
- Bars: #dc3545 (error red) if >3, #ff9800 if 1-3, #28a745 if 0
- Goal line: Horizontal at 0 (dashed, green)
- Sparkline in header showing 30-day trend
```

### Component Structure

```
src/features/dashboard/
├── components/
│   └── charts/
│       ├── TrendChart.tsx          # Generic line chart wrapper
│       ├── QualityTrendChart.tsx   # Quality-specific config
│       ├── CoverageTrendChart.tsx  # Coverage with dual axis
│       ├── IssueVelocityChart.tsx  # Stacked area chart
│       ├── CircularDepsChart.tsx   # Bar chart with goal line
│       ├── ChartContainer.tsx      # Common wrapper with title/controls
│       ├── ChartLegend.tsx         # Custom legend component
│       └── ChartTooltip.tsx        # Custom tooltip renderer
├── hooks/
│   ├── useChartData.ts             # TanStack Query for time-series data
│   └── useChartTheme.ts            # Chart.js theme provider
├── api/
│   └── trendsApi.ts                # Load historical reports
└── types/
    └── charts.ts                   # Chart data interfaces
```

### Data Structure (Historical Reports)

```typescript
// New type for time-series data
interface HistoricalReport {
  timestamp: string; // ISO 8601
  runId: string;     // Unique identifier
  metrics: {
    qualityScore: number;
    coveragePercentage: number;
    criticalIssues: number;
    circularDeps: number;
    totalFiles: number;
  };
  // Reference to full report files
  reportPaths: {
    quality: string;
    coverage: string;
    dependencies: string;
  };
}

// Trend data aggregator
interface TrendData {
  timeRange: '7d' | '30d' | '90d' | 'all';
  dataPoints: HistoricalReport[];
  summary: {
    trend: 'improving' | 'stable' | 'declining';
    changePercentage: number;
    volatility: number; // Standard deviation
  };
}
```

### Storage Strategy

```
public/data/
├── history/
│   ├── manifest.json              # Index of all historical runs
│   └── runs/
│       ├── 2025-01-15T10:30:00Z/  # ISO timestamp directory
│       │   ├── quality_report.json
│       │   ├── coverage_report.json
│       │   └── dependency_report.json
│       ├── 2025-01-22T10:30:00Z/
│       └── 2025-01-29T10:30:00Z/
└── trends/
    └── summary.json               # Pre-computed trend aggregates
```

**manifest.json structure**:
```json
{
  "runs": [
    {
      "timestamp": "2025-01-29T10:30:00Z",
      "runId": "run_abc123",
      "qualityScore": 85,
      "coveragePercentage": 78,
      "criticalIssues": 2,
      "circularDeps": 1,
      "totalFiles": 156,
      "notes": "Post auth-refactor analysis"
    }
  ],
  "firstRun": "2025-01-01T10:00:00Z",
  "lastRun": "2025-01-29T10:30:00Z",
  "totalRuns": 5
}
```

---

## 2. Interactive Dependency Graph

### Visual Narrative
"Understand your codebase architecture at a glance"

### Graph Visualization Design

#### Layout Algorithm: Force-Directed Graph
Using D3.js force simulation for organic, intuitive layouts:

```
Force Configuration:
- Center: Pull all nodes toward center (strength: 0.1)
- Charge: Repel nodes from each other (strength: -300)
- Link: Connect dependencies (distance: 100, strength: 0.5)
- Collision: Prevent node overlap (radius: 40)
```

#### Visual Encoding System

```
Node Representation:
┌──────────────────┐
│  ComponentName   │  ← Large nodes = Many dependencies
│  • • • • • •     │  ← Dots = Incoming connections
│  ↓ ↓ ↓          │  ← Arrows = Outgoing connections
└──────────────────┘

Node Size: Based on degree centrality
- Small (30px): 0-2 connections
- Medium (50px): 3-5 connections
- Large (70px): 6+ connections
- Huge (100px): 10+ connections (architectural hubs)

Node Color: Based on type
- #0066cc: Application code (src/components)
- #28a745: Utilities/helpers (src/utils)
- #ff9800: Services/API (src/services)
- #dc3545: Problem nodes (circular deps)
- #6c757d: External dependencies

Node Border:
- Solid: No issues
- Dashed 3px #ff9800: Part of circular dependency
- Dashed 5px #dc3545: Circular dependency root

Edge Representation:
─────────→  Normal dependency (1px, #cccccc)
═════════⇒  Strong coupling (3px, #666666, >5 imports)
─ ─ ─ ─ →  Type-only import (dashed, #999999)
⟿⟿⟿⟿⟿⟿⟿⟿⟿  Circular dependency (4px, #dc3545, curved)
```

#### Circular Dependency Highlighting

```
Visualization Pattern:
    ┌─────────────┐
    │  ModuleA    │───┐
    └─────────────┘   │
         ↑            │ Red curved arrows
         │            │ form visual loop
         │            ↓
    ┌─────────────┐   │
    │  ModuleC    │←──│
    └─────────────┘   │
         ↑            │
         │            │
         │            ↓
    ┌─────────────┐
    │  ModuleB    │
    └─────────────┘

On Hover:
- All nodes in cycle pulse with red glow
- Path labels show: "Cycle 1 of 3: A → B → C → A"
- Suggestion tooltip: "Consider: Extract interface to break cycle"
```

### Interaction Patterns

#### 1. Initial Load: Overview Mode
```
Default View:
- All modules visible at 100% scale
- High-level clustering (by directory structure)
- Mini-map in bottom-right corner
- Legend in top-right corner
- Search bar at top
```

#### 2. Hover Interactions
```typescript
onNodeHover(node) {
  // Dim all non-related nodes to 20% opacity
  fadeUnrelated(node);

  // Highlight dependencies
  highlightIncoming(node, '#28a745'); // Green arrows
  highlightOutgoing(node, '#0066cc'); // Blue arrows

  // Show tooltip
  showTooltip({
    title: node.name,
    metrics: {
      'Imports': node.imports.length,
      'Imported by': node.importedBy.length,
      'Lines of code': node.loc,
      'Test coverage': node.coverage + '%',
    },
    actions: [
      'View source file',
      'View dependents',
      'View dependencies',
    ]
  });
}
```

#### 3. Click Interactions
```typescript
onNodeClick(node) {
  // Expand detail panel (right sidebar)
  showDetailPanel({
    node: node,
    tabs: [
      'Dependencies',   // List of imports
      'Dependents',     // List of importers
      'Metrics',        // Size, complexity, coverage
      'Issues',         // Quality issues in this file
      'History',        // How this file's metrics changed
    ]
  });

  // Center and zoom to node
  centerOnNode(node, zoomLevel: 1.5);

  // Highlight 1-hop neighborhood
  highlightNeighborhood(node, hops: 1);
}
```

#### 4. Selection & Filtering
```
Controls (Left Sidebar):
☐ Show external dependencies
☐ Show type-only imports
☑ Show circular dependencies
☐ Show untested files only

Clustering:
( ) None
(•) By directory
( ) By dependency depth
( ) By team/owner

Layout:
( ) Force-directed
( ) Hierarchical (tree)
(•) Circular (hub-and-spoke)
```

#### 5. Path Finding
```
Feature: "Show path between two modules"

Select Mode → Click ModuleA → Click ModuleB

Visualization:
- Shortest path highlighted in bold green
- All alternative paths dimmed to dotted lines
- Path length shown: "3 hops: A → Utils → Services → B"
- Metrics: "Coupling strength: Medium (8 imports along path)"
```

#### 6. Zoom & Pan
```
Mouse:
- Scroll wheel: Zoom in/out (0.1x to 5x)
- Drag background: Pan
- Double-click node: Zoom to fit neighborhood
- Double-click background: Reset to overview

Keyboard:
- +/- : Zoom in/out
- Arrow keys: Pan
- Space + drag: Pan (like map apps)
- F: Focus on selected node
- Esc: Clear selection

Minimap:
┌─────────────┐
│ ╔════╗      │ ← Red box shows viewport
│ ║    ║      │
│ ╚════╝      │
└─────────────┘
```

### Component Structure

```
src/features/dashboard/
├── components/
│   └── dependencyGraph/
│       ├── DependencyGraph.tsx           # Main graph component
│       ├── GraphCanvas.tsx               # D3 rendering surface
│       ├── GraphNode.tsx                 # Node renderer
│       ├── GraphEdge.tsx                 # Edge renderer
│       ├── GraphControls.tsx             # Zoom, pan, filter controls
│       ├── GraphLegend.tsx               # Visual encoding legend
│       ├── GraphMinimap.tsx              # Overview minimap
│       ├── GraphSearch.tsx               # Node search/filter
│       ├── NodeDetailPanel.tsx           # Sidebar with node details
│       ├── CircularDepHighlight.tsx      # Cycle visualization overlay
│       └── PathFinder.tsx                # Path between nodes tool
├── hooks/
│   ├── useDependencyGraph.ts            # Load + transform graph data
│   ├── useGraphLayout.ts                # D3 force simulation
│   ├── useGraphInteraction.ts           # Hover, click, selection
│   └── useGraphFilters.ts               # Filter/cluster logic
├── utils/
│   ├── graphTransform.ts                # DependencyReport → D3 graph
│   ├── circularDetection.ts            # Find cycles (Tarjan's algo)
│   ├── pathFinding.ts                   # Shortest path (Dijkstra)
│   └── graphMetrics.ts                  # Centrality, coupling metrics
└── types/
    └── graph.ts                          # Graph data structures
```

### Data Transformation

```typescript
// Transform DependencyReport → D3 Graph
interface GraphNode {
  id: string;           // File path
  label: string;        // Display name
  type: 'app' | 'util' | 'service' | 'external';
  size: number;         // Based on degree
  metrics: {
    imports: number;
    importedBy: number;
    loc: number;
    coverage: number;
    issues: number;
  };
  circular: boolean;
  x?: number;           // D3 position
  y?: number;
}

interface GraphEdge {
  source: string;       // Node ID
  target: string;       // Node ID
  type: 'import' | 'type-import';
  strength: number;     // 1-10 based on import frequency
  circular: boolean;
}

interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
  cycles: Cycle[];
}

function transformToGraph(report: PythonDependencyReport): DependencyGraph {
  // 1. Create nodes from dependency_graph keys
  // 2. Create edges from dependency_graph values
  // 3. Calculate node sizes (degree centrality)
  // 4. Detect circular dependencies (Tarjan's algorithm)
  // 5. Cluster nodes (by directory or k-means)
  // 6. Return graph structure
}
```

### Performance Optimization

```typescript
// For large codebases (1000+ files), use progressive rendering
const GraphOptimizations = {
  // Level of Detail (LOD): Show simplified nodes when zoomed out
  LOD: {
    far: 'Show only directory clusters',    // zoom < 0.5x
    medium: 'Show files, hide labels',      // zoom 0.5-1.5x
    close: 'Show files with full labels',   // zoom > 1.5x
  },

  // Viewport culling: Only render visible nodes
  culling: true,
  cullPadding: 200, // px beyond viewport

  // WebGL rendering for 500+ nodes
  useWebGL: nodes.length > 500,

  // Lazy load external dependencies
  lazyLoadExternal: true,

  // Debounce force simulation updates
  simulationThrottle: 16, // 60fps
};
```

---

## 3. Historical Metrics Comparison

### Visual Narrative
"Compare different points in time to understand progress"

### Comparison Modes

#### A. Side-by-Side Comparison
```
┌─────────────────────────────┬─────────────────────────────┐
│   Run: Jan 15 (Baseline)    │   Run: Jan 29 (Current)     │
├─────────────────────────────┼─────────────────────────────┤
│ Quality Score: 72%           │ Quality Score: 85% ↑+13%    │
│ Coverage: 65%                │ Coverage: 78% ↑+13%         │
│ Critical Issues: 8           │ Critical Issues: 2 ↓-6      │
│ Circular Deps: 5             │ Circular Deps: 1 ↓-4        │
│ Files: 142                   │ Files: 156 ↑+14             │
└─────────────────────────────┴─────────────────────────────┘

Visual Elements:
- Green up arrows for improvements
- Red down arrows for regressions (or reversed for "lower is better")
- Percentage change prominently displayed
- Color-coded backgrounds: rgba(40,167,69,0.05) for improvements
```

#### B. Delta Waterfall Chart
```
Change in Issues from Jan 15 to Jan 29

Start: 45 issues ■■■■■■■■■■■■■■■■■■■■■■■
                 │
Fixed security   │ -12 ████████████
Fixed best prac. │ -8  ████████
New features     │ +3  ▓▓▓
Refactoring      │ -5  █████
                 │
End: 23 issues   ■■■■■■■■■■

Visual Elements:
- Green bars = Reductions (pointing down)
- Red bars = Additions (pointing up)
- Final bar shows net change with bold outline
- Annotations explain what caused changes
```

#### C. Radar Chart (Multi-Dimensional)
```
Codebase Health Comparison
            Quality ⚫
                ↑
                │     ⚫ Jan 29
          ⚫────┼────⚫
                │   ⚫ Jan 15
Coverage ⚫──────┼──────⚫ Documentation
          ⚫────│────⚫
                │ ⚫⚫
                ↓
          Performance

Visual Elements:
- Baseline run in dashed orange line
- Current run in solid blue filled area
- Overlap in purple
- 5-6 dimensions max for readability
```

#### D. Sparkline Matrix
```
Metrics at a Glance (Last 10 Runs)

Quality       ╱╲╱‾╲_      85% (+13%)
Coverage      __╱‾‾‾      78% (+13%)
Issues        ‾╲╲__       23 (-22)
Circular      ‾‾╲___      1 (-4)
Files         __╱‾╱       156 (+14)

Visual Elements:
- Micro charts (100x30px) show trend shape
- Current value + delta prominently shown
- Color coded: green (improving), red (regressing), gray (stable)
- Click expands to full timeline chart
```

### Component Structure

```
src/features/dashboard/
├── components/
│   └── comparison/
│       ├── ComparisonView.tsx           # Main comparison layout
│       ├── RunSelector.tsx              # Dropdown to select runs to compare
│       ├── SideBySideCards.tsx          # MetricCard comparison
│       ├── DeltaWaterfall.tsx           # Waterfall chart
│       ├── RadarComparison.tsx          # Radar chart
│       ├── SparklineMatrix.tsx          # Compact trend matrix
│       ├── IssuesDiff.tsx               # Detailed issue changes
│       ├── FilesDiff.tsx                # New/modified/deleted files
│       └── ComparisonSummary.tsx        # AI-generated summary
├── hooks/
│   ├── useRunComparison.ts             # Load two runs, calculate deltas
│   └── useComparisonMetrics.ts         # Aggregate comparison metrics
└── types/
    └── comparison.ts                    # Comparison data structures
```

### AI-Generated Insights

```
Comparison Summary (Powered by Claude)
────────────────────────────────────────
🎉 Significant Improvements:
- Code quality increased 13% after auth module refactor
- Test coverage up 13% with 45 new test cases
- Eliminated 4/5 circular dependencies

⚠️ Areas Needing Attention:
- Performance issues increased from 2 to 5
- 14 new files added without tests
- Database query complexity increased 20%

💡 Recommendations:
1. Add tests for newly created files
2. Review database query optimizations
3. Monitor performance metrics in CI/CD

📊 Overall: Strong progress with minor concerns
────────────────────────────────────────
```

---

## 4. Custom Report Generation

### Visual Narrative
"Share insights with your team and stakeholders"

### Export Formats

#### A. PDF Report (Executive Summary)

```
Layout Structure:
┌────────────────────────────────────────┐
│  Code Health Report                     │
│  Generated: Jan 29, 2025                │
│  Repository: acme-app                   │
├────────────────────────────────────────┤
│  [Page 1: Executive Summary]            │
│  ┌──────────┬──────────┬──────────┐   │
│  │ Quality  │ Coverage │  Issues  │   │
│  │   85%    │   78%    │    23    │   │
│  └──────────┴──────────┴──────────┘   │
│                                         │
│  Key Highlights:                        │
│  ✓ Quality improved 13% this month      │
│  ✓ Eliminated 4 circular dependencies   │
│  ⚠ 14 files added without tests         │
├────────────────────────────────────────┤
│  [Page 2: Quality Trends]               │
│  [Line chart showing 30-day trends]     │
├────────────────────────────────────────┤
│  [Page 3: Top Issues by Severity]       │
│  [Table with critical/high issues]      │
├────────────────────────────────────────┤
│  [Page 4: Dependency Architecture]      │
│  [Simplified dependency graph]          │
├────────────────────────────────────────┤
│  [Page 5: Recommendations]              │
│  [AI-generated action items]            │
└────────────────────────────────────────┘

Features:
- Print-optimized layout (A4/Letter)
- High-contrast colors for B&W printing
- Company logo and branding
- Configurable sections (toggle on/off)
- Version watermark: "Draft" or "Final"
```

#### B. Interactive HTML Report (Self-Contained)

```html
<!-- Single HTML file with embedded data and CSS -->
<!DOCTYPE html>
<html>
<head>
  <title>Code Health Report - acme-app</title>
  <style>/* Embedded CSS with dashboard theme */</style>
  <script>/* Chart.js embedded */</script>
  <script>
    // All report data embedded as JSON
    const reportData = { /* ... */ };
  </script>
</head>
<body>
  <!-- Interactive charts and tables -->
  <!-- No external dependencies -->
  <!-- Works offline -->
</body>
</html>

Features:
- No external dependencies (works offline)
- Interactive charts with Chart.js
- Filterable/sortable tables
- Print stylesheet for PDF export from browser
- Shareable via email or file share
```

#### C. Markdown Report (GitHub-Friendly)

```markdown
# Code Health Report
**Generated**: 2025-01-29
**Repository**: acme-app
**Branch**: main

## Executive Summary

| Metric | Value | Change | Status |
|--------|-------|--------|--------|
| Quality Score | 85% | +13% | ✅ Excellent |
| Test Coverage | 78% | +13% | ✅ Good |
| Critical Issues | 2 | -6 | ✅ Low |
| Circular Deps | 1 | -4 | ✅ Low |

## Quality Trends

```chart
type: line
title: Quality Score Over Time
data:
  labels: [Jan 1, Jan 8, Jan 15, Jan 22, Jan 29]
  datasets:
    - label: Quality
      data: [65, 72, 78, 82, 85]
```

## Top Issues

### Critical (2)
- `auth/jwt.ts:45` - Hardcoded credentials detected
- `api/user.ts:123` - SQL injection vulnerability

### High (5)
- `utils/hash.ts:67` - Weak cryptographic algorithm
- ...

## Recommendations

1. **Immediate**: Fix 2 critical security issues
2. **This week**: Add tests for 14 new files
3. **This month**: Refactor remaining circular dependency

---
*Generated by Code Inventory*
```

Features:
- Native GitHub rendering with charts (via mermaid)
- Copy-paste friendly
- Version control friendly
- Can be converted to HTML via Marked.js
```

#### D. JSON Export (API Integration)

```json
{
  "report": {
    "type": "code-health",
    "version": "1.0",
    "generated_at": "2025-01-29T10:30:00Z",
    "repository": {
      "name": "acme-app",
      "branch": "main",
      "commit": "abc123"
    },
    "metrics": {
      "quality_score": 85,
      "coverage_percentage": 78,
      "critical_issues": 2,
      "circular_dependencies": 1,
      "total_files": 156
    },
    "trends": {
      "quality_change_30d": 13,
      "coverage_change_30d": 13,
      "issues_resolved_30d": 22
    },
    "issues": [ /* ... */ ],
    "recommendations": [ /* ... */ ]
  }
}

Features:
- Schema.org vocabulary for metadata
- Machine-readable format
- Easy integration with CI/CD, Slack, JIRA
- Includes URLs to detailed reports
```

#### E. CSV Exports (Spreadsheet Analysis)

```
Files:
- issues_export.csv (all issues with metadata)
- coverage_export.csv (function-level coverage)
- dependencies_export.csv (dependency graph edges)

Example: issues_export.csv
file_path,line,severity,category,message,rule_id
auth/jwt.ts,45,critical,security,Hardcoded credentials,HARDCODED_SECRETS
api/user.ts,123,critical,security,SQL injection risk,SQL_INJECTION
...

Features:
- Import into Excel, Google Sheets
- Pivot tables and custom analysis
- Historical tracking in spreadsheets
- Suitable for compliance reporting
```

### Report Customization UI

```
Report Builder Interface:
┌──────────────────────────────────────────────┐
│  Create Custom Report                         │
├──────────────────────────────────────────────┤
│  Report Type:  ( ) Executive  (•) Technical   │
│                ( ) Compliance ( ) Custom      │
│                                               │
│  Sections to Include:                         │
│  ☑ Executive Summary                          │
│  ☑ Quality Trends (Last 30 days)              │
│  ☑ Top 20 Issues                              │
│  ☐ All Issues (Detail)                        │
│  ☑ Test Coverage Analysis                     │
│  ☑ Dependency Graph                           │
│  ☐ File-by-File Breakdown                    │
│  ☑ Recommendations                            │
│                                               │
│  Format:  [PDF ▼] [HTML] [Markdown] [JSON]   │
│                                               │
│  [Preview Report]  [Generate & Download]     │
└──────────────────────────────────────────────┘
```

### Component Structure

```
src/features/dashboard/
├── components/
│   └── reports/
│       ├── ReportBuilder.tsx            # Report customization UI
│       ├── ReportPreview.tsx            # Live preview
│       ├── ExportButton.tsx             # Format selector + download
│       ├── PDFExporter.tsx              # PDF generation (react-pdf)
│       ├── HTMLExporter.tsx             # Self-contained HTML
│       ├── MarkdownExporter.tsx         # GitHub-friendly MD
│       ├── JSONExporter.tsx             # Machine-readable JSON
│       ├── CSVExporter.tsx              # Spreadsheet exports
│       └── ReportTemplates.tsx          # Pre-built templates
├── hooks/
│   ├── useReportBuilder.ts             # Report config state
│   └── useReportExport.ts              # Export logic
└── utils/
    ├── pdfGenerator.ts                  # PDF rendering
    ├── htmlTemplate.ts                  # HTML template
    ├── markdownFormatter.ts             # MD formatting
    └── csvFormatter.ts                  # CSV formatting
```

---

## Implementation Roadmap

### Phase 3A: Trend Charts (Week 1-2)
**Priority**: High
**Complexity**: Medium

```
Tasks:
□ Install Chart.js + react-chartjs-2
□ Create chart theme provider (useChartTheme)
□ Build TrendChart generic wrapper component
□ Implement QualityTrendChart with sample data
□ Add historical data API (trendsApi.ts)
□ Create manifest.json structure for historical runs
□ Integrate charts into dashboard routes
□ Add time range selector (7d/30d/90d/all)
□ Test with colorblind simulation tools
□ Add keyboard navigation

Success Metrics:
- Charts render in <100ms
- Smooth animations at 60fps
- WCAG AA contrast ratios maintained
- Keyboard accessible
```

### Phase 3B: Dependency Graph (Week 3-4)
**Priority**: High
**Complexity**: High

```
Tasks:
□ Install D3.js (d3-force, d3-selection, d3-zoom)
□ Build graph data transformer (DependencyReport → D3)
□ Create GraphCanvas with force simulation
□ Implement node and edge renderers
□ Add hover/click interaction handlers
□ Build circular dependency highlighter
□ Create detail panel sidebar
□ Add graph controls (zoom, pan, filter)
□ Implement search and path finding
□ Optimize for 500+ node graphs (LOD, culling)
□ Add WebGL fallback for large graphs

Success Metrics:
- Smooth pan/zoom at 60fps
- <200ms to render 500 nodes
- Clear circular dependency visualization
- Intuitive interaction patterns
```

### Phase 3C: Historical Comparison (Week 5)
**Priority**: Medium
**Complexity**: Medium

```
Tasks:
□ Create RunSelector component
□ Build side-by-side comparison view
□ Implement delta waterfall chart
□ Create radar comparison chart
□ Add sparkline matrix
□ Build issue diff viewer
□ Add AI-generated insights (Claude API)
□ Create comparison summary component

Success Metrics:
- Easy to compare any two runs
- Clear visual delta indicators
- Meaningful AI insights
- Fast comparison calculations (<500ms)
```

### Phase 3D: Report Generation (Week 6)
**Priority**: Medium
**Complexity**: Medium

```
Tasks:
□ Install react-pdf for PDF generation
□ Create ReportBuilder UI
□ Implement PDF template and exporter
□ Build self-contained HTML exporter
□ Create Markdown formatter
□ Add CSV export utilities
□ Build report preview component
□ Add template system
□ Test exports in various environments

Success Metrics:
- PDF exports in <5 seconds
- HTML works offline
- Markdown renders correctly on GitHub
- CSV imports cleanly to Excel
```

---

## Accessibility Checklist

### Visual
- [ ] WCAG AA contrast ratios (4.5:1 text, 3:1 UI)
- [ ] Colorblind-friendly palettes (test with simulators)
- [ ] Text alternatives for all visual information
- [ ] Sufficient color contrast in charts
- [ ] Pattern/texture in addition to color coding

### Keyboard
- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order
- [ ] Visible focus indicators
- [ ] Keyboard shortcuts documented
- [ ] Escape key closes modals/panels

### Screen Reader
- [ ] ARIA labels on all charts
- [ ] ARIA live regions for dynamic updates
- [ ] Data tables as fallbacks for charts
- [ ] Alt text for graph screenshots
- [ ] Semantic HTML structure

### Motion
- [ ] Respect prefers-reduced-motion
- [ ] Pausable animations
- [ ] No auto-play videos
- [ ] Disable parallax effects if preferred
- [ ] Alternative static visualizations

---

## Performance Targets

| Component | Target | Measurement |
|-----------|--------|-------------|
| Chart render | <100ms | Time to interactive |
| Graph layout | <200ms | 500 nodes |
| Graph interaction | 60fps | Pan/zoom/hover |
| Data fetch | <500ms | All reports |
| Report export | <5s | PDF generation |
| Bundle size | <200KB | Per route (gzipped) |

---

## Dependencies to Install

```bash
# Chart.js for trend charts
npm install chart.js react-chartjs-2

# D3.js for dependency graph
npm install d3 d3-force d3-selection d3-zoom
npm install @types/d3 @types/d3-force --save-dev

# PDF export
npm install @react-pdf/renderer

# CSV export
npm install papaparse
npm install @types/papaparse --save-dev

# Markdown export
npm install marked
```

---

## File Structure Summary

```
src/features/dashboard/
├── components/
│   ├── charts/                  # Phase 3A: Trend charts
│   │   ├── TrendChart.tsx
│   │   ├── QualityTrendChart.tsx
│   │   ├── CoverageTrendChart.tsx
│   │   ├── IssueVelocityChart.tsx
│   │   ├── CircularDepsChart.tsx
│   │   └── ChartContainer.tsx
│   ├── dependencyGraph/         # Phase 3B: Graph visualization
│   │   ├── DependencyGraph.tsx
│   │   ├── GraphCanvas.tsx
│   │   ├── GraphControls.tsx
│   │   ├── NodeDetailPanel.tsx
│   │   └── CircularDepHighlight.tsx
│   ├── comparison/              # Phase 3C: Historical comparison
│   │   ├── ComparisonView.tsx
│   │   ├── RunSelector.tsx
│   │   ├── SideBySideCards.tsx
│   │   ├── DeltaWaterfall.tsx
│   │   └── RadarComparison.tsx
│   └── reports/                 # Phase 3D: Export functionality
│       ├── ReportBuilder.tsx
│       ├── PDFExporter.tsx
│       ├── HTMLExporter.tsx
│       └── MarkdownExporter.tsx
├── hooks/
│   ├── useChartData.ts
│   ├── useChartTheme.ts
│   ├── useDependencyGraph.ts
│   ├── useGraphLayout.ts
│   ├── useRunComparison.ts
│   └── useReportExport.ts
├── utils/
│   ├── graphTransform.ts
│   ├── circularDetection.ts
│   ├── pathFinding.ts
│   ├── pdfGenerator.ts
│   └── csvFormatter.ts
├── api/
│   ├── trendsApi.ts
│   └── comparisonApi.ts
└── types/
    ├── charts.ts
    ├── graph.ts
    ├── comparison.ts
    └── reports.ts
```

---

## Next Steps

1. **Review & Approve**: Stakeholder review of design specs
2. **Phase 3A Start**: Begin with trend charts (highest value, medium complexity)
3. **Data Strategy**: Decide on historical data storage (JSON manifest vs database)
4. **Design System**: Create Figma mockups for graph interactions
5. **Performance Testing**: Set up metrics tracking for chart/graph rendering

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Author**: Visual Storytelling Specialist
**Status**: Ready for Implementation
