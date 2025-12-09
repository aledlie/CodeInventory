/**
 * MetricCard Usage Examples
 *
 * Demonstrates all variations of the MetricCard component including:
 * - Different status variants
 * - With and without icons
 * - Trend indicators
 * - Interactive cards
 * - Responsive behavior
 */

import React, { useState } from 'react';
import { Box, Grid, Container, Typography } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Code as CodeIcon,
  BugReport as BugReportIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { MetricCard } from './MetricCard';

/**
 * MetricCard Example Showcase
 *
 * Shows various MetricCard configurations in a grid layout.
 * All examples are responsive and accessible.
 */
export const MetricCardExample: React.FC = () => {
  const [clickedCard, setClickedCard] = useState<string | null>(null);

  const handleCardClick = (cardName: string) => {
    setClickedCard(cardName);
    console.log(`Card clicked: ${cardName}`);
    // In a real app, this would navigate or show details
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h1" gutterBottom>
        MetricCard Component Examples
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Interactive examples showcasing all MetricCard features and variants.
      </Typography>

      {/* Status Clicked Feedback */}
      {clickedCard && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            borderRadius: 1,
          }}
        >
          Last clicked: <strong>{clickedCard}</strong>
        </Box>
      )}

      {/* Basic Examples - No Status */}
      <Typography variant="h2" gutterBottom sx={{ mt: 4 }}>
        Basic Metrics (Default Status)
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Total Files" value={1234} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Code Coverage" value={87.5} unit="%" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<AssessmentIcon />}
            label="Lines of Code"
            value={45678}
            unit="lines"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<CodeIcon />}
            label="Functions"
            value={234}
            trend="12 added this week"
          />
        </Grid>
      </Grid>

      {/* Status Variants */}
      <Typography variant="h2" gutterBottom sx={{ mt: 4 }}>
        Status Variants
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<AssessmentIcon />}
            label="Primary Metric"
            value={9876}
            status="primary"
            trend="Updated 5 minutes ago"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<CheckCircleIcon />}
            label="Tests Passing"
            value={98.2}
            unit="%"
            status="success"
            trend="+2.1% from last run"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<WarningIcon />}
            label="Code Smells"
            value={23}
            unit="issues"
            status="warning"
            trend="-3 from yesterday"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<ErrorIcon />}
            label="Critical Bugs"
            value={5}
            unit="bugs"
            status="error"
            trend="+2 new today"
          />
        </Grid>
      </Grid>

      {/* Interactive Cards */}
      <Typography variant="h2" gutterBottom sx={{ mt: 4 }}>
        Interactive Cards (Clickable)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Click or press Enter/Space to interact
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<AssessmentIcon />}
            label="Total Repositories"
            value={42}
            status="primary"
            onClick={() => handleCardClick('Total Repositories')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<BugReportIcon />}
            label="Quality Score"
            value={8.7}
            unit="/10"
            status="success"
            trend="+0.3 this month"
            onClick={() => handleCardClick('Quality Score')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<WarningIcon />}
            label="Tech Debt"
            value="32h"
            status="warning"
            trend="Estimated fix time"
            onClick={() => handleCardClick('Tech Debt')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<ErrorIcon />}
            label="Failed Tests"
            value={12}
            status="error"
            trend="Requires attention"
            onClick={() => handleCardClick('Failed Tests')}
          />
        </Grid>
      </Grid>

      {/* Large Numbers */}
      <Typography variant="h2" gutterBottom sx={{ mt: 4 }}>
        Large Number Formatting
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<CodeIcon />}
            label="Total Lines"
            value={1234567}
            unit="lines"
            status="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<AssessmentIcon />}
            label="Commits"
            value={98765}
            status="success"
            trend="+1,234 this month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Average Complexity"
            value={4.23}
            unit="/10"
            status="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Build Time"
            value="2m 34s"
            status="warning"
            trend="+15s slower"
          />
        </Grid>
      </Grid>

      {/* Mobile Preview */}
      <Typography variant="h2" gutterBottom sx={{ mt: 4 }}>
        Responsive Behavior
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Resize window to see font size changes (48px desktop → 32px mobile for values)
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <MetricCard
            icon={<AssessmentIcon />}
            label="Responsive Value"
            value={99999}
            unit="items"
            status="primary"
            trend="Scales from 48px to 32px on mobile"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default MetricCardExample;
