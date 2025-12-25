"""Dashboard optimization stage for preprocessing pipeline.

This module provides dashboard-specific optimizations including:
- Index building for fast filtering
- Search index for full-text search
- Chart data pre-computation
- Pagination metadata
"""
from dataclasses import dataclass, field
from typing import Any, Optional

from .base import PreprocessingStage, StageResult
from ..config import DashboardConfig
from ..utils.indexing import IndexBuilder, Index, SearchIndex, PaginationMeta


@dataclass
class ChartData:
    """Pre-computed chart data for dashboard visualization."""
    name: str
    type: str  # 'pie', 'bar', 'line', 'donut'
    data: list[dict[str, Any]]
    labels: list[str] = field(default_factory=list)
    colors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'name': self.name,
            'type': self.type,
            'data': self.data,
            'labels': self.labels,
            'colors': self.colors,
        }


class ChartDataBuilder:
    """Builds pre-computed chart data for dashboard visualizations.

    Generates chart-ready data structures for common visualizations
    like modularity distribution, pattern breakdown, and type counts.
    """

    # Color palettes for different chart types
    MODULARITY_COLORS = {
        'highly_modular': '#28a745',  # Green
        'modular': '#17a2b8',          # Teal
        'somewhat_modular': '#ffc107', # Yellow
        'semi_modular': '#ffc107',     # Yellow (alias)
        'not_modular': '#dc3545',      # Red
        'coupled': '#dc3545',          # Red (alias)
        'unknown': '#6c757d',          # Gray
    }

    PATTERN_COLORS = {
        'caching': '#007bff',
        'validation': '#28a745',
        'error_handling': '#dc3545',
        'logging': '#6c757d',
        'retry_logic': '#fd7e14',
        'rate_limiting': '#e83e8c',
        'serialization': '#20c997',
        'parsing': '#6610f2',
        'string_manipulation': '#17a2b8',
        'file_operations': '#795548',
        'http_operations': '#3f51b5',
        'database_operations': '#ff5722',
        'async_operations': '#9c27b0',
        'testing': '#4caf50',
        'configuration': '#607d8b',
        'formatting': '#00bcd4',
        'math_operations': '#8bc34a',
        'date_time': '#ff9800',
        'encryption': '#f44336',
        'compression': '#673ab7',
    }

    TYPE_COLORS = {
        'function': '#007bff',
        'class': '#28a745',
        'method': '#17a2b8',
        'module': '#6610f2',
        'unknown': '#6c757d',
    }

    def __init__(self):
        """Initialize the chart data builder."""
        pass

    def build_modularity_chart(
        self,
        candidates: list[dict[str, Any]],
    ) -> ChartData:
        """Build chart data for modularity distribution.

        Args:
            candidates: List of tool candidates.

        Returns:
            ChartData for modularity pie/donut chart.
        """
        # Count by modularity score category
        counts: dict[str, int] = {}

        for candidate in candidates:
            # Check for _complexity first (transformed data)
            complexity = candidate.get('_complexity', {})
            score = complexity.get('modularity_score')

            if score is None:
                score = candidate.get('modularity_score', 'unknown')

            # Convert numeric scores to categories
            if isinstance(score, (int, float)):
                if score >= 0.8:
                    category = 'highly_modular'
                elif score >= 0.6:
                    category = 'modular'
                elif score >= 0.4:
                    category = 'somewhat_modular'
                else:
                    category = 'not_modular'
            else:
                category = str(score).lower().replace(' ', '_').replace('-', '_')

            counts[category] = counts.get(category, 0) + 1

        # Build chart data
        data = []
        labels = []
        colors = []

        for category, count in sorted(counts.items(), key=lambda x: -x[1]):
            label = category.replace('_', ' ').title()
            color = self.MODULARITY_COLORS.get(category, '#6c757d')

            data.append({
                'label': label,
                'value': count,
                'color': color,
                'key': category,
            })
            labels.append(label)
            colors.append(color)

        return ChartData(
            name='modularity_distribution',
            type='donut',
            data=data,
            labels=labels,
            colors=colors,
        )

    def build_pattern_chart(
        self,
        candidates: list[dict[str, Any]],
    ) -> ChartData:
        """Build chart data for pattern distribution.

        Args:
            candidates: List of tool candidates.

        Returns:
            ChartData for pattern bar chart.
        """
        # Count patterns
        counts: dict[str, int] = {}

        for candidate in candidates:
            patterns = candidate.get('_patterns', [])

            for pattern in patterns:
                pattern_name = pattern.get('pattern', 'unknown')
                counts[pattern_name] = counts.get(pattern_name, 0) + 1

        # Build chart data (sorted by count)
        data = []
        labels = []
        colors = []

        for pattern, count in sorted(counts.items(), key=lambda x: -x[1]):
            label = pattern.replace('_', ' ').title()
            color = self.PATTERN_COLORS.get(pattern, '#6c757d')

            data.append({
                'label': label,
                'value': count,
                'color': color,
                'key': pattern,
            })
            labels.append(label)
            colors.append(color)

        return ChartData(
            name='pattern_distribution',
            type='bar',
            data=data,
            labels=labels,
            colors=colors,
        )

    def build_type_chart(
        self,
        candidates: list[dict[str, Any]],
    ) -> ChartData:
        """Build chart data for type distribution.

        Args:
            candidates: List of tool candidates.

        Returns:
            ChartData for type pie chart.
        """
        # Count by type
        counts: dict[str, int] = {}

        for candidate in candidates:
            item_type = candidate.get('type', 'unknown')
            counts[item_type] = counts.get(item_type, 0) + 1

        # Build chart data
        data = []
        labels = []
        colors = []

        for item_type, count in sorted(counts.items(), key=lambda x: -x[1]):
            label = item_type.replace('_', ' ').title()
            color = self.TYPE_COLORS.get(item_type, '#6c757d')

            data.append({
                'label': label,
                'value': count,
                'color': color,
                'key': item_type,
            })
            labels.append(label)
            colors.append(color)

        return ChartData(
            name='type_distribution',
            type='pie',
            data=data,
            labels=labels,
            colors=colors,
        )

    def build_complexity_chart(
        self,
        candidates: list[dict[str, Any]],
    ) -> ChartData:
        """Build chart data for complexity/utility score distribution.

        Args:
            candidates: List of tool candidates.

        Returns:
            ChartData for utility score histogram.
        """
        # Bucket utility scores into ranges
        ranges = [
            ('0.0-0.2', 0.0, 0.2),
            ('0.2-0.4', 0.2, 0.4),
            ('0.4-0.6', 0.4, 0.6),
            ('0.6-0.8', 0.6, 0.8),
            ('0.8-1.0', 0.8, 1.0),
        ]

        counts: dict[str, int] = {label: 0 for label, _, _ in ranges}

        for candidate in candidates:
            complexity = candidate.get('_complexity', {})
            score = complexity.get('utility_score', 0.0)

            if not isinstance(score, (int, float)):
                continue

            for label, min_val, max_val in ranges:
                if min_val <= score < max_val or (max_val == 1.0 and score == 1.0):
                    counts[label] += 1
                    break

        # Build chart data
        data = []
        labels = []
        colors = ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#28a745']

        for i, (label, _, _) in enumerate(ranges):
            count = counts[label]
            data.append({
                'label': label,
                'value': count,
                'color': colors[i],
                'key': label,
            })
            labels.append(label)

        return ChartData(
            name='utility_score_distribution',
            type='bar',
            data=data,
            labels=labels,
            colors=colors,
        )

    def build_abstraction_chart(
        self,
        candidates: list[dict[str, Any]],
    ) -> ChartData:
        """Build chart data for abstraction level distribution.

        Args:
            candidates: List of tool candidates.

        Returns:
            ChartData for abstraction level pie chart.
        """
        # Count by abstraction level
        counts: dict[str, int] = {'low': 0, 'medium': 0, 'high': 0}

        for candidate in candidates:
            complexity = candidate.get('_complexity', {})
            level = complexity.get('abstraction_level', 'low')
            if level in counts:
                counts[level] += 1

        # Build chart data
        level_colors = {
            'low': '#17a2b8',
            'medium': '#ffc107',
            'high': '#28a745',
        }

        data = []
        labels = []
        colors = []

        for level in ['high', 'medium', 'low']:  # Order by abstraction
            count = counts[level]
            label = level.title()
            color = level_colors[level]

            data.append({
                'label': label,
                'value': count,
                'color': color,
                'key': level,
            })
            labels.append(label)
            colors.append(color)

        return ChartData(
            name='abstraction_level_distribution',
            type='donut',
            data=data,
            labels=labels,
            colors=colors,
        )

    def build_dependency_chart(
        self,
        candidates: list[dict[str, Any]],
    ) -> ChartData:
        """Build chart data for dependency type distribution.

        Args:
            candidates: List of tool candidates.

        Returns:
            ChartData for dependency types.
        """
        # Aggregate dependency counts
        totals = {'internal': 0, 'external': 0, 'stdlib': 0, 'unknown': 0}

        for candidate in candidates:
            dep_graph = candidate.get('_dependency_graph', {})
            counts = dep_graph.get('counts', {})

            totals['internal'] += counts.get('internal', 0)
            totals['external'] += counts.get('external', 0)
            totals['stdlib'] += counts.get('stdlib', 0)

        # Build chart data
        dep_colors = {
            'internal': '#28a745',
            'external': '#dc3545',
            'stdlib': '#007bff',
            'unknown': '#6c757d',
        }

        data = []
        labels = []
        colors = []

        for dep_type in ['internal', 'stdlib', 'external']:
            count = totals[dep_type]
            if count == 0:
                continue

            label = dep_type.replace('_', ' ').title()
            color = dep_colors[dep_type]

            data.append({
                'label': label,
                'value': count,
                'color': color,
                'key': dep_type,
            })
            labels.append(label)
            colors.append(color)

        return ChartData(
            name='dependency_type_distribution',
            type='pie',
            data=data,
            labels=labels,
            colors=colors,
        )


@dataclass
class DashboardData:
    """Complete dashboard-optimized data structure."""
    indexes: dict[str, dict[str, list[int]]]
    search_index: dict[str, list[int]]
    charts: dict[str, dict[str, Any]]
    pagination: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'indexes': self.indexes,
            'search_index': self.search_index,
            'charts': self.charts,
            'pagination': self.pagination,
        }


class DashboardOptimizationStage(PreprocessingStage[dict, dict]):
    """Preprocessing stage that optimizes data for dashboard consumption.

    This stage:
    1. Builds categorical indexes for fast filtering
    2. Builds a search index for full-text search
    3. Pre-computes chart data for visualizations
    4. Generates pagination metadata

    Input: Transformed tool identification report
    Output: Report with _dashboard section containing optimized data
    """

    def __init__(self, config: DashboardConfig):
        """Initialize the dashboard optimization stage.

        Args:
            config: Configuration for dashboard optimization.
        """
        super().__init__(config)
        self.index_builder = IndexBuilder()
        self.chart_builder = ChartDataBuilder()

    @property
    def name(self) -> str:
        """Return the stage name."""
        return "dashboard_optimization"

    def validate_input(self, data: dict) -> tuple[bool, list[str]]:
        """Validate that input is a valid report dictionary.

        Args:
            data: Input data to validate.

        Returns:
            Tuple of (is_valid, list of error messages).
        """
        errors = []

        if not isinstance(data, dict):
            errors.append("Input must be a dictionary")
            return False, errors

        # We expect at least tool_candidates for optimization
        if 'tool_candidates' not in data:
            errors.append("Input must contain 'tool_candidates' key")

        return len(errors) == 0, errors

    def process(self, data: dict) -> StageResult[dict]:
        """Process the input data to add dashboard optimizations.

        Args:
            data: Transformed report dictionary.

        Returns:
            StageResult with dashboard-optimized data.
        """
        config: DashboardConfig = self.config
        optimized = data.copy()
        metrics: dict[str, Any] = {
            'indexes_built': 0,
            'search_terms': 0,
            'charts_generated': 0,
        }
        warnings: list[str] = []

        candidates = data.get('tool_candidates', [])

        # Build indexes
        indexes: dict[str, dict[str, list[int]]] = {}

        # Modularity index
        modularity_index = self._build_modularity_index(candidates)
        indexes['by_modularity'] = modularity_index.entries
        metrics['indexes_built'] += 1

        # Type index
        type_index = self.index_builder.build_categorical_index(
            candidates, 'type', 'by_type'
        )
        indexes['by_type'] = type_index.entries
        metrics['indexes_built'] += 1

        # Pattern index (from _patterns field)
        pattern_index = self._build_pattern_index(candidates)
        indexes['by_pattern'] = pattern_index.entries
        metrics['indexes_built'] += 1

        # File index
        file_index = self.index_builder.build_categorical_index(
            candidates, 'file_path', 'by_file'
        )
        indexes['by_file'] = file_index.entries
        metrics['indexes_built'] += 1

        # Abstraction level index
        abstraction_index = self._build_abstraction_index(candidates)
        indexes['by_abstraction'] = abstraction_index.entries
        metrics['indexes_built'] += 1

        # Build search index
        search_index_obj: Optional[SearchIndex] = None
        if config.build_search_index:
            search_index_obj = self.index_builder.build_search_index(
                candidates,
                fields=['name', 'description', 'file_path', 'type'],
            )
            metrics['search_terms'] = search_index_obj.total_terms

        # Build chart data
        charts: dict[str, dict[str, Any]] = {}
        if config.precompute_charts:
            # Modularity distribution
            modularity_chart = self.chart_builder.build_modularity_chart(candidates)
            charts['modularity_distribution'] = modularity_chart.to_dict()
            metrics['charts_generated'] += 1

            # Pattern distribution
            pattern_chart = self.chart_builder.build_pattern_chart(candidates)
            charts['pattern_distribution'] = pattern_chart.to_dict()
            metrics['charts_generated'] += 1

            # Type distribution
            type_chart = self.chart_builder.build_type_chart(candidates)
            charts['type_distribution'] = type_chart.to_dict()
            metrics['charts_generated'] += 1

            # Utility score distribution
            complexity_chart = self.chart_builder.build_complexity_chart(candidates)
            charts['utility_score_distribution'] = complexity_chart.to_dict()
            metrics['charts_generated'] += 1

            # Abstraction level distribution
            abstraction_chart = self.chart_builder.build_abstraction_chart(candidates)
            charts['abstraction_level_distribution'] = abstraction_chart.to_dict()
            metrics['charts_generated'] += 1

            # Dependency type distribution
            dependency_chart = self.chart_builder.build_dependency_chart(candidates)
            charts['dependency_type_distribution'] = dependency_chart.to_dict()
            metrics['charts_generated'] += 1

        # Build pagination metadata
        pagination = self.index_builder.build_pagination_meta(
            candidates,
            page_size=config.page_size,
        )

        # Assemble dashboard data
        dashboard_data = DashboardData(
            indexes=indexes,
            search_index=search_index_obj.terms if search_index_obj else {},
            charts=charts,
            pagination=pagination.to_dict(),
        )

        optimized['_dashboard'] = dashboard_data.to_dict()

        return StageResult.ok(optimized, warnings=warnings, metrics=metrics)

    def _build_modularity_index(self, candidates: list[dict]) -> Index:
        """Build an index by modularity score category.

        Args:
            candidates: List of tool candidates.

        Returns:
            Index mapping modularity categories to indices.
        """
        entries: dict[str, list[int]] = {}

        for idx, candidate in enumerate(candidates):
            # Check for _complexity first (transformed data)
            complexity = candidate.get('_complexity', {})
            score = complexity.get('modularity_score')

            if score is None:
                score = candidate.get('modularity_score', 'unknown')

            # Convert numeric scores to categories
            if isinstance(score, (int, float)):
                if score >= 0.8:
                    category = 'highly_modular'
                elif score >= 0.6:
                    category = 'modular'
                elif score >= 0.4:
                    category = 'somewhat_modular'
                else:
                    category = 'not_modular'
            else:
                category = str(score).lower().replace(' ', '_').replace('-', '_')

            if category not in entries:
                entries[category] = []
            entries[category].append(idx)

        return Index(
            name='by_modularity',
            entries=entries,
            total_items=len(candidates),
        )

    def _build_pattern_index(self, candidates: list[dict]) -> Index:
        """Build an index by detected patterns.

        Args:
            candidates: List of tool candidates.

        Returns:
            Index mapping pattern names to indices.
        """
        entries: dict[str, list[int]] = {}

        for idx, candidate in enumerate(candidates):
            patterns = candidate.get('_patterns', [])

            for pattern in patterns:
                pattern_name = pattern.get('pattern', 'unknown')

                if pattern_name not in entries:
                    entries[pattern_name] = []
                entries[pattern_name].append(idx)

        return Index(
            name='by_pattern',
            entries=entries,
            total_items=len(candidates),
        )

    def _build_abstraction_index(self, candidates: list[dict]) -> Index:
        """Build an index by abstraction level.

        Args:
            candidates: List of tool candidates.

        Returns:
            Index mapping abstraction levels to indices.
        """
        entries: dict[str, list[int]] = {'low': [], 'medium': [], 'high': []}

        for idx, candidate in enumerate(candidates):
            complexity = candidate.get('_complexity', {})
            level = complexity.get('abstraction_level', 'low')

            if level in entries:
                entries[level].append(idx)

        return Index(
            name='by_abstraction',
            entries=entries,
            total_items=len(candidates),
        )
