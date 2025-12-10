import { Box, Skeleton, Container, Paper } from '@mui/material';

/**
 * SuspenseLoader Component
 *
 * Loading skeleton displayed while Dashboard suspends during data fetching.
 * Matches the dashboard layout structure to minimize layout shift.
 *
 * Features:
 * - Animated skeleton components from MUI
 * - Matches dashboard grid layout (3 columns on desktop, 1 on mobile)
 * - Mirrors header, sidebar, and content structure
 * - Smooth transitions when content loads
 *
 * Used as Suspense fallback:
 * ```tsx
 * <Suspense fallback={<SuspenseLoader />}>
 *   <Dashboard />
 * </Suspense>
 * ```
 */
export function SuspenseLoader() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Skeleton */}
      <Box
        sx={{
          height: 64,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          px: 3,
        }}
      >
        <Skeleton
          variant="rectangular"
          width={180}
          height={32}
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}
        />
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Skeleton (hidden on mobile) */}
        <Box
          sx={{
            width: 280,
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
            p: 2,
            display: { xs: 'none', md: 'block' },
          }}
        >
          {/* Navigation items skeleton */}
          {[1, 2, 3, 4, 5].map((item) => (
            <Box key={item} sx={{ mb: 2 }}>
              <Skeleton variant="rectangular" width="100%" height={40} />
            </Box>
          ))}
        </Box>

        {/* Dashboard Content Skeleton */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            bgcolor: 'background.default',
          }}
        >
          <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Health Summary Skeleton */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Skeleton variant="rectangular" width="40%" height={32} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={24} />
            </Paper>

            {/* Metric Cards Grid Skeleton */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 3,
              }}
            >
              {/* Generate 6 metric card skeletons */}
              {[1, 2, 3, 4, 5, 6].map((card) => (
                <Paper
                  key={card}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                    height: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {/* Icon skeleton */}
                  <Skeleton
                    variant="circular"
                    width={48}
                    height={48}
                    sx={{ alignSelf: 'flex-start' }}
                  />

                  {/* Title skeleton */}
                  <Skeleton variant="text" width="60%" height={24} />

                  {/* Value skeleton */}
                  <Skeleton
                    variant="rectangular"
                    width="80%"
                    height={48}
                    sx={{ mt: 'auto' }}
                  />

                  {/* Subtitle skeleton */}
                  <Skeleton variant="text" width="50%" height={20} />
                </Paper>
              ))}
            </Box>

            {/* Additional content sections skeleton */}
            <Box sx={{ mt: 4 }}>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={400}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default SuspenseLoader;
