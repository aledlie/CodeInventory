#!/usr/bin/env python3
"""
Unit tests for logging_config.py

Tests for the centralized logging configuration module including
ColoredFormatter, Sentry integration, and logging utilities.
"""

import io
import logging
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from typing import Dict, Any
from unittest.mock import MagicMock, patch, PropertyMock

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.utils.logging_config import (
    ColoredFormatter,
    init_sentry,
    setup_logging,
    get_logger,
    log_exception,
    log_performance_metric,
    _before_send_filter,
    DEFAULT_LOG_LEVEL,
    DEFAULT_LOG_FORMAT,
    DEFAULT_LOG_DATE_FORMAT,
    STRUCTURED_FORMAT,
    SENTRY_AVAILABLE,
)


# ============================================================================
# Test Constants
# ============================================================================

TEST_LOGGER_NAME = 'test_logger'
TEST_LOG_MESSAGE = 'Test log message'
TEST_OPERATION_NAME = 'test_operation'
TEST_DURATION_MS = 150.5
TEST_METADATA = {'key1': 'value1', 'key2': 42}


# ============================================================================
# ColoredFormatter Tests
# ============================================================================

class TestColoredFormatter(unittest.TestCase):
    """Tests for ColoredFormatter class."""

    def setUp(self):
        """Set up test fixtures."""
        self.formatter = ColoredFormatter(
            DEFAULT_LOG_FORMAT,
            datefmt=DEFAULT_LOG_DATE_FORMAT
        )

    def test_color_codes_defined(self):
        """Test that ANSI color codes are defined for all log levels."""
        expected_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        for level in expected_levels:
            self.assertIn(level, ColoredFormatter.COLORS)

    def test_reset_code_defined(self):
        """Test that RESET ANSI code is defined."""
        self.assertEqual(ColoredFormatter.RESET, '\033[0m')

    def test_format_debug_message(self):
        """Test formatting DEBUG level message with color."""
        record = logging.LogRecord(
            name=TEST_LOGGER_NAME,
            level=logging.DEBUG,
            pathname='test.py',
            lineno=1,
            msg=TEST_LOG_MESSAGE,
            args=(),
            exc_info=None
        )
        formatted = self.formatter.format(record)

        # Message should contain the log message
        self.assertIn(TEST_LOG_MESSAGE, formatted)
        # Original levelname should be restored
        self.assertEqual(record.levelname, 'DEBUG')

    def test_format_info_message(self):
        """Test formatting INFO level message with color."""
        record = logging.LogRecord(
            name=TEST_LOGGER_NAME,
            level=logging.INFO,
            pathname='test.py',
            lineno=1,
            msg=TEST_LOG_MESSAGE,
            args=(),
            exc_info=None
        )
        formatted = self.formatter.format(record)

        self.assertIn(TEST_LOG_MESSAGE, formatted)
        self.assertEqual(record.levelname, 'INFO')

    def test_format_warning_message(self):
        """Test formatting WARNING level message with color."""
        record = logging.LogRecord(
            name=TEST_LOGGER_NAME,
            level=logging.WARNING,
            pathname='test.py',
            lineno=1,
            msg='Warning message',
            args=(),
            exc_info=None
        )
        formatted = self.formatter.format(record)

        self.assertIn('Warning message', formatted)
        self.assertEqual(record.levelname, 'WARNING')

    def test_format_error_message(self):
        """Test formatting ERROR level message with color."""
        record = logging.LogRecord(
            name=TEST_LOGGER_NAME,
            level=logging.ERROR,
            pathname='test.py',
            lineno=1,
            msg='Error message',
            args=(),
            exc_info=None
        )
        formatted = self.formatter.format(record)

        self.assertIn('Error message', formatted)
        self.assertEqual(record.levelname, 'ERROR')

    def test_format_critical_message(self):
        """Test formatting CRITICAL level message with color."""
        record = logging.LogRecord(
            name=TEST_LOGGER_NAME,
            level=logging.CRITICAL,
            pathname='test.py',
            lineno=1,
            msg='Critical message',
            args=(),
            exc_info=None
        )
        formatted = self.formatter.format(record)

        self.assertIn('Critical message', formatted)
        self.assertEqual(record.levelname, 'CRITICAL')

    def test_levelname_restored_after_format(self):
        """Test that levelname is restored to original after formatting."""
        record = logging.LogRecord(
            name=TEST_LOGGER_NAME,
            level=logging.ERROR,
            pathname='test.py',
            lineno=1,
            msg=TEST_LOG_MESSAGE,
            args=(),
            exc_info=None
        )
        original_levelname = record.levelname

        self.formatter.format(record)

        self.assertEqual(record.levelname, original_levelname)


# ============================================================================
# before_send_filter Tests
# ============================================================================

class TestBeforeSendFilter(unittest.TestCase):
    """Tests for _before_send_filter function."""

    def test_returns_none_when_testing_env(self):
        """Test that filter returns None when TESTING=true."""
        with patch.dict(os.environ, {'TESTING': 'true'}):
            result = _before_send_filter({}, {})
            self.assertIsNone(result)

    def test_adds_python_version_tag(self):
        """Test that filter adds Python version tag."""
        with patch.dict(os.environ, {'TESTING': 'false'}):
            event: Dict[str, Any] = {}
            result = _before_send_filter(event, {})

            self.assertIsNotNone(result)
            self.assertIn('tags', result)
            self.assertIn('python_version', result['tags'])

    def test_preserves_existing_tags(self):
        """Test that filter preserves existing tags."""
        with patch.dict(os.environ, {'TESTING': 'false'}):
            event: Dict[str, Any] = {'tags': {'existing_tag': 'value'}}
            result = _before_send_filter(event, {})

            self.assertIsNotNone(result)
            self.assertEqual(result['tags']['existing_tag'], 'value')
            self.assertIn('python_version', result['tags'])

    def test_filter_with_empty_event(self):
        """Test filter with empty event dict."""
        with patch.dict(os.environ, {'TESTING': 'false'}):
            result = _before_send_filter({}, {})

            self.assertIsNotNone(result)
            self.assertIn('tags', result)


# ============================================================================
# init_sentry Tests
# ============================================================================

class TestInitSentry(unittest.TestCase):
    """Tests for init_sentry function."""

    def test_returns_false_when_sentry_not_available(self):
        """Test that init_sentry returns False when Sentry SDK is not installed."""
        with patch('src.utils.logging_config.SENTRY_AVAILABLE', False):
            result = init_sentry()
            self.assertFalse(result)

    def test_returns_false_when_no_dsn(self):
        """Test that init_sentry returns False when DSN is not provided."""
        with patch.dict(os.environ, {}, clear=True):
            # Clear SENTRY_DSN if it exists
            os.environ.pop('SENTRY_DSN', None)
            result = init_sentry()
            self.assertFalse(result)

    @patch('src.utils.logging_config.SENTRY_AVAILABLE', True)
    @patch('src.utils.logging_config.sentry_sdk')
    @patch('src.utils.logging_config.LoggingIntegration')
    def test_initializes_sentry_with_dsn(self, mock_logging_integration, mock_sentry_sdk):
        """Test that init_sentry initializes Sentry with provided DSN."""
        mock_logging_integration.return_value = MagicMock()

        result = init_sentry(dsn='https://test@sentry.io/123', environment='test')

        self.assertTrue(result)
        mock_sentry_sdk.init.assert_called_once()

    @patch('src.utils.logging_config.SENTRY_AVAILABLE', True)
    @patch('src.utils.logging_config.sentry_sdk')
    @patch('src.utils.logging_config.LoggingIntegration')
    def test_uses_environment_from_param(self, mock_logging_integration, mock_sentry_sdk):
        """Test that init_sentry uses environment parameter."""
        mock_logging_integration.return_value = MagicMock()

        init_sentry(dsn='https://test@sentry.io/123', environment='production')

        call_kwargs = mock_sentry_sdk.init.call_args[1]
        self.assertEqual(call_kwargs['environment'], 'production')

    @patch('src.utils.logging_config.SENTRY_AVAILABLE', True)
    @patch('src.utils.logging_config.sentry_sdk')
    @patch('src.utils.logging_config.LoggingIntegration')
    def test_uses_custom_sample_rates(self, mock_logging_integration, mock_sentry_sdk):
        """Test that init_sentry uses custom sample rates."""
        mock_logging_integration.return_value = MagicMock()

        init_sentry(
            dsn='https://test@sentry.io/123',
            traces_sample_rate=0.5,
            profiles_sample_rate=0.3
        )

        call_kwargs = mock_sentry_sdk.init.call_args[1]
        self.assertEqual(call_kwargs['traces_sample_rate'], 0.5)
        self.assertEqual(call_kwargs['profiles_sample_rate'], 0.3)


# ============================================================================
# setup_logging Tests
# ============================================================================

class TestSetupLogging(unittest.TestCase):
    """Tests for setup_logging function."""

    def tearDown(self):
        """Clean up loggers after each test."""
        # Remove test loggers
        for name in list(logging.Logger.manager.loggerDict.keys()):
            if 'test' in name.lower():
                logger = logging.getLogger(name)
                logger.handlers.clear()

    def test_returns_logger_instance(self):
        """Test that setup_logging returns a Logger instance."""
        logger = setup_logging(name='test_setup_basic')
        self.assertIsInstance(logger, logging.Logger)

    def test_uses_default_log_level(self):
        """Test that setup_logging uses default log level when not specified."""
        logger = setup_logging(name='test_setup_default_level')
        # Default is INFO
        self.assertEqual(logger.level, logging.INFO)

    def test_uses_custom_log_level(self):
        """Test that setup_logging uses custom log level."""
        logger = setup_logging(name='test_setup_custom_level', level='DEBUG')
        self.assertEqual(logger.level, logging.DEBUG)

    def test_handles_invalid_log_level(self):
        """Test that setup_logging handles invalid log level gracefully."""
        logger = setup_logging(name='test_setup_invalid_level', level='INVALID')
        # Should fall back to INFO
        self.assertEqual(logger.level, logging.INFO)

    def test_adds_console_handler(self):
        """Test that setup_logging adds a console handler."""
        logger = setup_logging(name='test_setup_console')
        self.assertTrue(len(logger.handlers) >= 1)
        self.assertIsInstance(logger.handlers[0], logging.StreamHandler)

    def test_clears_existing_handlers(self):
        """Test that setup_logging clears existing handlers."""
        logger_name = 'test_setup_clear_handlers'
        logger = logging.getLogger(logger_name)
        logger.addHandler(logging.NullHandler())
        logger.addHandler(logging.NullHandler())

        setup_logging(name=logger_name)

        # Should only have the new handler(s), not the old NullHandlers
        null_handlers = [h for h in logger.handlers if isinstance(h, logging.NullHandler)]
        self.assertEqual(len(null_handlers), 0)

    def test_uses_structured_format(self):
        """Test that setup_logging uses structured format when specified."""
        logger = setup_logging(name='test_setup_structured', structured=True)
        handler = logger.handlers[0]
        # Check formatter contains structured format elements
        self.assertIn('funcName', handler.formatter._fmt)

    def test_uses_colors_when_tty(self):
        """Test that setup_logging uses colors when stdout is a TTY."""
        with patch.object(sys.stdout, 'isatty', return_value=True):
            logger = setup_logging(name='test_setup_colors_tty', use_colors=True)
            handler = logger.handlers[0]
            self.assertIsInstance(handler.formatter, ColoredFormatter)

    def test_no_colors_when_not_tty(self):
        """Test that setup_logging does not use colors when stdout is not a TTY."""
        with patch.object(sys.stdout, 'isatty', return_value=False):
            logger = setup_logging(name='test_setup_no_colors', use_colors=True)
            handler = logger.handlers[0]
            # Should be regular Formatter, not ColoredFormatter
            self.assertNotIsInstance(handler.formatter, ColoredFormatter)

    def test_adds_file_handler_when_specified(self):
        """Test that setup_logging adds file handler when log_file is specified."""
        with tempfile.TemporaryDirectory() as tmpdir:
            log_file = Path(tmpdir) / 'test.log'
            logger = setup_logging(name='test_setup_file', log_file=log_file)

            file_handlers = [h for h in logger.handlers
                           if isinstance(h, logging.handlers.RotatingFileHandler)]
            self.assertEqual(len(file_handlers), 1)

    def test_creates_log_file_directory(self):
        """Test that setup_logging creates log file directory if it doesn't exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            log_file = Path(tmpdir) / 'subdir' / 'test.log'
            setup_logging(name='test_setup_mkdir', log_file=log_file)

            self.assertTrue(log_file.parent.exists())

    def test_propagate_is_false(self):
        """Test that logger propagate is set to False."""
        logger = setup_logging(name='test_setup_propagate')
        self.assertFalse(logger.propagate)

    def test_root_logger_when_name_is_none(self):
        """Test that setup_logging uses root logger when name is None."""
        with patch('logging.root') as mock_root:
            mock_root.handlers = []
            mock_root.setLevel = MagicMock()
            mock_root.addHandler = MagicMock()
            setup_logging(name=None)
            mock_root.setLevel.assert_called()


# ============================================================================
# get_logger Tests
# ============================================================================

class TestGetLogger(unittest.TestCase):
    """Tests for get_logger function."""

    def tearDown(self):
        """Clean up loggers after each test."""
        for name in list(logging.Logger.manager.loggerDict.keys()):
            if 'test' in name.lower():
                logger = logging.getLogger(name)
                logger.handlers.clear()

    def test_returns_logger_instance(self):
        """Test that get_logger returns a Logger instance."""
        logger = get_logger('test_get_basic')
        self.assertIsInstance(logger, logging.Logger)

    def test_configures_logger_on_first_call(self):
        """Test that get_logger configures the logger on first call."""
        logger_name = 'test_get_first_call'
        logger = get_logger(logger_name)
        self.assertTrue(len(logger.handlers) >= 1)

    def test_returns_same_logger_on_subsequent_calls(self):
        """Test that get_logger returns the same logger on subsequent calls."""
        logger_name = 'test_get_same_logger'
        logger1 = get_logger(logger_name)
        logger2 = get_logger(logger_name)
        self.assertIs(logger1, logger2)

    def test_does_not_add_duplicate_handlers(self):
        """Test that get_logger does not add duplicate handlers."""
        logger_name = 'test_get_no_duplicate'
        logger1 = get_logger(logger_name)
        initial_handlers = len(logger1.handlers)

        logger2 = get_logger(logger_name)
        final_handlers = len(logger2.handlers)

        self.assertEqual(initial_handlers, final_handlers)

    def test_respects_custom_level(self):
        """Test that get_logger respects custom level parameter."""
        logger = get_logger('test_get_custom_level', level='WARNING')
        self.assertEqual(logger.level, logging.WARNING)

    def test_respects_log_file_parameter(self):
        """Test that get_logger respects log_file parameter."""
        with tempfile.TemporaryDirectory() as tmpdir:
            log_file = Path(tmpdir) / 'test.log'
            logger = get_logger('test_get_log_file', log_file=log_file)

            file_handlers = [h for h in logger.handlers
                           if isinstance(h, logging.handlers.RotatingFileHandler)]
            self.assertEqual(len(file_handlers), 1)


# ============================================================================
# log_exception Tests
# ============================================================================

class TestLogException(unittest.TestCase):
    """Tests for log_exception function."""

    def setUp(self):
        """Set up test fixtures."""
        self.logger = MagicMock(spec=logging.Logger)

    def test_logs_exception_message(self):
        """Test that log_exception logs the exception message."""
        error = ValueError("Test error message")
        log_exception(self.logger, error)

        self.logger.error.assert_called_once()
        call_args = self.logger.error.call_args
        self.assertIn('ValueError', call_args[0][0])
        self.assertIn('Test error message', call_args[0][0])

    def test_logs_with_exc_info(self):
        """Test that log_exception logs with exc_info=True."""
        error = ValueError("Test error")
        log_exception(self.logger, error)

        call_kwargs = self.logger.error.call_args[1]
        self.assertTrue(call_kwargs['exc_info'])

    def test_logs_with_context(self):
        """Test that log_exception includes context in extra."""
        error = ValueError("Test error")
        context = {'operation': 'test_op', 'user_id': 123}
        log_exception(self.logger, error, context=context)

        call_kwargs = self.logger.error.call_args[1]
        self.assertIn('extra', call_kwargs)
        self.assertEqual(call_kwargs['extra']['context'], context)

    def test_logs_without_context(self):
        """Test that log_exception works without context."""
        error = ValueError("Test error")
        log_exception(self.logger, error)

        # Should complete without error
        self.logger.error.assert_called_once()

    @patch('src.utils.logging_config.SENTRY_AVAILABLE', True)
    @patch('src.utils.logging_config.sentry_sdk')
    def test_sends_to_sentry_when_available(self, mock_sentry_sdk):
        """Test that log_exception sends to Sentry when available."""
        mock_client = MagicMock()
        mock_client.is_active.return_value = True
        mock_sentry_sdk.get_client.return_value = mock_client

        error = ValueError("Test error")
        log_exception(self.logger, error)

        mock_sentry_sdk.capture_exception.assert_called_once_with(error)

    @patch('src.utils.logging_config.SENTRY_AVAILABLE', True)
    @patch('src.utils.logging_config.sentry_sdk')
    def test_adds_context_to_sentry_scope(self, mock_sentry_sdk):
        """Test that log_exception adds context to Sentry scope."""
        mock_client = MagicMock()
        mock_client.is_active.return_value = True
        mock_sentry_sdk.get_client.return_value = mock_client
        mock_scope = MagicMock()
        mock_sentry_sdk.isolation_scope.return_value.__enter__ = MagicMock(return_value=mock_scope)
        mock_sentry_sdk.isolation_scope.return_value.__exit__ = MagicMock(return_value=False)

        error = ValueError("Test error")
        context = {'key': 'value'}
        log_exception(self.logger, error, context=context)

        mock_scope.set_context.assert_called()

    @patch('src.utils.logging_config.SENTRY_AVAILABLE', False)
    def test_skips_sentry_when_not_available(self):
        """Test that log_exception skips Sentry when not available."""
        error = ValueError("Test error")
        # Should complete without error even when Sentry is not available
        log_exception(self.logger, error)
        self.logger.error.assert_called_once()


# ============================================================================
# log_performance_metric Tests
# ============================================================================

class TestLogPerformanceMetric(unittest.TestCase):
    """Tests for log_performance_metric function."""

    def setUp(self):
        """Set up test fixtures."""
        self.logger = MagicMock(spec=logging.Logger)

    def test_logs_performance_message(self):
        """Test that log_performance_metric logs performance message."""
        log_performance_metric(
            self.logger,
            TEST_OPERATION_NAME,
            TEST_DURATION_MS
        )

        self.logger.info.assert_called_once()
        call_args = self.logger.info.call_args[0][0]
        self.assertIn('Performance', call_args)
        self.assertIn(TEST_OPERATION_NAME, call_args)
        self.assertIn('150.50ms', call_args)

    def test_includes_metadata_in_message(self):
        """Test that log_performance_metric includes metadata in message."""
        log_performance_metric(
            self.logger,
            TEST_OPERATION_NAME,
            TEST_DURATION_MS,
            metadata=TEST_METADATA
        )

        call_args = self.logger.info.call_args[0][0]
        self.assertIn('Metadata', call_args)

    def test_works_without_metadata(self):
        """Test that log_performance_metric works without metadata."""
        log_performance_metric(
            self.logger,
            TEST_OPERATION_NAME,
            TEST_DURATION_MS
        )

        call_args = self.logger.info.call_args[0][0]
        self.assertNotIn('Metadata', call_args)

    @patch('src.utils.logging_config.SENTRY_AVAILABLE', True)
    @patch('src.utils.logging_config.sentry_sdk')
    def test_creates_sentry_transaction_when_available(self, mock_sentry_sdk):
        """Test that log_performance_metric creates Sentry transaction."""
        mock_client = MagicMock()
        mock_client.is_active.return_value = True
        mock_sentry_sdk.get_client.return_value = mock_client
        mock_transaction = MagicMock()
        mock_sentry_sdk.start_transaction.return_value.__enter__ = MagicMock(return_value=mock_transaction)
        mock_sentry_sdk.start_transaction.return_value.__exit__ = MagicMock(return_value=False)

        log_performance_metric(
            self.logger,
            TEST_OPERATION_NAME,
            TEST_DURATION_MS
        )

        mock_sentry_sdk.start_transaction.assert_called_once()

    @patch('src.utils.logging_config.SENTRY_AVAILABLE', True)
    @patch('src.utils.logging_config.sentry_sdk')
    def test_sets_measurement_on_sentry_transaction(self, mock_sentry_sdk):
        """Test that log_performance_metric sets measurement on Sentry transaction."""
        mock_client = MagicMock()
        mock_client.is_active.return_value = True
        mock_sentry_sdk.get_client.return_value = mock_client
        mock_transaction = MagicMock()
        mock_sentry_sdk.start_transaction.return_value.__enter__ = MagicMock(return_value=mock_transaction)
        mock_sentry_sdk.start_transaction.return_value.__exit__ = MagicMock(return_value=False)

        log_performance_metric(
            self.logger,
            TEST_OPERATION_NAME,
            TEST_DURATION_MS
        )

        mock_transaction.set_measurement.assert_called_once_with(
            TEST_OPERATION_NAME,
            TEST_DURATION_MS,
            'millisecond'
        )

    @patch('src.utils.logging_config.SENTRY_AVAILABLE', True)
    @patch('src.utils.logging_config.sentry_sdk')
    def test_sets_tags_from_metadata(self, mock_sentry_sdk):
        """Test that log_performance_metric sets tags from metadata."""
        mock_client = MagicMock()
        mock_client.is_active.return_value = True
        mock_sentry_sdk.get_client.return_value = mock_client
        mock_transaction = MagicMock()
        mock_sentry_sdk.start_transaction.return_value.__enter__ = MagicMock(return_value=mock_transaction)
        mock_sentry_sdk.start_transaction.return_value.__exit__ = MagicMock(return_value=False)

        log_performance_metric(
            self.logger,
            TEST_OPERATION_NAME,
            TEST_DURATION_MS,
            metadata=TEST_METADATA
        )

        # Check that set_tag was called for each metadata item
        self.assertEqual(mock_transaction.set_tag.call_count, len(TEST_METADATA))

    @patch('src.utils.logging_config.SENTRY_AVAILABLE', False)
    def test_skips_sentry_when_not_available(self):
        """Test that log_performance_metric skips Sentry when not available."""
        log_performance_metric(
            self.logger,
            TEST_OPERATION_NAME,
            TEST_DURATION_MS
        )
        # Should complete without error
        self.logger.info.assert_called_once()


# ============================================================================
# Constants Tests
# ============================================================================

class TestConstants(unittest.TestCase):
    """Tests for module constants."""

    def test_default_log_level_is_info(self):
        """Test that default log level is INFO."""
        # Clear any environment override
        with patch.dict(os.environ, {}, clear=True):
            # Re-import to get default
            self.assertEqual(DEFAULT_LOG_LEVEL, os.getenv('LOG_LEVEL', 'INFO'))

    def test_default_log_format_contains_required_fields(self):
        """Test that default log format contains required fields."""
        required_fields = ['asctime', 'name', 'levelname', 'message']
        for field in required_fields:
            self.assertIn(field, DEFAULT_LOG_FORMAT)

    def test_structured_format_contains_additional_fields(self):
        """Test that structured format contains additional fields."""
        additional_fields = ['funcName', 'lineno']
        for field in additional_fields:
            self.assertIn(field, STRUCTURED_FORMAT)


# ============================================================================
# Integration Tests
# ============================================================================

class TestLoggingIntegration(unittest.TestCase):
    """Integration tests for logging functionality."""

    def tearDown(self):
        """Clean up loggers after each test."""
        for name in list(logging.Logger.manager.loggerDict.keys()):
            if 'integration_test' in name.lower():
                logger = logging.getLogger(name)
                logger.handlers.clear()

    def test_full_logging_workflow(self):
        """Test complete logging workflow from setup to output."""
        with tempfile.TemporaryDirectory() as tmpdir:
            log_file = Path(tmpdir) / 'test.log'

            # Set up logging
            logger = get_logger('integration_test_workflow', level='DEBUG', log_file=log_file)

            # Log messages at different levels
            logger.debug('Debug message')
            logger.info('Info message')
            logger.warning('Warning message')
            logger.error('Error message')

            # Verify file was created
            self.assertTrue(log_file.exists())

            # Read log file and verify content
            log_content = log_file.read_text()
            self.assertIn('Debug message', log_content)
            self.assertIn('Info message', log_content)
            self.assertIn('Warning message', log_content)
            self.assertIn('Error message', log_content)

    def test_exception_logging_workflow(self):
        """Test exception logging workflow."""
        logger = MagicMock(spec=logging.Logger)

        try:
            raise ValueError("Test exception")
        except Exception as e:
            log_exception(logger, e, context={'test': True})

        # Verify error was logged
        self.logger_error_called = logger.error.called
        self.assertTrue(logger.error.called)

    def test_performance_metric_workflow(self):
        """Test performance metric logging workflow."""
        logger = MagicMock(spec=logging.Logger)

        # Simulate timing an operation
        start = time.time()
        time.sleep(0.01)  # Small delay
        duration = (time.time() - start) * 1000

        log_performance_metric(
            logger,
            'test_operation',
            duration,
            metadata={'items_processed': 100}
        )

        # Verify metric was logged
        self.assertTrue(logger.info.called)
        call_args = logger.info.call_args[0][0]
        self.assertIn('Performance', call_args)


if __name__ == '__main__':
    unittest.main()
