# Preprocessing Pipeline for Tool Identification

A modular, extensible preprocessing pipeline that transforms raw tool identification data into dashboard-optimized output with cleaning, transformation, deduplication, and pre-computed indexes.

## Overview

The preprocessing pipeline processes the output from `ToolIdentifier` through four stages:

```
Raw Report → Cleaning → Transformation → Deduplication → Dashboard Optimization → Optimized Report
```

**Key Features:**
- Path and name normalization
- 20 utility pattern detectors
- Signature-based deduplication with similarity scoring
- Pre-computed indexes for fast filtering/search
- 6 chart types pre-computed for instant visualization
- Zero performance overhead (~9ms for full pipeline)
- 361 tests with 100% stage coverage

## Quick Start

### Basic Usage

```python
from src.analyzers.identify_tools import ToolIdentifier
from src.analyzers.preprocessing import PreprocessingConfig

# Enable preprocessing with default config
config = PreprocessingConfig()
identifier = ToolIdentifier("/path/to/codebase", preprocessing_config=config)

# Analyze and save (preprocessing applied automatically)
identifier.analyze_directory()
identifier.save_report_json("report.json")
```

### Configuration from File

```python
config = PreprocessingConfig.from_file("preprocess_config.json")
identifier = ToolIdentifier("/path/to/codebase", preprocessing_config=config)
```

### CLI Usage

```bash
# Enable all preprocessing stages
python -m src.analyzers.identify_tools /path/to/code --preprocess

# Use custom config file
python -m src.analyzers.identify_tools /path/to/code --preprocess-config config.json
```

## Architecture

```
src/analyzers/preprocessing/
├── __init__.py           # Public exports
├── config.py             # Configuration dataclasses
├── pipeline.py           # Pipeline orchestrator
├── stages/
│   ├── base.py           # PreprocessingStage ABC
│   ├── cleaning.py       # CleaningStage
│   ├── transformation.py # TransformationStage
│   ├── deduplication.py  # DeduplicationStage
│   └── optimization.py   # DashboardOptimizationStage
└── utils/
    ├── path_utils.py     # PathNormalizer
    ├── similarity.py     # SimilarityCalculator
    └── indexing.py       # IndexBuilder, SearchIndex
```

## Configuration

### PreprocessingConfig

```python
from src.analyzers.preprocessing import PreprocessingConfig

config = PreprocessingConfig(
    cleaning=CleaningConfig(
        enabled=True,
        normalize_paths=True,
        normalize_names=True,
        clean_meta_variables=True,
    ),
    transformation=TransformationConfig(
        enabled=True,
        detect_patterns=True,
        calculate_complexity=True,
        resolve_dependencies=True,
        min_pattern_confidence=0.7,
        max_patterns_per_candidate=5,
    ),
    deduplication=DeduplicationConfig(
        enabled=True,
        threshold=0.85,
        group_similar=True,
        keep_representative=True,
    ),
    dashboard=DashboardConfig(
        enabled=True,
        build_indexes=True,
        build_search_index=True,
        precompute_charts=True,
        page_size=20,
    ),
)
```

### JSON Configuration File

```json
{
  "cleaning": {
    "enabled": true,
    "normalize_paths": true,
    "normalize_names": true,
    "clean_meta_variables": true
  },
  "transformation": {
    "enabled": true,
    "detect_patterns": true,
    "calculate_complexity": true,
    "resolve_dependencies": true,
    "min_pattern_confidence": 0.7,
    "max_patterns_per_candidate": 5
  },
  "deduplication": {
    "enabled": true,
    "threshold": 0.85,
    "group_similar": true,
    "keep_representative": true
  },
  "dashboard": {
    "enabled": true,
    "build_indexes": true,
    "build_search_index": true,
    "precompute_charts": true,
    "page_size": 20
  }
}
```

## Pipeline Stages

### Stage 1: Cleaning

Normalizes and cleans raw data for consistency.

**Components:**
- `PathNormalizer`: Converts Windows paths to Unix, handles absolute/relative paths
- `NameNormalizer`: Detects naming conventions (camelCase, snake_case, PascalCase)
- `MetaVariableCleaner`: Removes template variables ($NAME, $VAR, etc.)

**Output Fields Added:**
```python
{
    "_naming_convention": "snake_case",  # or "camelCase", "PascalCase", etc.
    "file_path": "src/utils/helpers.py",  # normalized path
}
```

### Stage 2: Transformation

Enriches data with pattern detection, dependency resolution, and complexity metrics.

**Pattern Detection (20 patterns):**
- `caching` - Cache implementations (lru_cache, memoize, etc.)
- `validation` - Input validation (validate_, is_valid, check_)
- `error_handling` - Exception handling patterns
- `logging` - Logging operations (log_, logger, etc.)
- `retry_logic` - Retry/backoff implementations
- `rate_limiting` - Rate limiter patterns
- `serialization` - JSON/XML/pickle serialization
- `parsing` - Parser implementations
- `string_manipulation` - String utilities (format_, split_, join_)
- `file_operations` - File I/O operations
- `http_operations` - HTTP/API client operations
- `database_operations` - Database query patterns
- `async_operations` - Async/await patterns
- `testing` - Test utilities (assert_, mock_, fixture_)
- `configuration` - Config loading/management
- `formatting` - Output formatting utilities
- `math_operations` - Mathematical computations
- `date_time` - Date/time utilities
- `encryption` - Crypto operations
- `compression` - Compression utilities

**Complexity Calculation:**
```python
{
    "_complexity": {
        "modularity_score": 0.85,      # 0.0-1.0
        "utility_score": 0.92,         # 0.0-1.0
        "abstraction_level": "high",   # low, medium, high
        "coupling_score": 0.15,        # 0.0-1.0 (lower is better)
    }
}
```

**Dependency Graph:**
```python
{
    "_dependency_graph": {
        "nodes": ["json", "requests", "internal.utils"],
        "edges": [
            {"from": "current_module", "to": "json"},
            {"from": "current_module", "to": "requests"},
        ],
        "counts": {
            "internal": 1,
            "external": 1,
            "stdlib": 1,
        }
    }
}
```

### Stage 3: Deduplication

Removes duplicates and groups similar candidates.

**Similarity Algorithm:**
- Name similarity (40% weight) - Levenshtein distance
- Signature similarity (30% weight) - Parameter matching
- Dependency similarity (20% weight) - Jaccard coefficient
- Location similarity (10% weight) - File path proximity

**Configuration:**
- `threshold`: Similarity threshold (default 0.85)
- `group_similar`: Create groups of related candidates
- `keep_representative`: Keep highest-scored candidate per group

**Output Fields:**
```python
{
    "_dedup_info": {
        "group_id": "uuid-string",
        "is_representative": true,
        "similar_count": 3,
    }
}
```

### Stage 4: Dashboard Optimization

Pre-computes data structures for efficient dashboard rendering.

**Indexes Built:**
| Index | Type | Description |
|-------|------|-------------|
| `by_modularity` | Categorical | Filter by modularity score |
| `by_type` | Categorical | Filter by function/class/module |
| `by_pattern` | Multi-value | Filter by detected patterns |
| `by_file` | Categorical | Filter by file path |
| `by_abstraction` | Categorical | Filter by abstraction level |

**Search Index:**
- Tokenized terms from name, description, file_path, type
- Supports prefix and contains matching
- Case-insensitive

**Pre-computed Charts:**
| Chart | Type | Description |
|-------|------|-------------|
| `modularity_distribution` | donut | Breakdown by modularity score |
| `type_distribution` | pie | Function vs class vs module |
| `pattern_distribution` | bar | Count by detected pattern |
| `utility_score_distribution` | bar | Histogram of utility scores |
| `abstraction_level_distribution` | donut | Low/medium/high breakdown |
| `dependency_type_distribution` | pie | Internal/external/stdlib |

**Pagination Metadata:**
```python
{
    "pagination": {
        "total_items": 54,
        "page_size": 20,
        "total_pages": 3,
        "page_ranges": [
            {"page": 0, "start": 0, "end": 20},
            {"page": 1, "start": 20, "end": 40},
            {"page": 2, "start": 40, "end": 54},
        ]
    }
}
```

## Output Format

The preprocessed report includes a `_dashboard` section:

```json
{
  "summary": { ... },
  "tool_candidates": [
    {
      "name": "validate_email",
      "type": "function",
      "file_path": "src/utils/validators.py",
      "modularity_score": "highly_modular",
      "_naming_convention": "snake_case",
      "_patterns": [
        {"pattern": "validation", "confidence": 0.95}
      ],
      "_complexity": {
        "modularity_score": 0.92,
        "utility_score": 0.88,
        "abstraction_level": "high",
        "coupling_score": 0.08
      },
      "_dependency_graph": {
        "nodes": ["re"],
        "edges": [{"from": "validate_email", "to": "re"}],
        "counts": {"internal": 0, "external": 0, "stdlib": 1}
      }
    }
  ],
  "utility_modules": [ ... ],
  "_dashboard": {
    "indexes": {
      "by_modularity": {
        "highly_modular": [0, 2, 5, 8],
        "modular": [1, 3, 6],
        "semi_modular": [4, 7]
      },
      "by_type": { ... },
      "by_pattern": { ... },
      "by_file": { ... },
      "by_abstraction": { ... }
    },
    "search_index": {
      "validate": [0, 3, 5],
      "email": [0],
      "parse": [1, 2],
      ...
    },
    "charts": {
      "modularity_distribution": {
        "name": "modularity_distribution",
        "type": "donut",
        "data": [
          {"label": "Highly Modular", "value": 15, "color": "#28a745", "key": "highly_modular"},
          {"label": "Modular", "value": 25, "color": "#17a2b8", "key": "modular"}
        ],
        "labels": ["Highly Modular", "Modular"],
        "colors": ["#28a745", "#17a2b8"]
      },
      ...
    },
    "pagination": {
      "total_items": 54,
      "page_size": 20,
      "total_pages": 3,
      "page_ranges": [ ... ]
    }
  }
}
```

## TypeScript/React Integration

### Types

```typescript
import type {
  PreprocessedToolsReport,
  PreprocessedToolCandidate,
  DashboardData,
  PrecomputedChart,
  IndexEntries,
  SearchIndex,
  PaginationMeta,
} from '@/features/dashboard/types/tools';
```

### API Functions

```typescript
import {
  fetchPreprocessedToolsReport,
  fetchDashboardData,
  fetchChartData,
  searchToolCandidates,
  filterByModularity,
  filterByType,
  filterByPattern,
  fetchPaginatedCandidates,
  fetchAvailablePatterns,
  fetchPreprocessedStatistics,
} from '@/features/dashboard/api/toolsApi';

// Search using pre-built index
const results = await searchToolCandidates("validate");

// Filter by modularity
const highlyModular = await filterByModularity("highly_modular");

// Get pre-computed chart
const chart = await fetchChartData("modularity_distribution");
```

### React Hooks

```typescript
import {
  usePreprocessedToolsReport,
  useDashboardData,
  useChartData,
  useSearchCandidates,
  useFilterByModularity,
  useFilterByType,
  useFilterByPattern,
  usePaginatedCandidates,
  useAvailablePatterns,
  usePreprocessedStatistics,
} from '@/features/dashboard/hooks/useToolsData';

function ToolsDashboard() {
  const { data: report } = usePreprocessedToolsReport();
  const { data: chart } = useChartData('modularity_distribution');
  const { data: patterns } = useAvailablePatterns();

  // ...
}
```

### Components

```typescript
import {
  ToolSearchInput,
  ToolsFilterToolbarEnhanced,
  PrecomputedChart,
  PrecomputedChartsGrid,
} from '@/features/dashboard/components/tools';

// Search with autocomplete
<ToolSearchInput onSelect={(candidate) => navigate(`/tool/${candidate.name}`)} />

// Filter toolbar with pattern support
<ToolsFilterToolbarEnhanced
  searchQuery={query}
  onSearchChange={setQuery}
  modularityFilter={modularity}
  onModularityFilterChange={setModularity}
  patternFilter={patterns}
  onPatternFilterChange={setPatterns}
  // ...
/>

// Pre-computed chart visualization
<PrecomputedChart chartName="modularity_distribution" />

// All charts in a grid
<PrecomputedChartsGrid />
```

## Performance

| Metric | Value |
|--------|-------|
| Pipeline overhead | ~9ms (0% of total time) |
| Average total time | 1.26s for 19 files |
| Memory usage | Minimal (streaming processing) |
| Test count | 361 tests passing |
| Test coverage | 100% stage coverage |

### Benchmarks

```
Without preprocessing: 1.268s
With preprocessing:    1.262s
Overhead: -0.005s (-0.4%)
```

## Extending the Pipeline

### Custom Stage

```python
from src.analyzers.preprocessing.stages.base import PreprocessingStage, StageResult

class MyCustomStage(PreprocessingStage[dict, dict]):
    def __init__(self, config):
        super().__init__(config)

    @property
    def name(self) -> str:
        return "my_custom_stage"

    def validate_input(self, data: dict) -> tuple[bool, list[str]]:
        errors = []
        if 'tool_candidates' not in data:
            errors.append("Missing tool_candidates")
        return len(errors) == 0, errors

    def process(self, data: dict) -> StageResult[dict]:
        # Transform data
        result = data.copy()
        for candidate in result.get('tool_candidates', []):
            candidate['_my_field'] = self.compute_something(candidate)

        return StageResult.ok(
            result,
            warnings=[],
            metrics={'items_processed': len(result.get('tool_candidates', []))}
        )
```

### Adding to Pipeline

```python
from src.analyzers.preprocessing import PreprocessingPipeline, PreprocessingConfig

config = PreprocessingConfig()
pipeline = PreprocessingPipeline(config)

# Add custom stage after transformation
pipeline.add_stage(MyCustomStage(my_config), after="transformation")
```

## Testing

```bash
# Run all preprocessing tests
pytest tests/unit/preprocessing/ -v

# Run integration tests
pytest tests/integration/test_preprocessing_integration.py -v

# Run with coverage
pytest tests/unit/preprocessing/ --cov=src/analyzers/preprocessing --cov-report=term-missing
```

## API Reference

### PreprocessingPipeline

```python
class PreprocessingPipeline:
    def __init__(self, config: PreprocessingConfig): ...
    def process(self, data: dict) -> PipelineResult: ...
    def add_stage(self, stage: PreprocessingStage, after: str = None): ...
    @property
    def stage_names(self) -> list[str]: ...
```

### PipelineResult

```python
@dataclass
class PipelineResult:
    success: bool
    data: dict
    stages_run: list[str]
    stages_skipped: list[str]
    total_duration_ms: float
    stage_metrics: dict[str, dict]
    errors: list[str]
    warnings: list[str]
```

### StageResult

```python
@dataclass
class StageResult[T]:
    success: bool
    data: T
    errors: list[str]
    warnings: list[str]
    metrics: dict[str, Any]

    @classmethod
    def ok(cls, data: T, warnings: list = None, metrics: dict = None) -> StageResult[T]: ...

    @classmethod
    def error(cls, errors: list[str], data: T = None) -> StageResult[T]: ...
```

## Troubleshooting

### Pipeline not running
```python
# Check if preprocessing is enabled
print(identifier.preprocessor)  # Should not be None

# Verify config
print(config.cleaning.enabled)
print(config.transformation.enabled)
```

### Missing _dashboard data
```python
# Ensure dashboard stage is enabled
config.dashboard.enabled = True
config.dashboard.build_indexes = True
config.dashboard.precompute_charts = True
```

### Slow performance
```python
# Disable unused stages
config.transformation.detect_patterns = False  # Skip pattern detection
config.deduplication.enabled = False  # Skip deduplication
```

### Search not working
```python
# Ensure search index is built
config.dashboard.build_search_index = True

# Check search index exists
print(report.get('_dashboard', {}).get('search_index'))
```

## License

MIT License - See repository root for full license.
