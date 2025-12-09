#!/usr/bin/env python3
"""
Unit tests for detecting orphaned React components.

Orphaned components are .tsx files that exist in a component directory
but are not exported through the barrel index.ts file.

These tests issue WARNINGS rather than failures, as orphaned components
may be intentional (work in progress, internal-only components, etc.)
"""

import unittest
import warnings
import re
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class OrphanedComponentWarning(UserWarning):
    """Custom warning for orphaned components."""
    pass


class TestOrphanedComponents(unittest.TestCase):
    """Test for orphaned React components not exported through barrel files."""

    def setUp(self):
        """Set up test fixtures."""
        self.project_root = Path(__file__).parent.parent.parent
        self.src_dir = self.project_root / "src"
        self.dashboard_components = self.src_dir / "features" / "dashboard" / "components"

    def _get_tsx_files(self, directory: Path) -> list[str]:
        """Get all .tsx files in a directory (not subdirectories)."""
        if not directory.exists():
            return []
        return [
            f.stem for f in directory.glob("*.tsx")
            if f.is_file() and not f.name.startswith("_")
        ]

    def _get_exported_components(self, index_file: Path) -> set[str]:
        """Parse index.ts barrel file to find exported components."""
        if not index_file.exists():
            return set()

        content = index_file.read_text()
        exports = set()

        # Match: export { ComponentName } from './ComponentName';
        # Match: export { ComponentName, type ComponentNameProps } from './ComponentName';
        pattern = r"export\s*\{[^}]+\}\s*from\s*['\"]\.\/([^'\"]+)['\"]"
        for match in re.finditer(pattern, content):
            exports.add(match.group(1))

        # Match: export * from './ComponentName';
        star_pattern = r"export\s*\*\s*from\s*['\"]\.\/([^'\"]+)['\"]"
        for match in re.finditer(star_pattern, content):
            exports.add(match.group(1))

        return exports

    def _check_directory_for_orphans(self, component_dir: Path, dir_name: str) -> list[str]:
        """Check a component directory for orphaned components."""
        orphans = []

        if not component_dir.exists():
            return orphans

        index_file = component_dir / "index.ts"
        tsx_files = self._get_tsx_files(component_dir)
        exported = self._get_exported_components(index_file)

        for component in tsx_files:
            if component not in exported and component != "index":
                orphans.append(f"{dir_name}/{component}.tsx")

        return orphans

    def test_insights_components_exported(self):
        """Warn if insights components are not exported through barrel file."""
        insights_dir = self.dashboard_components / "insights"
        orphans = self._check_directory_for_orphans(insights_dir, "insights")

        if orphans:
            warnings.warn(
                f"Orphaned components in insights/: {', '.join(orphans)}. "
                "Consider exporting in index.ts or removing if unused.",
                OrphanedComponentWarning
            )

        # Test passes with warning - we don't fail for orphaned components
        self.assertTrue(True, "Insights directory checked for orphaned components")

    def test_predictions_components_exported(self):
        """Warn if predictions components are not exported through barrel file."""
        predictions_dir = self.dashboard_components / "predictions"
        orphans = self._check_directory_for_orphans(predictions_dir, "predictions")

        if orphans:
            warnings.warn(
                f"Orphaned components in predictions/: {', '.join(orphans)}. "
                "Consider exporting in index.ts or removing if unused.",
                OrphanedComponentWarning
            )

        self.assertTrue(True, "Predictions directory checked for orphaned components")

    def test_visualizations_components_exported(self):
        """Warn if visualizations components are not exported through barrel file."""
        viz_dir = self.dashboard_components / "visualizations"
        orphans = self._check_directory_for_orphans(viz_dir, "visualizations")

        if orphans:
            warnings.warn(
                f"Orphaned components in visualizations/: {', '.join(orphans)}. "
                "Consider exporting in index.ts or removing if unused.",
                OrphanedComponentWarning
            )

        self.assertTrue(True, "Visualizations directory checked for orphaned components")

    def test_collaboration_components_exported(self):
        """Warn if collaboration components are not exported through barrel file."""
        collab_dir = self.dashboard_components / "collaboration"
        orphans = self._check_directory_for_orphans(collab_dir, "collaboration")

        if orphans:
            warnings.warn(
                f"Orphaned components in collaboration/: {', '.join(orphans)}. "
                "Consider exporting in index.ts or removing if unused.",
                OrphanedComponentWarning
            )

        self.assertTrue(True, "Collaboration directory checked for orphaned components")

    def test_notifications_components_exported(self):
        """Warn if notifications components are not exported through barrel file."""
        notif_dir = self.dashboard_components / "notifications"
        orphans = self._check_directory_for_orphans(notif_dir, "notifications")

        if orphans:
            warnings.warn(
                f"Orphaned components in notifications/: {', '.join(orphans)}. "
                "Consider exporting in index.ts or removing if unused.",
                OrphanedComponentWarning
            )

        self.assertTrue(True, "Notifications directory checked for orphaned components")

    def test_analytics_components_exported(self):
        """Warn if analytics components are not exported through barrel file."""
        analytics_dir = self.dashboard_components / "analytics"
        orphans = self._check_directory_for_orphans(analytics_dir, "analytics")

        if orphans:
            warnings.warn(
                f"Orphaned components in analytics/: {', '.join(orphans)}. "
                "Consider exporting in index.ts or removing if unused.",
                OrphanedComponentWarning
            )

        self.assertTrue(True, "Analytics directory checked for orphaned components")

    def test_all_subdirectories_have_barrel_files(self):
        """Warn about component subdirectories missing barrel files (index.ts)."""
        if not self.dashboard_components.exists():
            self.skipTest("Dashboard components directory does not exist")

        missing_barrels = []
        for subdir in self.dashboard_components.iterdir():
            if subdir.is_dir() and not subdir.name.startswith("_"):
                # Check if directory has .tsx files
                tsx_files = list(subdir.glob("*.tsx"))
                if tsx_files:
                    index_file = subdir / "index.ts"
                    if not index_file.exists():
                        missing_barrels.append(subdir.name)

        if missing_barrels:
            warnings.warn(
                f"Component directories missing index.ts barrel files: {', '.join(missing_barrels)}. "
                "Consider adding an index.ts to export components.",
                OrphanedComponentWarning
            )

        self.assertTrue(True, "All subdirectories checked for barrel files")


class TestOrphanedHooks(unittest.TestCase):
    """Test for orphaned React hooks not exported through barrel files."""

    def setUp(self):
        """Set up test fixtures."""
        self.project_root = Path(__file__).parent.parent.parent
        self.hooks_dir = self.project_root / "src" / "features" / "dashboard" / "hooks"

    def _get_hook_files(self) -> list[str]:
        """Get all hook files (use*.ts) in the hooks directory."""
        if not self.hooks_dir.exists():
            return []
        return [
            f.stem for f in self.hooks_dir.glob("use*.ts")
            if f.is_file()
        ]

    def _get_exported_hooks(self) -> set[str]:
        """Parse index.ts to find exported hooks."""
        index_file = self.hooks_dir / "index.ts"
        if not index_file.exists():
            return set()

        content = index_file.read_text()
        exports = set()

        # Match: export { useHookName } from './useHookName';
        # Match: export { useHookName, useOtherHook } from './useHookName';
        pattern = r"from\s*['\"]\.\/([^'\"]+)['\"]"
        for match in re.finditer(pattern, content):
            exports.add(match.group(1))

        return exports

    def test_hooks_exported(self):
        """Warn if hook files are not exported through barrel file."""
        hook_files = self._get_hook_files()
        exported = self._get_exported_hooks()

        orphans = [h for h in hook_files if h not in exported]

        if orphans:
            warnings.warn(
                f"Orphaned hooks not exported in index.ts: {', '.join(orphans)}. "
                "Consider adding to hooks/index.ts exports.",
                OrphanedComponentWarning
            )

        self.assertTrue(True, "Hooks directory checked for orphaned hooks")


class TestOrphanedAPIs(unittest.TestCase):
    """Test for orphaned API modules not exported through barrel files."""

    def setUp(self):
        """Set up test fixtures."""
        self.project_root = Path(__file__).parent.parent.parent
        self.api_dir = self.project_root / "src" / "features" / "dashboard" / "api"

    def _get_api_files(self) -> list[str]:
        """Get all API files (*Api.ts) in the api directory."""
        if not self.api_dir.exists():
            return []
        return [
            f.stem for f in self.api_dir.glob("*Api.ts")
            if f.is_file()
        ]

    def _get_exported_apis(self) -> set[str]:
        """Parse index.ts to find exported APIs."""
        index_file = self.api_dir / "index.ts"
        if not index_file.exists():
            return set()

        content = index_file.read_text()
        exports = set()

        # Match: export { apiName } from './apiName';
        pattern = r"from\s*['\"]\.\/([^'\"]+)['\"]"
        for match in re.finditer(pattern, content):
            exports.add(match.group(1))

        return exports

    def test_apis_exported(self):
        """Warn if API modules are not exported through barrel file."""
        api_files = self._get_api_files()
        exported = self._get_exported_apis()

        orphans = [a for a in api_files if a not in exported]

        if orphans:
            warnings.warn(
                f"Orphaned APIs not exported in index.ts: {', '.join(orphans)}. "
                "Consider adding to api/index.ts exports.",
                OrphanedComponentWarning
            )

        self.assertTrue(True, "API directory checked for orphaned APIs")


class TestOrphanedTypes(unittest.TestCase):
    """Test for orphaned type definition files not exported through barrel files."""

    def setUp(self):
        """Set up test fixtures."""
        self.project_root = Path(__file__).parent.parent.parent
        self.types_dir = self.project_root / "src" / "features" / "dashboard" / "types"

    def _get_type_files(self) -> list[str]:
        """Get all type definition files (*.ts) in the types directory."""
        if not self.types_dir.exists():
            return []
        return [
            f.stem for f in self.types_dir.glob("*.ts")
            if f.is_file() and f.stem != "index"
        ]

    def _get_exported_types(self) -> set[str]:
        """Parse index.ts to find exported types."""
        index_file = self.types_dir / "index.ts"
        if not index_file.exists():
            return set()

        content = index_file.read_text()
        exports = set()

        # Match: export * from './typeName';
        # Match: export type { TypeName } from './typeName';
        pattern = r"from\s*['\"]\.\/([^'\"]+)['\"]"
        for match in re.finditer(pattern, content):
            exports.add(match.group(1))

        return exports

    def test_types_exported(self):
        """Warn if type files are not exported through barrel file."""
        type_files = self._get_type_files()
        exported = self._get_exported_types()

        orphans = [t for t in type_files if t not in exported]

        if orphans:
            warnings.warn(
                f"Orphaned types not exported in index.ts: {', '.join(orphans)}. "
                "Consider adding to types/index.ts exports.",
                OrphanedComponentWarning
            )

        self.assertTrue(True, "Types directory checked for orphaned types")


class TestComponentConsistency(unittest.TestCase):
    """Test for consistency between components and their exports."""

    def setUp(self):
        """Set up test fixtures."""
        self.project_root = Path(__file__).parent.parent.parent
        self.dashboard_components = self.project_root / "src" / "features" / "dashboard" / "components"

    def test_main_barrel_exports_subdirectory_barrels(self):
        """Warn if main index.ts doesn't re-export from subdirectory barrels."""
        main_index = self.dashboard_components / "index.ts"
        if not main_index.exists():
            self.skipTest("Main components index.ts does not exist")

        content = main_index.read_text()

        # Get all subdirectories with index.ts files
        subdirs_with_barrels = []
        for subdir in self.dashboard_components.iterdir():
            if subdir.is_dir() and (subdir / "index.ts").exists():
                subdirs_with_barrels.append(subdir.name)

        # Check if main barrel re-exports from each subdirectory
        not_reexported = []
        for subdir in subdirs_with_barrels:
            # Match: export * from './subdir';
            pattern = rf"export\s*\*\s*from\s*['\"]\./{subdir}['\"]"
            if not re.search(pattern, content):
                not_reexported.append(subdir)

        if not_reexported:
            warnings.warn(
                f"Subdirectories not re-exported in main index.ts: {', '.join(not_reexported)}. "
                "Consider adding 'export * from './{subdir}';' to components/index.ts.",
                OrphanedComponentWarning
            )

        self.assertTrue(True, "Main barrel file checked for subdirectory re-exports")


if __name__ == "__main__":
    # Run with warnings visible
    warnings.filterwarnings("always", category=OrphanedComponentWarning)
    unittest.main(verbosity=2, warnings="always")
