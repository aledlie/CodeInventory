# Tools & Utility Modules - UI Design Documentation

This document provides a complete visual design specification for the Tools & Utility Modules feature in the Code Inventory dashboard.

## Overview

The Tools feature helps developers identify modular, extractable code components that could become standalone packages or libraries. It analyzes utility modules and individual tool candidates, providing actionable guidance for code extraction.

## Design System

### Color Scheme

#### Modularity Score Colors
```css
--modularity-highly: #2e7d32 (success.main - Green)
--modularity-modular: #0288d1 (info.main - Blue)
--modularity-semi: #ed6c02 (warning.main - Amber)
--modularity-coupled: #d32f2f (error.main - Red)
```

#### Extraction Potential Gradients
```css
--extraction-high: 80-100% → Success (Green)
--extraction-medium: 50-79% → Info (Blue)
--extraction-low: 0-49% → Warning (Amber)
```

#### Extraction Complexity Colors
```css
Trivial:   success.light (Light Green)
Moderate:  info.light (Light Blue)
Complex:   warning.light (Light Amber)
High:      error.light (Light Red)
```

#### Dependency Type Colors
```css
External (stdlib):     info.main (Blue)
Internal (project):    warning.main (Amber)
Replaceable:           success.main (Green)
Needs Abstraction:     warning.main (Amber)
```

## Page Structure

### 1. Tools Overview Page (`/dashboard/tools`)

**Purpose**: Display all utility modules with filtering, sorting, and navigation to details.

**Key Metrics**:
- Total Modules
- Average Extraction Potential
- Highly Modular Count
- Ready for Extraction Count

**Components**:
- MetricGrid (4 columns)
- ModularityDistributionChart (stacked bar with legend)
- ToolsFilterToolbar (search, sort, filters)
- UtilityModulesTable (paginated table)

**Interactions**:
- Click metric cards to apply filters
- Search by file path
- Sort by extraction potential, modularity, or name
- Filter by modularity level and component type
- Click table rows to navigate to module detail

### 2. Module Detail Page (`/dashboard/tools/$moduleId`)

**Purpose**: Detailed view of a single utility module with extraction guidance.

**Sections**:
1. **Hero**: Module name, modularity badge, extraction gauge
2. **Stats Grid**: External deps, internal deps, tool candidates count
3. **Dependency Visualization**: Interactive graph showing relationships
4. **Tool Candidates**: List of extractable components within module
5. **Extraction Guide**: Step-by-step accordion with actionable tasks

**Components**:
- ExtractionGauge (semi-circular gauge with needle)
- DependencyCard (categorized dependency lists)
- DependencyGraph (SVG visualization)
- ToolCandidateCard (clickable cards for each candidate)

**Interactions**:
- Breadcrumbs for navigation
- Click tool candidates to view details
- Expand/collapse extraction guide
- Scroll to tool candidates section from stats card

### 3. Tool Candidate Detail Page (`/dashboard/tools/candidate/$candidateName`)

**Purpose**: Comprehensive extraction instructions for a specific function/class.

**Sections**:
1. **Hero**: Candidate name, type, modularity, extraction potential
2. **Stats Grid**: Type, complexity, dependencies, package name
3. **Rationale**: Why this should be extracted (alert box)
4. **Dependency Analysis**: Categorized breakdown with impact assessment
5. **Dependency Graph**: Visual representation
6. **Code Preview**: Syntax-highlighted code snippet
7. **Extraction Instructions**: Step-by-step guide with copy buttons
8. **Impact Analysis**: Effort, risk level, breaking changes

**Components**:
- ModularityChip
- ExtractionComplexityChip
- DependencyBreakdown (categorized with icons)
- CodePreview (with line numbers and copy button)
- Accordion for instructions (collapsible steps)

**Interactions**:
- Copy code snippets
- Copy terminal commands
- Download configuration files
- Navigate via breadcrumbs

## Component Specifications

### ModularityChip
```tsx
<ModularityChip score="highly_modular" size="small" />
```
- Color-coded by score
- Labels: "Highly Modular", "Modular", "Semi-Modular", "Coupled"

### ExtractionPotentialBar
```tsx
<ExtractionPotentialBar value={0.78} showLabel={true} height={8} />
```
- Linear progress bar with percentage label
- Color: green (≥80%), blue (≥50%), amber (<50%)
- Animated on load

### ExtractionGauge
```tsx
<ExtractionGauge value={0.78} size={200} />
```
- Semi-circular SVG gauge with animated needle
- Percentage label in center
- Min/max labels at ends

### ModularityDistributionChart
```tsx
<ModularityDistributionChart distribution={stats} total={47} />
```
- Stacked horizontal bar with 4 segments
- Legend with counts and percentages
- Hover effects on segments

### DependencyGraph
```tsx
<DependencyGraph module={module} external={[]} internal={[]} />
```
- SVG visualization with three columns:
  - External dependencies (left)
  - Module (center)
  - Internal dependencies (right)
- Connecting lines with opacity
- Color-coded boxes

### CodePreview
```tsx
<CodePreview
  code="..."
  startLine={86}
  highlightLines={[86, 87, 88]}
  maxHeight={400}
/>
```
- Dark theme code block
- Line numbers
- Syntax highlighting
- Copy button with feedback
- Scrollable with max height

## Visual Hierarchy

### Typography Scale
```
Page Title:      h4 (2.125rem) - "Tools & Utility Modules"
Section Title:   h6 (1.25rem) - "Dependency Analysis"
Card Title:      subtitle1 (1rem) - "External Dependencies"
Body Text:       body2 (0.875rem)
Code:            0.875rem monospace
Caption:         caption (0.75rem)
```

### Spacing Scale
```
Page margins:    mb: 3 (24px)
Section gaps:    spacing: 3 (24px)
Card padding:    p: 3 (24px)
Stack spacing:   spacing: 2 (16px)
Tight spacing:   spacing: 1 (8px)
```

### Border Radius
```
Paper/Card:      default (4px)
Progress bars:   borderRadius: 1 (8px)
Code blocks:     borderRadius: 1 (8px)
Chips:           default (16px)
```

## Responsive Breakpoints

### Mobile (< 600px)
- Single column layouts
- Stack metric cards vertically
- Collapse filters to accordion
- Hide code preview by default
- Sticky header with back button

### Tablet (600-960px)
- 2 column grids for metrics
- Abbreviated file paths with tooltip
- Simplified dependency graph

### Desktop (> 960px)
- Full 3-4 column grids
- Rich interactive visualizations
- Expanded code previews
- Side-by-side comparisons

## Data Flow

```
1. Python analyzers generate tools_report.json
   ├── utility_modules[]
   └── tool_candidates[]

2. Copy to public/data/tools/tools_report.json

3. Dashboard fetches via TanStack Query
   ├── useToolsReport()
   ├── useToolsStatistics()
   ├── useUtilityModule(filePath)
   ├── useToolCandidate(name)
   └── useModuleToolCandidates(modulePath)

4. Components render with Suspense boundaries

5. User interactions trigger navigation/filtering
```

## User Flows

### Flow 1: Discover High-Potential Modules
```
Dashboard → Tools Overview
  ↓
View "Ready for Extraction" metric (12 candidates)
  ↓
Click metric or filter by extraction_potential > 0.8
  ↓
Table shows high-potential modules
  ↓
Click module row → Module Detail
  ↓
Review extraction guide
  ↓
Click tool candidate → Candidate Detail
  ↓
Copy extraction instructions
```

### Flow 2: Analyze Dependencies
```
Module Detail Page
  ↓
Examine dependency graph
  ↓
Click dependency → See usage details
  ↓
Assess if deps can be abstracted
  ↓
Review "Related Modules"
  ↓
Click importing file → See usage context
```

### Flow 3: Extract Tool Candidate
```
Candidate Detail Page
  ↓
Read rationale
  ↓
Review dependency analysis
  ↓
Expand extraction instructions
  ↓
Copy package structure template
  ↓
Download code snippet
  ↓
Copy package configuration
  ↓
Review impact analysis
  ↓
Follow step-by-step guide
```

## Accessibility

- Color contrast meets WCAG AA standards
- All interactive elements keyboard accessible
- Focus indicators visible
- Screen reader labels on icons
- ARIA labels on graphs/charts
- Progress bars have text alternatives

## Performance Considerations

- Code splitting with React.lazy()
- Suspense boundaries for data fetching
- Pagination for large module lists
- Virtual scrolling for 100+ items
- Memoized filter/sort operations
- Debounced search input

## File Organization

```
src/
├── features/dashboard/
│   ├── api/
│   │   └── toolsApi.ts              # Data fetching functions
│   ├── hooks/
│   │   └── useToolsData.ts          # TanStack Query hooks
│   ├── types/
│   │   └── tools.ts                 # TypeScript interfaces
│   └── components/tools/
│       ├── index.ts                 # Barrel export
│       ├── ModularityChip.tsx
│       ├── ExtractionPotentialBar.tsx
│       ├── ExtractionGauge.tsx
│       ├── ExtractionComplexityChip.tsx
│       ├── ModularityDistributionChart.tsx
│       ├── UtilityModulesTable.tsx
│       ├── ToolsFilterToolbar.tsx
│       ├── DependencyCard.tsx
│       ├── DependencyGraph.tsx
│       ├── DependencyBreakdown.tsx
│       ├── ToolCandidateCard.tsx
│       └── CodePreview.tsx
└── routes/dashboard/tools/
    ├── index.tsx                    # Overview page
    ├── $moduleId.tsx                # Module detail
    └── candidate/
        └── $candidateName.tsx       # Candidate detail
```

## Implementation Checklist

- [x] Create type definitions (tools.ts)
- [x] Create API functions (toolsApi.ts)
- [x] Create TanStack Query hooks (useToolsData.ts)
- [x] Create visual components (12 components)
- [x] Create overview page route
- [x] Create module detail page route
- [x] Create candidate detail page route
- [x] Add barrel export for components
- [ ] Add to dashboard navigation menu
- [ ] Generate sample tools_report.json
- [ ] Test with real analyzer data
- [ ] Add unit tests for components
- [ ] Add E2E tests for user flows
- [ ] Optimize performance with profiling
- [ ] Add error boundaries
- [ ] Add loading skeletons
- [ ] Document component API

## Next Steps

1. **Generate Sample Data**: Create a sample `tools_report.json` with realistic data
2. **Navigation Integration**: Add "Tools" link to dashboard sidebar
3. **Error Handling**: Add error boundaries and fallback UI
4. **Loading States**: Replace SuspenseLoader with skeleton components
5. **Testing**: Unit tests for components, integration tests for pages
6. **Real Data Integration**: Connect to actual Python analyzer output
7. **Code Fetching**: Implement real code preview from source files
8. **Export Features**: Add CSV/JSON export for reports
9. **Analytics**: Track which modules/candidates are viewed most
10. **AI Suggestions**: Integrate with LLM for extraction recommendations

## Design Principles Applied

1. **Clarity First**: Information hierarchy guides attention
2. **Progressive Disclosure**: Details revealed on demand
3. **Visual Consistency**: Unified color scheme and spacing
4. **Actionable Insights**: Every metric has a clear action
5. **Contextual Help**: Rationales and tooltips throughout
6. **Error Prevention**: Clear impact analysis before extraction
7. **Efficiency**: Filters, search, and sorting for quick discovery

## Mockup ASCII Art Summary

```
┌─────────────────────────────────────────────────────────────┐
│ TOOLS OVERVIEW                                              │
├─────────────────────────────────────────────────────────────┤
│ [Total: 47] [Avg: 72%] [Highly: 18] [Ready: 12]            │
│                                                             │
│ Modularity Distribution                                     │
│ [████████████░░░░░░░░] Highly: 38% Modular: 45% ...        │
│                                                             │
│ [🔍 Search...] [Sort ▼] [Filters...]                       │
│                                                             │
│ File Path              Modularity  Extract%  [View→]       │
│ ├─ data-transformers  [Highly]    ████ 89%                 │
│ ├─ cache-utils        [Modular]   ███░ 78%                 │
│ └─ validator          [Modular]   ███░ 72%                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ MODULE DETAIL: analyzer_optimizer.py                        │
├─────────────────────────────────────────────────────────────┤
│ [Modular] Extraction: 78% [GAUGE]                          │
│                                                             │
│ [3 External] [5 Internal] [2 Candidates]                   │
│                                                             │
│ Dependency Graph:                                           │
│ External → [Module] → Internal                              │
│                                                             │
│ Tool Candidates:                                            │
│ ┌─ AnalyzerCache    [Modular] ████ 78% [View→]            │
│ └─ compute_hash     [Highly]  █████ 95% [View→]           │
│                                                             │
│ Extraction Guide ▼                                          │
│ Step 1: Assess Dependencies ✓                              │
│ Step 2: Create Package Structure                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CANDIDATE DETAIL: AnalyzerCache                             │
├─────────────────────────────────────────────────────────────┤
│ ⚙️ AnalyzerCache [Modular]                                 │
│ Extraction: 78% [████████████████░░░░]                     │
│                                                             │
│ [Class] [Moderate] [3 deps] [analyzers-cache]              │
│                                                             │
│ Rationale: Good modularity with few external dependencies  │
│                                                             │
│ Dependencies:                                               │
│ ✓ json, hashlib, time (stdlib)                             │
│ ⚠ utils.logger, config.paths (needs abstraction)           │
│                                                             │
│ Code Preview:                                               │
│ 86  class AnalyzerCache:                                    │
│ 87      """Caching utility..."""                            │
│                                                             │
│ Extraction Instructions ▼                                   │
│ Step 1: Create Package [Copy]                              │
│ Step 2: Extract Code [Download]                            │
│ Step 3: Abstract Deps                                       │
│ Step 4: Configure Package [Copy]                           │
│                                                             │
│ Impact: 2-3 hours • Low Risk • No Breaking Changes         │
└─────────────────────────────────────────────────────────────┘
```

## Conclusion

This design provides a comprehensive visual storytelling experience for code modularity analysis. The three-page flow guides developers from discovery through analysis to actionable extraction instructions, with visual indicators and interactive elements at every step.

The design follows Material UI v7 patterns, uses consistent color coding, and provides clear visual hierarchy. All components are implemented with modern React patterns (hooks, Suspense, TypeScript) and are ready for integration with the existing dashboard.

---

## Git Activity

**Last Updated**: 2025-12-09

### Related Commits

| Commit | Date | Description |
|--------|------|-------------|
| `d632264` | 2025-12-09 | chore: update project configuration and generated files |
| `bd7dd19` | 2025-12-09 | feat(analyzer): add identify_tools python analyzer |
| `098b1bd` | 2025-12-09 | feat(routes): add phase 3 routes for trends, graph, and tools |
| `aceed99` | 2025-12-09 | feat(dashboard): add trends and dependency graph pages |
| `40cb3b3` | 2025-12-09 | feat(tools): add tools & utility modules visualization components |
| `183ebea` | 2025-12-09 | feat(graph): add dependency graph visualization components |
| `36fc699` | 2025-12-09 | feat(charts): add trend chart components for phase 3 |
| `decfb25` | 2025-12-09 | feat(hooks): add phase 3 data and visualization hooks |
| `b47a4f1` | 2025-12-09 | feat(api): add phase 3 data fetching apis |
| `630fdbc` | 2025-12-09 | feat(types): add phase 3 visualization and tools type definitions |

### Status
- Type definitions: Created
- UI Design spec: Complete
- Component implementation: Complete (12 components)
- Page routes: Complete (3 pages)
- Python analyzer: Created (identify_tools.py)
