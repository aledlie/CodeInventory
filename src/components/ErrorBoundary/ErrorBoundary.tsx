import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
} from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

/**
 * ErrorBoundary Props
 */
interface ErrorBoundaryProps {
  /**
   * Child components to render
   */
  children: ReactNode;

  /**
   * Optional custom fallback UI
   */
  fallback?: ReactNode;

  /**
   * Optional callback when error occurs
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Show detailed error info in development
   * @default true in development
   */
  showDetails?: boolean;
}

/**
 * ErrorBoundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches React errors in child component tree and displays user-friendly fallback UI.
 * Provides retry functionality to attempt re-rendering.
 *
 * Features:
 * - Catches rendering errors, lifecycle errors, and errors in constructors
 * - Displays user-friendly error message with retry button
 * - Shows detailed error info in development mode
 * - Allows custom error logging/reporting
 * - Provides custom fallback UI option
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary onError={(error) => console.error(error)}>
 *   <Dashboard />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <Dashboard />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Static method to update state when error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details when component catches an error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error boundary state and retry rendering
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Render fallback UI when error occurs
   */
  renderErrorUI(): ReactNode {
    const { fallback, showDetails = process.env.NODE_ENV === 'development' } = this.props;
    const { error, errorInfo } = this.state;

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Default error UI
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              border: 1,
              borderColor: 'error.light',
              textAlign: 'center',
            }}
          >
            {/* Error Icon */}
            <ErrorOutline
              sx={{
                fontSize: 80,
                color: 'error.main',
                mb: 2,
              }}
            />

            {/* Error Title */}
            <Typography variant="h4" component="h1" gutterBottom color="error">
              Oops! Something went wrong
            </Typography>

            {/* Error Description */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We encountered an error while loading the dashboard. This might be due to
              missing or invalid report files.
            </Typography>

            {/* Retry Button */}
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Refresh />}
              onClick={this.handleReset}
              sx={{ mb: 3 }}
            >
              Retry
            </Button>

            {/* Detailed Error Info (Development Only) */}
            {showDetails && error && (
              <Alert severity="error" sx={{ textAlign: 'left', mt: 3 }}>
                <AlertTitle>Error Details (Development Mode)</AlertTitle>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  <strong>Error:</strong> {error.toString()}
                  {'\n\n'}
                  <strong>Component Stack:</strong>
                  {errorInfo?.componentStack}
                </Typography>
              </Alert>
            )}

            {/* Helpful Tips */}
            <Box sx={{ mt: 4, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Common solutions:
              </Typography>
              <Typography variant="body2" color="text.secondary" component="ul">
                <li>Ensure analysis reports have been generated in the outputs directory</li>
                <li>Check that report JSON files are valid and not corrupted</li>
                <li>Verify the outputs path configuration is correct</li>
                <li>Try running the analysis pipeline again</li>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  render(): ReactNode {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return this.renderErrorUI();
    }

    return children;
  }
}

export default ErrorBoundary;
