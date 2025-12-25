"""Path normalization utilities for preprocessing pipeline."""
import os
import re
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Optional, Union

from ..config import PathNormalizerConfig


class PathNormalizer:
    """Normalizes file paths for consistent representation.

    Handles:
    - Converting absolute paths to relative paths
    - Normalizing path separators (forward/backward slashes)
    - Stripping file extensions (optional)
    - Case normalization (optional, platform-dependent)
    - Cross-platform path handling
    """

    def __init__(self, config: Optional[PathNormalizerConfig] = None):
        """Initialize the path normalizer.

        Args:
            config: Configuration for path normalization behavior.
                If None, uses default configuration.
        """
        self.config = config or PathNormalizerConfig()

    def normalize(self, path: str) -> str:
        """Normalize a file path according to configuration.

        Args:
            path: The file path to normalize.

        Returns:
            The normalized path string.
        """
        if not path:
            return path

        # Convert to Path for manipulation
        normalized = self._clean_path(path)

        # Convert to relative path if configured
        if self.config.relative_to:
            normalized = self._make_relative(normalized, self.config.relative_to)

        # Normalize separators to forward slashes (Unix-style)
        if self.config.normalize_separators:
            normalized = self._normalize_separators(normalized)

        # Strip extension if configured
        if self.config.strip_extensions:
            normalized = self._strip_extension(normalized)

        # Handle case sensitivity
        if not self.config.case_sensitive:
            normalized = normalized.lower()

        return normalized

    def _clean_path(self, path: str) -> str:
        """Clean up a path by removing redundant elements.

        Args:
            path: The path to clean.

        Returns:
            Cleaned path string.
        """
        # Remove redundant separators
        path = re.sub(r'[/\\]+', '/', path)

        # Resolve . and .. components
        try:
            # Use Path to resolve, but preserve string for flexibility
            if os.path.isabs(path):
                resolved = Path(path).resolve()
                return str(resolved)
            else:
                # For relative paths, normalize without resolving
                parts = path.split('/')
                result = []
                for part in parts:
                    if part == '..':
                        if result and result[-1] != '..':
                            result.pop()
                        else:
                            result.append(part)
                    elif part and part != '.':
                        result.append(part)
                return '/'.join(result) or '.'
        except Exception:
            # If resolution fails, return cleaned path
            return path

    def _make_relative(self, path: str, base: Path) -> str:
        """Convert an absolute path to relative path from base.

        Args:
            path: The path to make relative.
            base: The base directory for relative path calculation.

        Returns:
            Relative path string, or original if not under base.
        """
        try:
            path_obj = Path(path)
            base_resolved = base.resolve()

            # Check if path is absolute and under base
            if path_obj.is_absolute():
                path_resolved = path_obj.resolve()
                try:
                    relative = path_resolved.relative_to(base_resolved)
                    return str(relative)
                except ValueError:
                    # Path is not under base, return as-is
                    return path
            else:
                # Already relative, just clean it up
                return path
        except Exception:
            return path

    def _normalize_separators(self, path: str) -> str:
        """Convert all path separators to forward slashes.

        Args:
            path: The path to normalize.

        Returns:
            Path with forward slashes.
        """
        return path.replace('\\', '/')

    def _strip_extension(self, path: str) -> str:
        """Remove the file extension from a path.

        Args:
            path: The path to strip extension from.

        Returns:
            Path without file extension.
        """
        # Handle paths like 'file.test.py' -> 'file.test'
        path_obj = PurePosixPath(path)
        if path_obj.suffix:
            return str(path_obj.with_suffix(''))
        return path

    def normalize_batch(self, paths: list[str]) -> list[str]:
        """Normalize multiple paths.

        Args:
            paths: List of paths to normalize.

        Returns:
            List of normalized paths.
        """
        return [self.normalize(p) for p in paths]

    def get_relative_depth(self, path: str) -> int:
        """Calculate the depth of a path (number of directory levels).

        Args:
            path: The path to analyze.

        Returns:
            Number of directory components in the path.
        """
        normalized = self._normalize_separators(path)
        parts = [p for p in normalized.split('/') if p and p != '.']
        return len(parts) - 1  # Subtract 1 for the filename

    def get_directory(self, path: str) -> str:
        """Get the directory portion of a path.

        Args:
            path: The file path.

        Returns:
            Directory path (without filename).
        """
        normalized = self._normalize_separators(path)
        if '/' in normalized:
            return normalized.rsplit('/', 1)[0]
        return '.'

    def get_filename(self, path: str, with_extension: bool = True) -> str:
        """Get the filename portion of a path.

        Args:
            path: The file path.
            with_extension: Whether to include file extension.

        Returns:
            Filename, optionally with extension.
        """
        normalized = self._normalize_separators(path)
        filename = normalized.rsplit('/', 1)[-1] if '/' in normalized else normalized

        if not with_extension:
            filename = self._strip_extension(filename)

        return filename

    def is_python_file(self, path: str) -> bool:
        """Check if a path represents a Python file.

        Args:
            path: The file path to check.

        Returns:
            True if the path ends with .py or .pyi.
        """
        lower_path = path.lower()
        return lower_path.endswith('.py') or lower_path.endswith('.pyi')

    def is_typescript_file(self, path: str) -> bool:
        """Check if a path represents a TypeScript file.

        Args:
            path: The file path to check.

        Returns:
            True if the path ends with .ts, .tsx, .js, or .jsx.
        """
        lower_path = path.lower()
        return any(lower_path.endswith(ext) for ext in ['.ts', '.tsx', '.js', '.jsx'])

    def detect_project_root(self, path: str) -> Optional[str]:
        """Detect the project root from a file path.

        Looks for common project root indicators like:
        - src/ directory
        - package.json, pyproject.toml, setup.py
        - .git directory

        Args:
            path: A file path within the project.

        Returns:
            Detected project root path, or None if not found.
        """
        normalized = self._normalize_separators(path)
        parts = normalized.split('/')

        # Look for common root indicators
        root_indicators = ['src', 'lib', 'app', 'packages']

        for i, part in enumerate(parts):
            if part in root_indicators and i > 0:
                return '/'.join(parts[:i])

        return None

    def __repr__(self) -> str:
        """Return string representation."""
        return f"PathNormalizer(relative_to={self.config.relative_to})"
