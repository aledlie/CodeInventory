/**
 * Dashboard Usage Example
 *
 * This file demonstrates how to use the Dashboard component with Suspense and ErrorBoundary.
 * This is the recommended integration pattern for any application using the dashboard.
 *
 * Key Patterns:
 * - Wrap Dashboard in Suspense with a loading fallback
 * - Wrap Suspense in ErrorBoundary to catch fetch failures
 * - Provide QueryClientProvider at app root
 */

import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { Dashboard } from '../components/Dashboard';

/**
 * Create React Query client
 * This should be created at the app root level in a real application
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Loading fallback component for Suspense
 */
function DashboardLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.secondary">
        Loading dashboard data...
      </Typography>
    </Box>
  );
}

/**
 * Error fallback component for ErrorBoundary
 */
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function DashboardErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
        padding: 4,
      }}
    >
      <Alert
        severity="error"
        sx={{ maxWidth: 600 }}
        action={
          <Button color="inherit" size="small" onClick={resetErrorBoundary}>
            Retry
          </Button>
        }
      >
        <Typography variant="h6" gutterBottom>
          Failed to load dashboard
        </Typography>
        <Typography variant="body2">
          {error.message || 'An unexpected error occurred while loading the dashboard data.'}
        </Typography>
      </Alert>
    </Box>
  );
}

/**
 * Simple ErrorBoundary implementation
 * For production, consider using react-error-boundary package
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: (props: ErrorFallbackProps) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback({
        error: this.state.error,
        resetErrorBoundary: this.resetErrorBoundary,
      });
    }

    return this.props.children;
  }
}

/**
 * Basic Dashboard Example
 *
 * This example shows the minimal setup required to use the Dashboard component.
 */
export function BasicDashboardExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={DashboardErrorFallback}>
        <Suspense fallback={<DashboardLoader />}>
          <Dashboard outputsPath="/outputs" />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

/**
 * Advanced Dashboard Example with Custom Paths
 *
 * This example demonstrates using a custom outputs path.
 */
export function CustomPathDashboardExample() {
  const customOutputsPath = '/custom/path/to/outputs';

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={DashboardErrorFallback}>
        <Suspense fallback={<DashboardLoader />}>
          <Dashboard outputsPath={customOutputsPath} />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

/**
 * Default export - basic example
 */
export default BasicDashboardExample;
