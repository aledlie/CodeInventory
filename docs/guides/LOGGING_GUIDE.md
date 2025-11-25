# Logging Configuration Guide

This guide explains the centralized logging configuration with optional Sentry integration for the Code Inventory project.

## Overview

The project uses Python's standard `logging` module with enhanced features:
- **Colored console output** for better readability
- **Structured logging format** for production environments
- **File-based logging** with rotation
- **Optional Sentry integration** for error tracking
- **Performance metric logging**

## Quick Start

### Basic Usage

```python
from src.utils.logging_config import get_logger

logger = get_logger(__name__)

logger.debug("Detailed debugging information")
logger.info("General informational messages")
logger.warning("Warning messages for recoverable issues")
logger.error("Error messages for failures")
logger.critical("Critical issues requiring immediate attention")
```

### With File Logging

```python
from src.utils.logging_config import get_logger
from pathlib import Path

logger = get_logger(
    __name__,
    log_file=Path('logs/analysis.log')
)
```

## Sentry Integration

### Setup

1. Install Sentry SDK:
```bash
pip install sentry-sdk
```

Or add to `requirements.txt`:
```
sentry-sdk>=2.0.0
```

2. Configure environment variables via Doppler:

The project uses **Doppler** for secret management. Sentry credentials are stored in:
- **Project**: `integrity-studio`
- **Config**: `dev`
- **Variables**:
  - `SENTRY_DSN`: Your Sentry Data Source Name
  - `SENTRY_ENVIRONMENT`: Environment name (development, staging, production)

To use Doppler secrets locally:
```bash
# Run with doppler
doppler run --project integrity-studio --config dev -- python3 scripts/run_analysis.py

# Or export to current shell
eval $(doppler secrets download --project integrity-studio --config dev --format env-no-quotes)
```

**DO NOT hardcode Sentry credentials** - always use environment variables from Doppler.

3. Initialize Sentry in your application:
```python
from src.utils.logging_config import init_sentry

# Initialize once at application startup
init_sentry(
    # dsn='your-sentry-dsn',  # Optional, reads from SENTRY_DSN env var
    environment='development',  # or read from SENTRY_ENV
    traces_sample_rate=0.1,     # Sample 10% of transactions
    profiles_sample_rate=0.1     # Sample 10% for profiling
)
```

### Exception Logging with Context

```python
from src.utils.logging_config import get_logger, log_exception

logger = get_logger(__name__)

try:
    risky_operation()
except Exception as e:
    log_exception(
        logger,
        e,
        context={
            'user_id': 123,
            'operation': 'data_analysis',
            'file_path': '/path/to/file'
        }
    )
```

This will:
- Log the exception with full traceback to the logger
- Send the exception to Sentry (if configured)
- Include all context information in the Sentry event

### Performance Metric Logging

```python
from src.utils.logging_config import get_logger, log_performance_metric
import time

logger = get_logger(__name__)

start = time.time()
# ... perform operation ...
duration_ms = (time.time() - start) * 1000

log_performance_metric(
    logger,
    'data_processing',
    duration_ms,
    metadata={'rows_processed': 1000, 'file_size_mb': 50}
)
```

This will:
- Log the performance metric to the logger
- Send a performance transaction to Sentry (if configured)
- Include metadata as tags in Sentry

## Logging Levels

Use appropriate log levels:

| Level | When to Use | Examples |
|-------|-------------|----------|
| `DEBUG` | Detailed diagnostic information | Variable values, loop iterations, internal state |
| `INFO` | General informational messages | Process started, file processed, operation completed |
| `WARNING` | Recoverable issues or deprecations | Missing optional config, using fallback, deprecated feature |
| `ERROR` | Error conditions that need attention | Operation failed, file not found, invalid input |
| `CRITICAL` | Severe errors requiring immediate action | System crash, data corruption, security breach |

## Log Formats

### Console Format (Default)

Colored output for terminal:
```
2025-11-22 10:30:45 - module_name - INFO - Starting analysis
2025-11-22 10:30:46 - module_name - ERROR - File not found
```

### Structured Format (Production)

For file logging or production environments:
```
2025-11-22 10:30:45 | INFO     | src.analyzers.code_quality | analyze_file         | Line 242  | Processing file: example.py
```

Use structured format with:
```python
from src.utils.logging_config import setup_logging

logger = setup_logging(
    name=__name__,
    structured=True
)
```

## Configuration Options

### Environment Variables

The following environment variables are used (managed via Doppler):

- `LOG_LEVEL`: Set log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `SENTRY_DSN`: Sentry Data Source Name for error tracking (from Doppler)
- `SENTRY_ENVIRONMENT`: Environment name (development, staging, production) (from Doppler)
- `TESTING`: Set to 'true' to disable Sentry during tests

**Using Doppler (Recommended)**:
```bash
# Run any command with Doppler secrets
doppler run --project integrity-studio --config dev -- python3 your_script.py

# Or load into shell session
eval $(doppler secrets download --project integrity-studio --config dev --format env-no-quotes)
```

**Manual Override (Not Recommended)**:
```bash
export LOG_LEVEL=DEBUG
export SENTRY_DSN=https://...@sentry.io/...
export SENTRY_ENVIRONMENT=production
```

### Programmatic Configuration

```python
from src.utils.logging_config import setup_logging

logger = setup_logging(
    name=__name__,
    level='INFO',                    # Log level
    log_file=Path('logs/app.log'),  # Optional file output
    use_colors=True,                 # Colored console output
    structured=False                 # Use structured format
)
```

## File Logging with Rotation

File handlers automatically rotate when reaching 10 MB:

```python
from src.utils.logging_config import get_logger
from pathlib import Path

logger = get_logger(
    __name__,
    log_file=Path('logs/analysis.log')
)
```

This creates:
- `logs/analysis.log` (current)
- `logs/analysis.log.1` (previous)
- `logs/analysis.log.2` (older)
- ... up to 5 backup files

## Sentry Features

### Automatic Error Capture

When Sentry is configured, all `ERROR` and `CRITICAL` level logs are automatically sent to Sentry:

```python
logger.error("Database connection failed", exc_info=True)
# Automatically sent to Sentry with full traceback
```

### Breadcrumbs

All `INFO` level logs are captured as breadcrumbs in Sentry, providing context for errors:

```python
logger.info("Starting data import")
logger.info("Connected to database")
logger.info("Processing 1000 records")
logger.error("Failed to process record 500")  # Breadcrumbs included in Sentry event
```

### Custom Context

Add context to Sentry events:

```python
from src.utils.logging_config import log_exception

try:
    process_data(user_id=123, file_path='/data/input.csv')
except Exception as e:
    log_exception(logger, e, context={
        'user_id': 123,
        'file_path': '/data/input.csv',
        'operation': 'data_processing',
        'server': 'analysis-01'
    })
```

### Performance Monitoring

Track operation performance:

```python
from src.utils.logging_config import log_performance_metric

log_performance_metric(
    logger,
    'schema_generation',
    duration_ms=1500.5,
    metadata={
        'files_processed': 100,
        'total_classes': 250,
        'total_functions': 1200
    }
)
```

## Best Practices

### 1. Use Module-Level Loggers

Always get loggers at module level:

```python
from src.utils.logging_config import get_logger

logger = get_logger(__name__)  # Uses module name

def my_function():
    logger.info("Function called")
```

### 2. Log Exceptions with Context

Always include `exc_info=True` for exceptions:

```python
try:
    process_file(path)
except FileNotFoundError as e:
    logger.error(f"File not found: {path}", exc_info=True)
except Exception as e:
    logger.error(f"Unexpected error processing {path}", exc_info=True)
```

Or use the helper:

```python
try:
    process_file(path)
except Exception as e:
    log_exception(logger, e, context={'file_path': path})
```

### 3. Use Structured Data

Include structured data in log messages:

```python
# Good
logger.info(f"Processed {count} files in {duration:.2f}s")

# Better
logger.info(
    "File processing complete",
    extra={
        'files_processed': count,
        'duration_seconds': duration,
        'average_per_file': duration / count
    }
)
```

### 4. Avoid Logging Sensitive Data

Never log passwords, API keys, tokens, or PII:

```python
# Bad
logger.info(f"User login: {username} with password {password}")

# Good
logger.info(f"User login: {username}")
```

### 5. Use Appropriate Log Levels

```python
# Debug: Diagnostic details
logger.debug(f"Variable state: x={x}, y={y}")

# Info: Normal operations
logger.info(f"Processing file: {filename}")

# Warning: Unexpected but recoverable
logger.warning(f"Config file missing, using defaults")

# Error: Operation failed
logger.error(f"Failed to connect to database", exc_info=True)

# Critical: System failure
logger.critical(f"Out of memory, shutting down")
```

### 6. Log at Function Boundaries

Log at the start and end of significant operations:

```python
def analyze_codebase(path: Path):
    logger.info(f"Starting codebase analysis: {path}")
    try:
        # ... analysis logic ...
        logger.info(f"Analysis complete: {path}")
    except Exception as e:
        logger.error(f"Analysis failed: {path}", exc_info=True)
        raise
```

## Migration from Old Logging

### Old Pattern

```python
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
```

### New Pattern

```python
from src.utils.logging_config import get_logger

logger = get_logger(__name__)
```

The new pattern:
- ✅ Provides colored output automatically
- ✅ Supports file logging
- ✅ Integrates with Sentry
- ✅ Includes performance tracking
- ✅ Handles log rotation
- ✅ Prevents duplicate handlers

## Testing with Logging

### Disable Sentry in Tests

Set environment variable:
```bash
export TESTING=true
python3 -m pytest
```

Or in test fixtures:
```python
import os
import pytest

@pytest.fixture(autouse=True)
def disable_sentry():
    os.environ['TESTING'] = 'true'
    yield
    del os.environ['TESTING']
```

### Capture Log Output in Tests

```python
import logging
import pytest

def test_with_logs(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("Test message")
        assert "Test message" in caplog.text
```

## Example: Complete Module

```python
#!/usr/bin/env python3
"""
Example Analysis Module with Logging
"""

from pathlib import Path
from typing import List
import time

from src.utils.logging_config import (
    get_logger,
    init_sentry,
    log_exception,
    log_performance_metric
)

# Initialize logger
logger = get_logger(__name__)

def main():
    """Main entry point"""
    # Initialize Sentry (optional)
    init_sentry(environment='production')

    logger.info("Starting analysis pipeline")

    try:
        files = discover_files(Path('/code'))
        results = analyze_files(files)
        generate_report(results)

        logger.info("Analysis pipeline complete")

    except Exception as e:
        log_exception(
            logger,
            e,
            context={'stage': 'pipeline', 'operation': 'analysis'}
        )
        raise

def discover_files(root: Path) -> List[Path]:
    """Discover code files"""
    logger.info(f"Discovering files in: {root}")

    files = list(root.rglob('*.py'))

    logger.info(f"Found {len(files)} Python files")
    return files

def analyze_files(files: List[Path]) -> dict:
    """Analyze code files"""
    logger.info(f"Analyzing {len(files)} files")

    start = time.time()
    results = {}

    for i, file_path in enumerate(files):
        logger.debug(f"Processing file {i+1}/{len(files)}: {file_path}")

        try:
            results[str(file_path)] = analyze_file(file_path)
        except Exception as e:
            logger.warning(
                f"Failed to analyze {file_path}: {e}",
                exc_info=True
            )

    duration_ms = (time.time() - start) * 1000
    log_performance_metric(
        logger,
        'file_analysis',
        duration_ms,
        metadata={'files_processed': len(files)}
    )

    return results

def analyze_file(file_path: Path) -> dict:
    """Analyze a single file"""
    # ... analysis logic ...
    return {'classes': 5, 'functions': 20}

def generate_report(results: dict):
    """Generate analysis report"""
    logger.info("Generating report")
    # ... report generation ...
    logger.info("Report generated successfully")

if __name__ == '__main__':
    main()
```

## Troubleshooting

### Logs Not Appearing

Check log level:
```python
logger.setLevel(logging.DEBUG)
```

Or set environment variable:
```bash
export LOG_LEVEL=DEBUG
```

### Duplicate Log Messages

The logging configuration automatically prevents duplicate handlers. If seeing duplicates, ensure you're using `get_logger()` not `logging.getLogger()`.

### Sentry Not Capturing Errors

1. Check DSN is set: `echo $SENTRY_DSN`
2. Check Sentry is initialized: Look for "✅ Sentry initialized" log
3. Verify error level is ERROR or above
4. Check network connectivity to sentry.io

### File Logging Issues

Ensure the log directory exists:
```python
log_file = Path('logs/app.log')
log_file.parent.mkdir(parents=True, exist_ok=True)
```

## Resources

- [Python Logging Documentation](https://docs.python.org/3/library/logging.html)
- [Sentry Python SDK](https://docs.sentry.io/platforms/python/)
- [Logging Best Practices](https://docs.python.org/3/howto/logging.html)

---

*Last Updated: 2025-11-22*
