/**
 * Header Component Usage Example
 *
 * This file demonstrates how to use the Header component in a real application.
 * Shows integration with theme provider, state management, and callbacks.
 */

import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, Paper } from '@mui/material';
import { dashboardTheme } from '../../../theme/dashboardTheme';
import { Header } from './Header';
import { logger } from '../helpers/logger';

/**
 * Example dashboard application showing Header integration
 */
export function HeaderExample() {
  // Track last generated timestamp
  const [lastGenerated, setLastGenerated] = useState<Date>(new Date());
  const [dataRefreshing, setDataRefreshing] = useState(false);

  /**
   * Simulate data refresh every 30 seconds
   */
  useEffect(() => {
    const interval = setInterval(() => {
      logger.info('HeaderExample', 'Auto-refreshing dashboard data...');
      setLastGenerated(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  /**
   * Handle settings button click
   */
  const handleSettingsClick = () => {
    logger.info('HeaderExample', 'Settings button clicked');
    alert('Settings modal would open here');
  };

  /**
   * Handle export button click
   */
  const handleExportClick = async () => {
    logger.info('HeaderExample', 'Export button clicked');
    setDataRefreshing(true);

    // Simulate data export
    setTimeout(() => {
      const data = {
        timestamp: new Date().toISOString(),
        metrics: {
          files: 1234,
          functions: 5678,
          issues: 42,
        },
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setDataRefreshing(false);
      logger.info('HeaderExample', 'Export completed');
    }, 1000);
  };

  return (
    <ThemeProvider theme={dashboardTheme}>
      <CssBaseline />

      {/* Header Component */}
      <Header
        lastGenerated={lastGenerated}
        onSettingsClick={handleSettingsClick}
        onExportClick={handleExportClick}
      />

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h2" gutterBottom>
            Dashboard Content
          </Typography>

          <Typography variant="body1" paragraph>
            This example demonstrates the Header component with full functionality:
          </Typography>

          <Box component="ul" sx={{ pl: 3 }}>
            <li>
              <Typography variant="body1">
                <strong>Sticky Positioning:</strong> Scroll down to see the header stick to the top
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Live Timestamp:</strong> Auto-refreshes every 30 seconds
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Settings Button:</strong> Click to open settings (shows alert in demo)
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Export Button:</strong> Click to export dashboard data as JSON
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Responsive:</strong> Resize browser to see mobile layout with drawer menu
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Keyboard Accessible:</strong> Use Tab to navigate, Enter to activate buttons
              </Typography>
            </li>
          </Box>

          {/* Spacer content to demonstrate sticky header */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h3" gutterBottom>
              Scroll Test Area
            </Typography>
            {[...Array(20)].map((_, index) => (
              <Paper
                key={index}
                elevation={1}
                sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}
              >
                <Typography variant="h4">Section {index + 1}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Scroll down to see the header remain sticky at the top of the viewport.
                  The header uses <code>position="sticky"</code> with proper z-index.
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Data refreshing indicator */}
          {dataRefreshing && (
            <Paper
              elevation={3}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                p: 2,
                backgroundColor: 'primary.main',
                color: 'white',
              }}
            >
              <Typography variant="body2">
                Exporting dashboard data...
              </Typography>
            </Paper>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default HeaderExample;
