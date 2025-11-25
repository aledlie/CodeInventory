# Sentry & Doppler Integration Setup

This document explains how the Code Inventory project integrates Sentry error tracking with Doppler secret management.

## Overview

- **Sentry**: Error tracking and performance monitoring
- **Doppler**: Centralized secret management
- **Integration**: Seamless environment variable injection

## Architecture

```
Doppler (integrity-studio/dev)
    ↓
Environment Variables
    ↓
src/utils/logging_config.py
    ↓
Sentry SDK
    ↓
Error Events & Performance Data
```

## Doppler Configuration

### Project Details
- **Project**: `integrity-studio`
- **Config**: `dev`

### Stored Secrets
- `SENTRY_DSN`: Sentry Data Source Name
  - Current value: `https://e8837f39d2d4936414e0407b04adc8aa@o4510332694495232.ingest.us.sentry.io/4510332704260096`
- `SENTRY_ENVIRONMENT`: Environment name
  - Current value: `development`

### Viewing Secrets

```bash
# List all secrets
doppler secrets --project integrity-studio --config dev --only-names

# Get specific secret
doppler secrets get SENTRY_DSN --project integrity-studio --config dev

# Get multiple secrets
doppler secrets get SENTRY_DSN SENTRY_ENVIRONMENT --project integrity-studio --config dev
```

## Using Doppler with Scripts

### Method 1: doppler run (Recommended)

Run any command with Doppler secrets injected:

```bash
doppler run --project integrity-studio --config dev -- python3 scripts/run_analysis.py
```

### Method 2: Convenience Script

Use the provided wrapper script:

```bash
./scripts/run_with_doppler.sh python3 scripts/run_analysis.py
./scripts/run_with_doppler.sh python3 -m src.analyzers.code_quality src/
./scripts/run_with_doppler.sh python3 scripts/run_tests.py
```

### Method 3: Load into Shell

Export secrets to your current shell session:

```bash
eval $(doppler secrets download --project integrity-studio --config dev --format env-no-quotes)

# Now run commands normally
python3 scripts/run_analysis.py
python3 examples/sentry_example.py
```

## Code Integration

### Initializing Sentry

```python
from src.utils.logging_config import init_sentry

# Initialize with Doppler-provided environment variables
init_sentry()

# Reads from:
# - os.getenv('SENTRY_DSN')
# - os.getenv('SENTRY_ENVIRONMENT')
```

### Using Logging with Sentry

```python
from src.utils.logging_config import get_logger, log_exception

logger = get_logger(__name__)

try:
    risky_operation()
except Exception as e:
    # Logs to console AND sends to Sentry
    log_exception(logger, e, context={
        'operation': 'data_processing',
        'file_path': '/path/to/file'
    })
```

### Performance Tracking

```python
from src.utils.logging_config import log_performance_metric
import time

start = time.time()
# ... do work ...
duration_ms = (time.time() - start) * 1000

log_performance_metric(
    logger,
    'operation_name',
    duration_ms,
    metadata={'items_processed': 100}
)
```

## Security Best Practices

### ✅ DO

- Use `os.getenv()` to read environment variables
- Run scripts with `doppler run` or load secrets via Doppler
- Store all credentials in Doppler, never in code
- Use the convenience script `./scripts/run_with_doppler.sh`
- Keep `.env.example` updated with variable names (not values)

### ❌ DON'T

- Hardcode credentials in Python files
- Commit `.env` files with actual secrets
- Use `export SENTRY_DSN=...` manually (use Doppler instead)
- Share Doppler tokens in public repositories
- Log sensitive data (passwords, tokens, PII)

## Example Usage

### Running Analysis with Sentry

```bash
# With Doppler (Sentry enabled)
doppler run --project integrity-studio --config dev -- python3 scripts/run_analysis.py

# Without Doppler (Sentry disabled, uses basic logging)
python3 scripts/run_analysis.py
```

### Testing Sentry Integration

```bash
# Run the example script
./scripts/run_with_doppler.sh python3 examples/sentry_example.py
```

This will:
1. Initialize Sentry with Doppler credentials
2. Log messages at different levels
3. Generate a test exception with context
4. Track a performance metric
5. Demonstrate breadcrumb logging

Check your Sentry dashboard to see the captured events.

## Sentry Dashboard

After running scripts with Sentry enabled, view:

1. **Issues**: All captured exceptions with stack traces and context
2. **Performance**: Transaction data and performance metrics
3. **Breadcrumbs**: Sequence of log messages leading to errors
4. **Releases**: Track errors across different deployments

Access: https://sentry.io/organizations/integrity-studio/

## Environment-Specific Configuration

### Development (Current)
- **Config**: `dev`
- **SENTRY_ENVIRONMENT**: `development`
- **Sampling**: 10% transactions, 10% profiles

### Production (Future)
- **Config**: `prod`
- **SENTRY_ENVIRONMENT**: `production`
- **Sampling**: Lower rates for cost optimization

Switch configs:
```bash
doppler run --project integrity-studio --config prod -- python3 your_script.py
```

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check Doppler is running**:
   ```bash
   doppler secrets get SENTRY_DSN --project integrity-studio --config dev
   ```

2. **Verify Sentry SDK is installed**:
   ```bash
   pip3 show sentry-sdk
   ```

3. **Check initialization**:
   Look for `✅ Sentry initialized for environment: development` in logs

4. **Test with example**:
   ```bash
   ./scripts/run_with_doppler.sh python3 examples/sentry_example.py
   ```

### Doppler Errors

1. **"Could not find requested secret"**:
   - Check project and config names
   - Verify you have access to the project

2. **Authentication errors**:
   ```bash
   doppler login
   doppler configure
   ```

3. **Wrong project/config**:
   ```bash
   # Set defaults
   doppler setup --project integrity-studio --config dev
   ```

## Files Updated

### New Files
- `src/utils/logging_config.py` - Centralized logging with Sentry
- `scripts/run_with_doppler.sh` - Doppler wrapper script
- `examples/sentry_example.py` - Sentry integration example
- `.env.example` - Environment variable template
- `requirements.txt` - Added sentry-sdk

### Updated Files
- `docs/LOGGING_GUIDE.md` - Added Doppler integration docs
- `CLAUDE.md` - Added Doppler secret management section

## Next Steps

1. **Install Sentry SDK** (if not already installed):
   ```bash
   pip3 install --user sentry-sdk
   ```

2. **Test the integration**:
   ```bash
   ./scripts/run_with_doppler.sh python3 examples/sentry_example.py
   ```

3. **Run analysis with Sentry**:
   ```bash
   ./scripts/run_with_doppler.sh python3 scripts/run_analysis.py
   ```

4. **Check Sentry dashboard** for captured events

5. **Integrate into CI/CD**: Add Doppler to deployment pipeline

## Resources

- [Sentry Python SDK Docs](https://docs.sentry.io/platforms/python/)
- [Doppler CLI Docs](https://docs.doppler.com/docs/cli)
- [Doppler Integration Guide](https://docs.doppler.com/docs/integrations)
- [Sentry Error Tracking](https://docs.sentry.io/product/issues/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)

---

*Last Updated: 2025-11-22*
*Doppler Project: integrity-studio*
*Sentry Organization: integrity-studio*
