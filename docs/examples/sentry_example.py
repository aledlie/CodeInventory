#!/usr/bin/env python3
"""
Example: Using Sentry Integration with Doppler

This example demonstrates how to use the centralized logging configuration
with Sentry error tracking, using secrets managed by Doppler.

Run with Doppler:
    doppler run --project integrity-studio --config dev -- python3 examples/sentry_example.py

Or use the convenience script:
    ./scripts/run_with_doppler.sh python3 examples/sentry_example.py
"""

import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.logging_config import (
    get_logger,
    init_sentry,
    log_exception,
    log_performance_metric
)

# Initialize logger
logger = get_logger(__name__)


def main():
    """Main example function"""
    logger.info("="*60)
    logger.info("Sentry Integration Example")
    logger.info("="*60)
    logger.info("")

    # Initialize Sentry (reads SENTRY_DSN and SENTRY_ENVIRONMENT from Doppler)
    sentry_initialized = init_sentry()

    if sentry_initialized:
        logger.info("✅ Sentry initialized successfully")
        logger.info("   Environment variables from Doppler:")
        logger.info("   - SENTRY_DSN: Configured")
        logger.info("   - SENTRY_ENVIRONMENT: Configured")
    else:
        logger.warning("⚠️  Sentry not initialized")
        logger.warning("   Make sure to run with Doppler:")
        logger.warning("   doppler run --project integrity-studio --config dev -- python3 examples/sentry_example.py")

    logger.info("")
    logger.info("="*60)
    logger.info("Testing Different Log Levels")
    logger.info("="*60)
    logger.info("")

    # Test different log levels
    logger.debug("🔍 DEBUG: Detailed diagnostic information")
    logger.info("ℹ️  INFO: General informational message")
    logger.warning("⚠️  WARNING: Warning message for recoverable issue")

    logger.info("")
    logger.info("="*60)
    logger.info("Testing Exception Logging with Context")
    logger.info("="*60)
    logger.info("")

    # Demonstrate exception logging with context
    try:
        # Intentional error for demonstration
        result = 10 / 0
    except ZeroDivisionError as e:
        log_exception(
            logger,
            e,
            context={
                'operation': 'division',
                'numerator': 10,
                'denominator': 0,
                'example': 'sentry_example.py'
            }
        )
        logger.info("Exception logged with context and sent to Sentry")

    logger.info("")
    logger.info("="*60)
    logger.info("Testing Performance Metric Logging")
    logger.info("="*60)
    logger.info("")

    # Demonstrate performance logging
    start = time.time()
    time.sleep(0.5)  # Simulate work
    duration_ms = (time.time() - start) * 1000

    log_performance_metric(
        logger,
        'example_operation',
        duration_ms,
        metadata={
            'operation_type': 'demo',
            'iterations': 1,
            'example': 'sentry_example.py'
        }
    )

    logger.info("")
    logger.info("="*60)
    logger.info("Testing Breadcrumbs (Sentry Context)")
    logger.info("="*60)
    logger.info("")

    # These INFO logs will be captured as breadcrumbs
    logger.info("Step 1: Initialize data processing")
    logger.info("Step 2: Load data from source")
    logger.info("Step 3: Transform data")
    logger.info("Step 4: Validate results")

    # If an error occurs here, Sentry will include all the breadcrumbs above
    logger.info("✅ All steps completed successfully")

    logger.info("")
    logger.info("="*60)
    logger.info("Example Complete")
    logger.info("="*60)
    logger.info("")

    if sentry_initialized:
        logger.info("📊 Check your Sentry dashboard to see:")
        logger.info("   - Error event for the ZeroDivisionError")
        logger.info("   - Context data (operation, numerator, denominator)")
        logger.info("   - Breadcrumbs showing the execution flow")
        logger.info("   - Performance transaction for example_operation")
    else:
        logger.info("💡 To see Sentry in action, run with Doppler:")
        logger.info("   ./scripts/run_with_doppler.sh python3 examples/sentry_example.py")


if __name__ == '__main__':
    main()
