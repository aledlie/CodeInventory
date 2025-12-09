# Tools & Utility Modules - Visual Mockups

This document contains detailed ASCII mockups for all three pages in the Tools feature.

---

## Page 1: Tools Overview (`/dashboard/tools`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Tools & Utility Modules                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬──────────────────┬───────────────────┐
│ Total            │ Avg Extract      │ Highly           │ Ready for         │
│ Modules          │ Potential        │ Modular          │ Extraction        │
│                  │                  │                  │                   │
│    47            │    72%           │    18            │    12             │
│ utility          │ ████████░░       │ modules          │ high-potential    │
│ modules          │                  │ 38%              │ candidates        │
│ [📁]             │ [📈]             │ [✓]              │ [🚀]              │
└──────────────────┴──────────────────┴──────────────────┴───────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Modularity Distribution                                                     │
│                                                                             │
│  [████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  │
│                                                                             │
│  ■ Highly Modular: 38%  ■ Modular: 45%  ■ Semi-Modular: 15%  ■ Coupled: 2%│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Filter & Search                                                             │
│ ┌──────────────────────────┐                                                │
│ │ 🔍 Search modules...     │  Sort by: [Extraction% ▼]                     │
│ └──────────────────────────┘                                                │
│                                                                             │
│ Modularity: [All ▼]  Type: [○ All] [○ Classes] [○ Functions] [○ Both]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ FILE PATH                                  MODULARITY    EXTRACT%   ACTIONS │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📄 src/utils/data-transformers.py                                          │
│    [Highly Modular]  5 functions • 2 classes • 3 external deps             │
│                                               ████████░░ 89%     [View →]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📄 src/analyzers/analyzer_optimizer.py                                     │
│    [Modular]  8 functions • 1 class • 5 internal deps                      │
│                                               ███████░░░ 78%     [View →]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📄 src/validators/schema_validator.py                                      │
│    [Modular]  12 functions • 0 classes • 7 deps                            │
│                                               ███████░░░ 72%     [View →]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📄 src/generators/rss_generator.py                                         │
│    [Semi-Modular]  4 functions • 1 class • 12 internal deps                │
│                                               ████░░░░░░ 45%     [View →]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📄 src/analyzers/code_quality.py                                           │
│    [Semi-Modular]  6 functions • 2 classes • 8 deps                        │
│                                               ████░░░░░░ 42%     [View →]  │
└─────────────────────────────────────────────────────────────────────────────┘

[Showing 1-5 of 47]  [← Prev]  [1] [2] [3] [4] [5] ... [10]  [Next →]
```

**Key Features**:
- 4 metric cards with icons and progress indicators
- Stacked bar chart with legend
- Search box with icon
- Filter dropdowns and toggle buttons
- Table with expandable rows showing metadata
- Extraction potential bars with percentages
- Pagination controls

---

## Page 2: Module Detail (`/dashboard/tools/$moduleId`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Tools > analyzer_optimizer.py                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📄 analyzer_optimizer.py                              [Modular]             │
│                                                                             │
│ Extraction Potential                                                        │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │                                 78%                                   │   │
│ │              [═════════════════════════════════░░░░░░░░]             │   │
│ │            0% ←────────────────────┴─────────────────→ 100%          │   │
│ │                              (Gauge Needle)                           │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ [8 Functions] • [1 Class] • [src/analyzers/] • [247 lines]                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┬────────────────────┬────────────────────────────────┐
│ External           │ Internal           │ Tool Candidates                │
│ Dependencies       │ Dependencies       │                                │
│                    │                    │                                │
│ 📦 3 packages      │ 🔗 5 modules       │ ⚙️ 2 extractable              │
│                    │                    │    High potential              │
│ • json             │ • utils/cache      │                                │
│ • hashlib          │ • utils/logger     │    [View Details →]            │
│ • time             │ • analyzers/base   │                                │
│                    │ • generators/schema│                                │
│                    │ • validators/common│                                │
│                    │                    │                                │
└────────────────────┴────────────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Dependency Visualization                                                    │
│                                                                             │
│    External Deps           This Module              Internal Deps           │
│                                                                             │
│    ┌────────┐                                                               │
│    │  json  │─────┐                                                         │
│    └────────┘     │         ┌──────────────┐                                │
│                   ├────────▶│  analyzer_   │────┬──────────────┐            │
│    ┌────────┐     │         │  optimizer   │    │              │            │
│    │hashlib │─────┤         └──────────────┘    │              │            │
│    └────────┘     │                             ▼              ▼            │
│                   │                       utils/cache   analyzers/base      │
│    ┌────────┐     │                             │              │            │
│    │  time  │─────┘                             ▼              ▼            │
│    └────────┘                               utils/logger  generators/schema │
│                                                  │                           │
│                                                  ▼                           │
│                                           validators/common                 │
│                                                                             │
│    Legend: ━━━ External Flow    ━━━ Internal Flow                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Tool Candidates in This Module                                              │
│                                                                             │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ ⚙️ AnalyzerCache                                  [Modular]           │   │
│ │ Class • Line 86 • 8 methods                   ███████░░░ 78%         │   │
│ │                                                                       │   │
│ │ Good modularity with few external dependencies                       │   │
│ │                                                      [View Details →] │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ ⚙️ compute_file_hash                        [Highly Modular]          │   │
│ │ Function • Line 142 • Pure utility           █████████░ 95%          │   │
│ │                                                                       │   │
│ │ Zero external dependencies, perfect extraction candidate             │   │
│ │                                                      [View Details →] │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ▼ Extraction Guide                                          [Collapse ▲]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ► Step 1: Assess Dependencies                                      [✓]     │
│   ✓ All external dependencies are standard library                         │
│   ⚠ 5 internal dependencies need review                                    │
│                                                                             │
│ ► Step 2: Create Package Structure                                 [ ]     │
│   Suggested package name: analyzers-cache-utils                            │
│   [Copy Package Template]                                                   │
│                                                                             │
│ ► Step 3: Extract Core Functionality                               [ ]     │
│   2 tool candidates ready for extraction                                   │
│   [Generate Extraction Script]                                              │
│                                                                             │
│ ► Step 4: Update Import Statements                                 [ ]     │
│   5 files will need import updates                                         │
│   [Show Affected Files]                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Related Modules                                                             │
│                                                                             │
│ Files that import this module:                                             │
│ • src/analyzers/code_quality.py                                            │
│ • src/analyzers/dependencies.py                                            │
│ • src/analyzers/test_coverage.py                                           │
│                                                                             │
│ Files this module imports:                                                  │
│ • src/utils/cache.py                                                       │
│ • src/analyzers/base.py                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Hero section with large extraction gauge
- 3-column stats grid
- Interactive dependency graph (SVG)
- Tool candidate cards with hover effects
- Collapsible extraction guide with checkboxes
- Related modules with clickable links

---

## Page 3: Tool Candidate Detail (`/dashboard/tools/candidate/$candidateName`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Tools > analyzer_optimizer.py > AnalyzerCache                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙️  AnalyzerCache                                                           │
│    Class Definition                                         [Modular]       │
│                                                                             │
│    Extraction Potential: 78%                                                │
│    [████████████████████████████████████░░░░░░░░░░░░]                      │
│                                                                             │
│    [📄 analyzer_optimizer.py] • [Line 86] • [8 methods]                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬────────────────────────────┐
│ Type         │ Complexity   │ Dependencies │ Package Name               │
│              │              │              │                            │
│ Class        │ [Moderate]   │ 3 external   │ analyzers-cache            │
│ 8 methods    │              │ 2 internal   │                            │
└──────────────┴──────────────┴──────────────┴────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ℹ️ Why Extract This?                                                        │
│                                                                             │
│ Good modularity with few external dependencies. This caching utility is    │
│ self-contained and could benefit other projects. The class provides        │
│ generic caching functionality that isn't specific to the analyzer domain.  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Dependency Analysis                                                         │
│                                                                             │
│ External (Standard Library)                                                 │
│ ✓ json       - JSON serialization                                          │
│ ✓ hashlib    - Content hashing                                             │
│ ✓ time       - Timestamp tracking                                          │
│                                                                             │
│ Internal (Project-Specific)                                                 │
│ ⚠ utils.logger - Can be abstracted to logging interface                    │
│ ⚠ config.paths - Can be parameterized                                      │
│                                                                             │
│ Extraction Impact: [Low]                                                    │
│ These dependencies can easily be parameterized or abstracted                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Dependency Graph                                                            │
│                                                                             │
│   Standard Library         AnalyzerCache        Project Code               │
│   ┌──────────┐                                                              │
│   │   json   │────┐                                                         │
│   └──────────┘    │       ┌─────────────┐                                  │
│   ┌──────────┐    ├──────▶│AnalyzerCache│────┬────────────┐                │
│   │ hashlib  │────┤       │  + cache()  │    │            │                │
│   └──────────┘    │       │  + get()    │    │            │                │
│   ┌──────────┐    │       │  + clear()  │    ▼            ▼                │
│   │   time   │────┘       └─────────────┘  logger       paths              │
│   └──────────┘                                                              │
│                                                                             │
│   Legend: ■ Easily Replaceable  ■ Needs Abstraction                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Code Preview                                                  [⤢ Expand]    │
├─────────────────────────────────────────────────────────────────────────────┤
│  86  class AnalyzerCache:                                    [📋 Copy]      │
│  87      """Generic caching utility for analysis results."""               │
│  88                                                                         │
│  89      def __init__(self, cache_dir: str):                               │
│  90          self.cache_dir = Path(cache_dir)                              │
│  91          self.cache_dir.mkdir(parents=True, exist_ok=True)             │
│  92                                                                         │
│  93      def cache(self, key: str, data: Any) -> None:                     │
│  94          """Store data in cache with content hash."""                  │
│  95          cache_file = self._get_cache_path(key)                        │
│  96          with open(cache_file, 'w') as f:                              │
│  97              json.dump(data, f)                                         │
│  98                                                                         │
│  99      def get(self, key: str) -> Optional[Any]:                         │
│ 100          """Retrieve cached data if exists."""                         │
│ 101          cache_file = self._get_cache_path(key)                        │
│                                                                             │
│                         [Show Full Definition (124 lines)]                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ▼ Extraction Instructions                                    [Collapse ▲]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ► Step 1: Create Package Structure                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ $ mkdir -p analyzers-cache-utils/src                                │   │
│   │ $ cd analyzers-cache-utils                                          │   │
│   │                                                                     │   │
│   │ [Copy Commands] [Generate with CLI]                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ► Step 2: Extract Class Definition                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Copy lines 86-210 from analyzer_optimizer.py to:                   │   │
│   │ analyzers-cache-utils/src/cache.py                                 │   │
│   │                                                                     │   │
│   │ [Copy Code] [Download as File]                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ► Step 3: Abstract Dependencies                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Replace internal imports:                                          │   │
│   │                                                                     │   │
│   │ - from utils.logger import Logger                                  │   │
│   │ + import logging                                                   │   │
│   │                                                                     │   │
│   │ - from config.paths import CACHE_DIR                               │   │
│   │ + # Pass cache_dir as constructor parameter                        │   │
│   │                                                                     │   │
│   │ [Show Full Diff]                                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ► Step 4: Configure Package                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ pyproject.toml:                                                    │   │
│   │ ┌───────────────────────────────────────────────────────────────┐   │   │
│   │ │ [project]                                                     │   │   │
│   │ │ name = "analyzers-cache-utils"                                │   │   │
│   │ │ version = "1.0.0"                                             │   │   │
│   │ │ dependencies = []  # Only stdlib!                             │   │   │
│   │ └───────────────────────────────────────────────────────────────┘   │   │
│   │                                                                     │   │
│   │ [Copy Configuration] [Download Template]                           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ► Step 5: Update Original Project                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Files that need import updates (5 total):                          │   │
│   │                                                                     │   │
│   │ 1. analyzer_optimizer.py  - Delete class, add import               │   │
│   │ 2. code_quality.py        - Update import statement                │   │
│   │ 3. dependencies.py        - Update import statement                │   │
│   │                                                                     │   │
│   │ [Show All Files] [Generate Migration Script]                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ► Step 6: Test Extraction                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ $ pip install -e ./analyzers-cache-utils                           │   │
│   │ $ python -m pytest tests/                                          │   │
│   │                                                                     │   │
│   │ [Generate Test Script]                                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Suggested Package Configuration                                            │
│                                                                             │
│ Package Name:  analyzers-cache-utils                                       │
│ Version:       1.0.0                                                        │
│ License:       MIT                                                          │
│ Python:        >=3.8                                                        │
│ Dependencies:  None (stdlib only)                                           │
│                                                                             │
│ Entry Points:                                                               │
│ • AnalyzerCache - Main caching class                                        │
│ • compute_hash - Utility function                                           │
│                                                                             │
│ [Copy pyproject.toml] [Copy setup.py] [Copy README.md]                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Impact Analysis                                                             │
│                                                                             │
│ Files Affected: 5                                                           │
│ • analyzer_optimizer.py  (source - delete class definition)                │
│ • code_quality.py        (import update)                                    │
│ • dependencies.py        (import update)                                    │
│ • test_coverage.py       (import update)                                    │
│ • test_analyzer.py       (test update)                                      │
│                                                                             │
│ Estimated Effort: 2-3 hours                                                 │
│ Risk Level: [Low]  ✓                                                        │
│ Breaking Changes: None (if imported correctly)                              │
│                                                                             │
│ [Show Detailed Impact Report]                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Avatar icon with candidate name
- Linear extraction potential bar
- 4-column stats grid
- Info alert with rationale
- Dependency breakdown with categorization
- Interactive dependency graph
- Dark theme code preview with copy button
- Multi-step extraction guide with copy/download buttons
- Package configuration preview
- Impact analysis summary

---

## Interactive Elements Summary

### Overview Page
- **Metric Cards**: Click to apply filters
- **Search**: Real-time filtering with debounce
- **Sort Dropdown**: Change table ordering
- **Filter Controls**: Multi-select chips for modularity/type
- **Table Rows**: Hover effects, click to navigate
- **Pagination**: Standard controls

### Module Detail Page
- **Breadcrumbs**: Navigation back to overview
- **Extraction Gauge**: Animated semi-circle
- **Stats Cards**: Click "View Details" scrolls to section
- **Dependency Graph**: Interactive SVG with hover tooltips
- **Tool Candidate Cards**: Click to navigate to detail
- **Extraction Guide**: Collapsible accordion sections
- **Related Modules**: Clickable links

### Candidate Detail Page
- **Breadcrumbs**: Multi-level navigation
- **Code Preview**: Copy button with feedback, expand button
- **Dependency Graph**: Interactive visualization
- **Extraction Steps**: Copy commands, download files
- **Package Config**: Copy configuration templates
- **Impact Analysis**: Expand to see affected files

---

## Responsive Behavior

### Mobile (< 600px)
```
┌──────────────────────┐
│ Tools Overview       │
├──────────────────────┤
│ [Total: 47]          │
│                      │
│ [Avg: 72%]           │
│                      │
│ [Highly: 18]         │
│                      │
│ [Ready: 12]          │
├──────────────────────┤
│ Distribution Chart   │
│ (Stacked)            │
├──────────────────────┤
│ [🔍 Search...]       │
│ [Filters ▼]          │
├──────────────────────┤
│ Module List          │
│ (Cards, not table)   │
└──────────────────────┘
```

### Tablet (600-960px)
```
┌────────────────────────────────────┐
│ Tools Overview                     │
├────────────────────────────────────┤
│ [Total: 47]  [Avg: 72%]            │
│                                    │
│ [Highly: 18] [Ready: 12]           │
├────────────────────────────────────┤
│ Distribution Chart                 │
├────────────────────────────────────┤
│ [🔍 Search...] [Filters]           │
├────────────────────────────────────┤
│ Module Table (2 columns visible)   │
└────────────────────────────────────┘
```

### Desktop (> 960px)
```
Full width layouts as shown in main mockups
```

---

## Color Coding Reference

```
Modularity Scores:
[Highly Modular]  → Green (#2e7d32)
[Modular]         → Blue (#0288d1)
[Semi-Modular]    → Amber (#ed6c02)
[Coupled]         → Red (#d32f2f)

Extraction Potential Bars:
████████░░ 80-100%  → Green
███████░░░ 50-79%   → Blue
████░░░░░░ 0-49%    → Amber

Extraction Complexity:
[Trivial]   → Light Green
[Moderate]  → Light Blue
[Complex]   → Light Amber
[High]      → Light Red

Dependency Types:
External (stdlib)   → Blue
Internal (project)  → Amber
Replaceable         → Green
Needs Abstraction   → Amber
```

---

## Icon Reference

```
📁 FolderIcon        - Total modules
📈 TrendingUpIcon    - Extraction potential
✓  CheckCircleIcon   - Highly modular
🚀 RocketLaunchIcon  - Ready for extraction
📄 FileIcon          - File/module
⚙️  CodeIcon         - Tool candidate
📦 PackageIcon       - Package/dependency
🔗 LinkIcon          - Internal dependency
🔍 SearchIcon        - Search input
📋 CopyIcon          - Copy to clipboard
⤢  ExpandIcon        - Expand/fullscreen
▼  ExpandMoreIcon    - Collapse/expand
→  ChevronRightIcon  - Navigate/next
```

This completes the visual mockup documentation!

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
- Visual mockups: Complete
- Implementation: Complete (routes, components, hooks, API created)
