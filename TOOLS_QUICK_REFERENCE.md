# Tools & Utility Modules - Quick Reference

## Quick Start

### View the Pages
```bash
# Start dev server
npm run dev

# Navigate to:
http://localhost:3000/dashboard/tools                    # Overview
http://localhost:3000/dashboard/tools/src%2Futils%2Ffile.py   # Module detail
http://localhost:3000/dashboard/tools/candidate/ClassName     # Candidate detail
```

### Generate Sample Data
```bash
# Run tools analyzer
python3 scripts/run_analysis.py --root ./src --analyzer identify_tools

# Copy to public directory
cp outputs/tools/tools_report*.json public/data/tools/tools_report.json
```

## Component Quick Reference

### Import Components
```tsx
import {
  ModularityChip,
  ExtractionPotentialBar,
  ExtractionGauge,
  ModularityDistributionChart,
  DependencyGraph,
  CodePreview,
  // ... etc
} from '@/features/dashboard/components/tools';
```

### Use Hooks
```tsx
import { useToolsReport, useUtilityModule } from '@/features/dashboard/hooks/useToolsData';

function MyComponent() {
  const { data: report } = useToolsReport();
  const { data: module } = useUtilityModule(filePath);
  // ...
}
```

## Component Usage Examples

### ModularityChip
```tsx
<ModularityChip score="highly_modular" size="small" />
// Colors: success (green), info (blue), warning (amber), error (red)
```

### ExtractionPotentialBar
```tsx
<ExtractionPotentialBar value={0.78} showLabel={true} height={8} />
// value: 0.0-1.0, automatically color-coded
```

### ExtractionGauge
```tsx
<ExtractionGauge value={0.78} size={200} />
// Semi-circular gauge with animated needle
```

### ModularityDistributionChart
```tsx
<ModularityDistributionChart
  distribution={{
    highly_modular: 18,
    modular: 21,
    semi_modular: 7,
    coupled: 1
  }}
  total={47}
/>
```

### DependencyGraph
```tsx
<DependencyGraph
  module={module}
  external={['json', 'hashlib']}
  internal={['utils/cache', 'config/paths']}
/>
// Renders SVG with three columns
```

### CodePreview
```tsx
<CodePreview
  code={sourceCode}
  startLine={86}
  highlightLines={[86, 87, 88]}
  maxHeight={400}
/>
// Dark theme, copy button, line numbers
```

## Data Structure Quick Reference

### UtilityModule
```typescript
{
  file_path: "src/utils/cache.py",
  function_count: 5,
  class_count: 1,
  external_dependencies: ["json", "hashlib"],
  internal_dependencies: ["utils/logger"],
  modularity_score: "modular",        // highly_modular | modular | semi_modular | coupled
  extraction_potential: 0.78          // 0.0 - 1.0
}
```

### ToolCandidate
```typescript
{
  name: "AnalyzerCache",
  type: "class",                      // class | function
  file_path: "src/analyzers/cache.py",
  line_number: 86,
  description: "Class with 8 methods",
  dependencies: ["json", "hashlib", "utils/logger"],
  modularity_score: "modular",
  extraction_potential: 0.78,
  extraction_complexity: "moderate",  // trivial | moderate | complex | high
  suggested_package_name: "analyzers-cache-utils",
  rationale: "Good modularity with few external dependencies..."
}
```

## Color Reference

```typescript
// Modularity Scores
const MODULARITY_COLORS = {
  highly_modular: 'success',  // Green #2e7d32
  modular: 'info',            // Blue #0288d1
  semi_modular: 'warning',    // Amber #ed6c02
  coupled: 'error'            // Red #d32f2f
};

// Extraction Potential
const getExtractionColor = (value: number) => {
  if (value >= 0.8) return 'success';  // Green
  if (value >= 0.5) return 'info';     // Blue
  return 'warning';                     // Amber
};

// Extraction Complexity
const COMPLEXITY_COLORS = {
  trivial: 'success',
  moderate: 'info',
  complex: 'warning',
  high: 'error'
};
```

## Routing

```typescript
// Routes
'/dashboard/tools'                          // Overview
'/dashboard/tools/:moduleId'                // Module detail (URL-encoded path)
'/dashboard/tools/candidate/:candidateName' // Candidate detail

// Navigation helpers
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();

// Go to overview
navigate({ to: '/dashboard/tools' });

// Go to module detail
navigate({
  to: '/dashboard/tools/$moduleId',
  params: { moduleId: encodeURIComponent(filePath) }
});

// Go to candidate detail
navigate({
  to: '/dashboard/tools/candidate/$candidateName',
  params: { candidateName: 'AnalyzerCache' }
});
```

## Filtering & Sorting

```typescript
// Overview page state
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState<'extraction' | 'modularity' | 'name'>('extraction');
const [modularityFilter, setModularityFilter] = useState<ModularityScore | 'all'>('all');
const [typeFilter, setTypeFilter] = useState<'all' | 'classes' | 'functions' | 'both'>('all');

// Filter logic
const filteredModules = useMemo(() => {
  return modules
    .filter(m => m.file_path.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(m => modularityFilter === 'all' || m.modularity_score === modularityFilter)
    .sort((a, b) => {
      if (sortBy === 'extraction') return b.extraction_potential - a.extraction_potential;
      if (sortBy === 'modularity') return /* ... */;
      return a.file_path.localeCompare(b.file_path);
    });
}, [modules, searchQuery, modularityFilter, sortBy]);
```

## API Functions

```typescript
// Fetch entire report
const report = await fetchToolsReport();

// Fetch statistics
const stats = await fetchToolsStatistics();

// Fetch specific module
const module = await fetchUtilityModule('src/utils/cache.py');

// Fetch specific candidate
const candidate = await fetchToolCandidate('AnalyzerCache');

// Fetch candidates in a module
const candidates = await fetchModuleToolCandidates('src/utils/cache.py');
```

## Common Tasks

### Add Tools to Navigation
```tsx
// In DashboardLayout.tsx or Sidebar component
import { Build as BuildIcon } from '@mui/icons-material';

<ListItem button component={Link} to="/dashboard/tools">
  <ListItemIcon>
    <BuildIcon />
  </ListItemIcon>
  <ListItemText primary="Tools" />
</ListItem>
```

### Create Custom Filter
```tsx
function CustomFilter() {
  const [minExtraction, setMinExtraction] = useState(0.5);

  const filtered = modules.filter(m =>
    m.extraction_potential >= minExtraction
  );

  return (
    <Slider
      value={minExtraction}
      onChange={(_, value) => setMinExtraction(value as number)}
      min={0}
      max={1}
      step={0.1}
      marks
    />
  );
}
```

### Export Data
```tsx
function exportModules(modules: UtilityModule[]) {
  const csv = [
    'File Path,Modularity,Extraction Potential',
    ...modules.map(m =>
      `${m.file_path},${m.modularity_score},${m.extraction_potential}`
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tools_export.csv';
  a.click();
}
```

### Track Analytics
```tsx
// In useToolCandidate hook or component
useEffect(() => {
  // Track page view
  if (candidate) {
    trackEvent('tools_candidate_viewed', {
      name: candidate.name,
      type: candidate.type,
      extractionPotential: candidate.extraction_potential
    });
  }
}, [candidate]);
```

## Responsive Breakpoints

```tsx
import { useTheme, useMediaQuery } from '@mui/material';

function ResponsiveLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));   // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-960px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));    // > 960px

  return (
    <Grid container spacing={isMobile ? 2 : 3}>
      <Grid size={{ xs: 12, md: isMobile ? 12 : 6, lg: 4 }}>
        {/* Content */}
      </Grid>
    </Grid>
  );
}
```

## Testing

### Unit Test Example
```tsx
import { render, screen } from '@testing-library/react';
import { ModularityChip } from './ModularityChip';

describe('ModularityChip', () => {
  it('renders highly modular with success color', () => {
    render(<ModularityChip score="highly_modular" />);
    expect(screen.getByText('Highly Modular')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('MuiChip-colorSuccess');
  });
});
```

### Integration Test Example
```tsx
import { renderWithProviders } from '@/test-utils';
import { ToolsOverviewPage } from './index';

describe('ToolsOverviewPage', () => {
  it('displays metrics and table', async () => {
    renderWithProviders(<ToolsOverviewPage />);

    await screen.findByText('Total Modules');
    await screen.findByText('Modularity Distribution');
    await screen.findByRole('table');
  });
});
```

## Troubleshooting

### Data not loading
```bash
# Check file exists
ls -la public/data/tools/tools_report.json

# Check JSON is valid
cat public/data/tools/tools_report.json | python3 -m json.tool

# Check network tab in browser DevTools
# Should see: GET /data/tools/tools_report.json 200 OK
```

### Routing not working
```bash
# Ensure route is registered in TanStack Router
# Check browser console for errors
# Verify URL encoding for special characters in paths
```

### Components not rendering
```bash
# Check Suspense boundaries
# Verify data is not null/undefined
# Check browser console for React errors
```

## Performance Tips

### Optimize Large Lists
```tsx
// Use virtualization for 100+ items
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={modules.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <ModuleRow module={modules[index]} />
    </div>
  )}
</FixedSizeList>
```

### Debounce Search
```tsx
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebouncedValue(searchInput, 300);

// Use debouncedSearch for filtering
```

### Memoize Expensive Calculations
```tsx
const statistics = useMemo(() => {
  return calculateStatistics(modules);
}, [modules]);
```

## File Paths

```
Key files you'll need:
├── src/features/dashboard/
│   ├── api/toolsApi.ts                    # Fetch functions
│   ├── hooks/useToolsData.ts              # React Query hooks
│   ├── types/tools.ts                     # TypeScript types
│   └── components/tools/
│       ├── index.ts                       # Barrel export
│       ├── ModularityChip.tsx
│       ├── ExtractionPotentialBar.tsx
│       └── ... (12 components total)
├── src/routes/dashboard/tools/
│   ├── index.tsx                          # Overview page
│   ├── $moduleId.tsx                      # Module detail page
│   └── candidate/$candidateName.tsx       # Candidate detail page
└── public/data/tools/
    └── tools_report.json                  # Data file
```

## Sample Data Structure

```json
{
  "utility_modules": [
    {
      "file_path": "src/utils/cache.py",
      "function_count": 5,
      "class_count": 1,
      "external_dependencies": ["json", "hashlib"],
      "internal_dependencies": ["utils/logger"],
      "modularity_score": "modular",
      "extraction_potential": 0.78
    }
  ],
  "tool_candidates": [
    {
      "name": "CacheManager",
      "type": "class",
      "file_path": "src/utils/cache.py",
      "line_number": 42,
      "description": "Class with 5 methods",
      "dependencies": ["json", "hashlib"],
      "modularity_score": "highly_modular",
      "extraction_potential": 0.92,
      "extraction_complexity": "trivial",
      "suggested_package_name": "cache-utils",
      "rationale": "Highly modular with minimal dependencies"
    }
  ]
}
```

## Support

For issues or questions:
1. Check TOOLS_UI_DESIGN.md for design decisions
2. Check TOOLS_VISUAL_MOCKUPS.md for visual reference
3. Check TOOLS_IMPLEMENTATION_SUMMARY.md for architecture
4. Review component source code (well-commented)
5. Check browser DevTools console for errors

## Quick Commands

```bash
# Development
npm run dev                              # Start dev server
npm run build                            # Production build
npm run preview                          # Preview production build

# Code quality
npx tsc --noEmit                         # Type check
npm run lint                             # Lint code
npm test                                 # Run tests

# Data generation
python3 scripts/run_analysis.py --root ./src --analyzer identify_tools
cp outputs/tools/tools_report*.json public/data/tools/tools_report.json

# Navigation
open http://localhost:3000/dashboard/tools
```

---

## Git Activity

### Related Commits (2025-12-09)

| Commit | Description |
|--------|-------------|
| `e0c45ff` | feat(dashboard): add Phase 3 visualization type definitions |
| `3d50518` | feat(dashboard): add Phase 2 detail page components and routes |

---

**Last Updated**: 2025-12-09
**Version**: 1.0.0
**Status**: Ready for integration
