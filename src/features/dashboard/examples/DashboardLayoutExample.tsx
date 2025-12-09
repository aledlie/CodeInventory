/**
 * DashboardLayout Usage Example
 *
 * Demonstrates how to use the DashboardLayout component in a real application.
 * This example shows:
 * - Basic layout integration
 * - Navigation handling
 * - Action button callbacks
 * - Content rendering
 */

import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { DashboardLayout } from '../components/DashboardLayout';

/**
 * Example Dashboard Page Component
 */
export const DashboardLayoutExample: React.FC = () => {
  // State for current path (in real app, use React Router)
  const [currentPath, setCurrentPath] = useState('/dashboard');

  // Last generated timestamp
  const lastGenerated = new Date();

  /**
   * Handle navigation
   * In a real app, this would use React Router's navigate()
   */
  const handleNavigate = (path: string) => {
    console.log('Navigating to:', path);
    setCurrentPath(path);
  };

  /**
   * Handle settings click
   */
  const handleSettingsClick = () => {
    console.log('Settings clicked');
    // Open settings modal/page
  };

  /**
   * Handle export click
   */
  const handleExportClick = () => {
    console.log('Export clicked');
    // Trigger export functionality
  };

  /**
   * Render different content based on current path
   */
  const renderContent = () => {
    switch (currentPath) {
      case '/dashboard':
        return (
          <>
            <Typography variant="h2" gutterBottom>
              Dashboard Overview
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Welcome to the Code Inventory Dashboard. This is the main overview page.
            </Typography>
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Code Quality
                    </Typography>
                    <Typography variant="h3" color="primary">
                      95%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall quality score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Test Coverage
                    </Typography>
                    <Typography variant="h3" color="success.main">
                      82%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lines covered by tests
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Dependencies
                    </Typography>
                    <Typography variant="h3" color="info.main">
                      127
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total dependencies
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        );

      case '/dashboard/quality':
        return (
          <>
            <Typography variant="h2" gutterBottom>
              Code Quality Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Detailed code quality metrics and issues.
            </Typography>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="body1">
                  Code quality analysis content would go here...
                </Typography>
              </CardContent>
            </Card>
          </>
        );

      case '/dashboard/coverage':
        return (
          <>
            <Typography variant="h2" gutterBottom>
              Test Coverage Report
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Test coverage statistics and untested functions.
            </Typography>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="body1">
                  Test coverage report content would go here...
                </Typography>
              </CardContent>
            </Card>
          </>
        );

      case '/dashboard/dependencies':
        return (
          <>
            <Typography variant="h2" gutterBottom>
              Dependency Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Dependency graph and circular dependency detection.
            </Typography>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="body1">
                  Dependency analysis content would go here...
                </Typography>
              </CardContent>
            </Card>
          </>
        );

      case '/dashboard/settings':
        return (
          <>
            <Typography variant="h2" gutterBottom>
              Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Configure dashboard preferences and options.
            </Typography>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="body1">
                  Settings content would go here...
                </Typography>
              </CardContent>
            </Card>
          </>
        );

      default:
        return (
          <Typography variant="h2">
            Page not found
          </Typography>
        );
    }
  };

  return (
    <DashboardLayout
      lastGenerated={lastGenerated}
      currentPath={currentPath}
      onNavigate={handleNavigate}
      onSettingsClick={handleSettingsClick}
      onExportClick={handleExportClick}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default DashboardLayoutExample;
