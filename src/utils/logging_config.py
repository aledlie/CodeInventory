#!/usr/bin/env python3
"""
Centralized Logging Configuration with Sentry Integration

This module provides consistent logging configuration across all analyzers
and generators with optional Sentry error tracking.

Usage:
    from src.utils.logging_config import get_logger

    logger = get_logger(__name__)
    logger.info("Starting process")
    logger.error("An error occurred", exc_info=True)
"""

import logging
import logging.handlers
import os
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime

# Optional Sentry import - gracefully handle if not installed
try:
    import sentry_sdk
    from sentry_sdk.integrations.logging import LoggingIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False


# Default configuration
DEFAULT_LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
DEFAULT_LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DEFAULT_LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# Structured logging format for production
STRUCTURED_FORMAT = '%(asctime)s | %(levelname)-8s | %(name)-30s | %(funcName)-20s | Line %(lineno)-4d | %(message)s'


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colored output for console"""

    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'

    def format(self, record):
        # Add color to levelname
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = f"{self.COLORS[levelname]}{levelname}{self.RESET}"

        # Format the message
        result = super().format(record)

        # Reset levelname for other handlers
        record.levelname = levelname

        return result


def init_sentry(
    dsn: Optional[str] = None,
    environment: Optional[str] = None,
    traces_sample_rate: float = 0.1,
    profiles_sample_rate: float = 0.1
) -> bool:
    """
    Initialize Sentry error tracking

    Args:
        dsn: Sentry DSN (defaults to SENTRY_DSN env var from Doppler)
        environment: Environment name (defaults to SENTRY_ENVIRONMENT env var from Doppler)
        traces_sample_rate: Fraction of transactions to trace (0.0 to 1.0)
        profiles_sample_rate: Fraction of transactions to profile (0.0 to 1.0)

    Returns:
        bool: True if Sentry was initialized successfully

    Environment Variables (managed via Doppler):
        SENTRY_DSN: Sentry Data Source Name
        SENTRY_ENVIRONMENT: Environment name (development, staging, production)
    """
    if not SENTRY_AVAILABLE:
        logging.warning("Sentry SDK not installed. Install with: pip install sentry-sdk")
        return False

    # Get DSN from environment (Doppler: integrity-studio/dev)
    dsn = dsn or os.getenv('SENTRY_DSN')
    if not dsn:
        logging.info("Sentry DSN not configured. Skipping Sentry initialization.")
        return False

    # Get environment from Doppler (not SENTRY_ENV - correct name is SENTRY_ENVIRONMENT)
    environment = environment or os.getenv('SENTRY_ENVIRONMENT', 'development')

    # Configure Sentry logging integration
    logging_integration = LoggingIntegration(
        level=logging.INFO,        # Capture info and above as breadcrumbs
        event_level=logging.ERROR  # Send errors and above as events
    )

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        traces_sample_rate=traces_sample_rate,
        profiles_sample_rate=profiles_sample_rate,
        integrations=[logging_integration],
        # Additional Sentry configuration
        before_send=_before_send_filter,
    )

    logging.info(f"✅ Sentry initialized for environment: {environment}")
    return True


def _before_send_filter(event, hint):
    """
    Filter events before sending to Sentry

    This allows you to:
    - Add additional context
    - Filter out sensitive information
    - Modify event data
    """
    # Example: Don't send events from test environments
    if os.getenv('TESTING') == 'true':
        return None

    # Example: Add custom tags
    event.setdefault('tags', {})
    event['tags']['python_version'] = sys.version.split()[0]

    return event


def setup_logging(
    name: str = None,
    level: str = None,
    log_file: Optional[Path] = None,
    use_colors: bool = True,
    structured: bool = False
) -> logging.Logger:
    """
    Set up logging configuration

    Args:
        name: Logger name (usually __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file path for logging
        use_colors: Whether to use colored output for console
        structured: Whether to use structured logging format

    Returns:
        Configured logger instance
    """
    # Determine log level
    level = level or DEFAULT_LOG_LEVEL
    log_level = getattr(logging, level.upper(), logging.INFO)

    # Get or create logger
    logger = logging.getLogger(name) if name else logging.root
    logger.setLevel(log_level)

    # Clear existing handlers to avoid duplicates
    if logger.handlers:
        logger.handlers.clear()

    # Choose format
    log_format = STRUCTURED_FORMAT if structured else DEFAULT_LOG_FORMAT

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    if use_colors and sys.stdout.isatty():
        console_formatter = ColoredFormatter(
            log_format,
            datefmt=DEFAULT_LOG_DATE_FORMAT
        )
    else:
        console_formatter = logging.Formatter(
            log_format,
            datefmt=DEFAULT_LOG_DATE_FORMAT
        )

    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler (if specified)
    if log_file:
        log_file = Path(log_file)
        log_file.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10_000_000,  # 10 MB
            backupCount=5
        )
        file_handler.setLevel(log_level)
        file_formatter = logging.Formatter(
            STRUCTURED_FORMAT,  # Always use structured format for files
            datefmt=DEFAULT_LOG_DATE_FORMAT
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


def get_logger(
    name: str,
    level: str = None,
    log_file: Optional[Path] = None
) -> logging.Logger:
    """
    Get a configured logger instance

    This is the main entry point for getting loggers in your application.

    Args:
        name: Logger name (usually __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file path for logging

    Returns:
        Configured logger instance

    Example:
        >>> from src.utils.logging_config import get_logger
        >>> logger = get_logger(__name__)
        >>> logger.info("Starting analysis")
        >>> logger.error("An error occurred", exc_info=True)
    """
    # Check if this logger is already configured
    logger = logging.getLogger(name)

    if not logger.handlers:
        # Logger not yet configured, set it up
        logger = setup_logging(
            name=name,
            level=level,
            log_file=log_file,
            use_colors=True,
            structured=False
        )

    return logger


def log_exception(logger: logging.Logger, error: Exception, context: dict = None):
    """
    Log an exception with optional context and send to Sentry

    Args:
        logger: Logger instance
        error: The exception to log
        context: Optional dictionary of additional context

    Example:
        >>> try:
        ...     risky_operation()
        ... except Exception as e:
        ...     log_exception(logger, e, {'user_id': 123, 'operation': 'data_analysis'})
    """
    # Log to standard logging
    logger.error(
        f"Exception occurred: {type(error).__name__}: {str(error)}",
        exc_info=True,
        extra={'context': context} if context else {}
    )

    # Send to Sentry if available
    if SENTRY_AVAILABLE and sentry_sdk.Hub.current.client:
        with sentry_sdk.push_scope() as scope:
            # Add context to Sentry event
            if context:
                for key, value in context.items():
                    scope.set_context(key, {'value': value})

            # Capture exception
            sentry_sdk.capture_exception(error)


def log_performance_metric(
    logger: logging.Logger,
    operation: str,
    duration_ms: float,
    metadata: dict = None
):
    """
    Log a performance metric

    Args:
        logger: Logger instance
        operation: Name of the operation
        duration_ms: Duration in milliseconds
        metadata: Optional additional metadata

    Example:
        >>> import time
        >>> start = time.time()
        >>> # ... do work ...
        >>> duration = (time.time() - start) * 1000
        >>> log_performance_metric(logger, 'data_processing', duration, {'rows': 1000})
    """
    msg = f"Performance: {operation} completed in {duration_ms:.2f}ms"

    if metadata:
        msg += f" | Metadata: {metadata}"

    logger.info(msg)

    # Send to Sentry as a performance transaction if available
    if SENTRY_AVAILABLE and sentry_sdk.Hub.current.client:
        with sentry_sdk.start_transaction(op=operation, name=operation) as transaction:
            transaction.set_measurement(operation, duration_ms, "millisecond")
            if metadata:
                for key, value in metadata.items():
                    transaction.set_tag(key, str(value))


# Example usage and testing
if __name__ == '__main__':
    # Initialize Sentry (optional)
    init_sentry(
        # dsn='your-sentry-dsn-here',  # or set SENTRY_DSN env var
        environment='development'
    )

    # Get a logger
    logger = get_logger(__name__)

    # Test different log levels
    logger.debug("This is a debug message")
    logger.info("This is an info message")
    logger.warning("This is a warning message")
    logger.error("This is an error message")
    logger.critical("This is a critical message")

    # Test exception logging
    try:
        1 / 0
    except Exception as e:
        log_exception(
            logger,
            e,
            context={'operation': 'test_division', 'value': 1}
        )

    # Test performance logging
    import time
    start = time.time()
    time.sleep(0.1)  # Simulate work
    duration = (time.time() - start) * 1000
    log_performance_metric(
        logger,
        'test_operation',
        duration,
        metadata={'test': True}
    )
