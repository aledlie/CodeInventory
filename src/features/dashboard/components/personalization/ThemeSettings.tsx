/**
 * ThemeSettings Component
 *
 * Phase 5C: Advanced Features
 * Theme settings panel with mode selection and preview
 */

import { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import ComputerIcon from '@mui/icons-material/Computer';
import { useTheme, type ThemeMode } from '@/theme';

// ============================================================================
// Types
// ============================================================================

export interface ThemeSettingsProps {
  /** Show preview cards */
  showPreview?: boolean;
  /** Show system preference info */
  showSystemInfo?: boolean;
  /** Compact mode (single row) */
  compact?: boolean;
}

// ============================================================================
// Theme Preview Component
// ============================================================================

interface ThemePreviewCardProps {
  theme: 'light' | 'dark';
  isActive: boolean;
}

function ThemePreviewCard({ theme, isActive }: ThemePreviewCardProps) {
  const isDark = theme === 'dark';

  return (
    <Paper
      elevation={isActive ? 4 : 1}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        border: isActive ? '2px solid' : '1px solid',
        borderColor: isActive ? 'primary.main' : isDark ? '#404040' : '#e0e0e0',
        transition: 'all 0.2s ease-in-out',
        minWidth: 120,
      }}
    >
      {/* Mock header */}
      <Box
        sx={{
          height: 8,
          borderRadius: 1,
          backgroundColor: isDark ? '#66b3ff' : '#0066cc',
          mb: 1,
        }}
      />

      {/* Mock content lines */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box
          sx={{
            height: 6,
            width: '80%',
            borderRadius: 0.5,
            backgroundColor: isDark ? '#f5f5f5' : '#1a1a1a',
          }}
        />
        <Box
          sx={{
            height: 6,
            width: '60%',
            borderRadius: 0.5,
            backgroundColor: isDark ? '#999999' : '#666666',
          }}
        />
        <Box
          sx={{
            height: 6,
            width: '70%',
            borderRadius: 0.5,
            backgroundColor: isDark ? '#999999' : '#666666',
          }}
        />
      </Box>

      {/* Mock cards */}
      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
        <Box
          sx={{
            height: 16,
            flex: 1,
            borderRadius: 0.5,
            backgroundColor: isDark ? '#2d2d2d' : '#f5f5f5',
          }}
        />
        <Box
          sx={{
            height: 16,
            flex: 1,
            borderRadius: 0.5,
            backgroundColor: isDark ? '#2d2d2d' : '#f5f5f5',
          }}
        />
      </Box>

      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textAlign: 'center',
          mt: 1,
          color: isDark ? '#f5f5f5' : '#1a1a1a',
          fontWeight: 500,
        }}
      >
        {isDark ? 'Dark' : 'Light'}
      </Typography>
    </Paper>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Theme Settings Component
 *
 * Provides a UI for selecting theme mode (light/dark/system).
 *
 * @example
 * ```tsx
 * <ThemeSettings showPreview showSystemInfo />
 * ```
 */
export function ThemeSettings({
  showPreview = true,
  showSystemInfo = true,
  compact = false,
}: ThemeSettingsProps) {
  const { mode, setMode, resolvedTheme, isDark } = useTheme();
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  const systemPreferenceText = useMemo(() => {
    return prefersDark ? 'dark mode' : 'light mode';
  }, [prefersDark]);

  const handleModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: ThemeMode | null) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  return (
    <Box>
      {!compact && (
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsBrightnessIcon />
          Theme Settings
        </Typography>
      )}

      {!compact && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose your preferred color scheme for the dashboard.
        </Typography>
      )}

      {/* Theme Mode Selection */}
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
        aria-label="Theme mode"
        sx={{
          mb: 2,
          '& .MuiToggleButton-root': {
            px: compact ? 2 : 3,
            py: compact ? 1 : 1.5,
          },
        }}
      >
        <ToggleButton value="light" aria-label="Light theme">
          <Tooltip title="Light mode">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightModeIcon />
              {!compact && <Typography variant="body2">Light</Typography>}
            </Box>
          </Tooltip>
        </ToggleButton>

        <ToggleButton value="dark" aria-label="Dark theme">
          <Tooltip title="Dark mode">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DarkModeIcon />
              {!compact && <Typography variant="body2">Dark</Typography>}
            </Box>
          </Tooltip>
        </ToggleButton>

        <ToggleButton value="system" aria-label="System theme">
          <Tooltip title="Use system preference">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ComputerIcon />
              {!compact && <Typography variant="body2">System</Typography>}
            </Box>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      {/* System preference info */}
      {showSystemInfo && mode === 'system' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Your system is set to <strong>{systemPreferenceText}</strong>. The dashboard will
            automatically switch themes based on your operating system settings.
          </Typography>
        </Alert>
      )}

      {/* Theme Preview */}
      {showPreview && !compact && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Preview
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <ThemePreviewCard
              theme="light"
              isActive={resolvedTheme === 'light'}
            />
            <ThemePreviewCard
              theme="dark"
              isActive={resolvedTheme === 'dark'}
            />
          </Box>
        </Box>
      )}

      {/* Current theme indicator (compact mode) */}
      {compact && (
        <Typography variant="caption" color="text.secondary">
          Currently using {isDark ? 'dark' : 'light'} theme
          {mode === 'system' && ` (${systemPreferenceText})`}
        </Typography>
      )}
    </Box>
  );
}

// ============================================================================
// Theme Toggle Button Component
// ============================================================================

export interface ThemeToggleButtonProps {
  /** Show tooltip */
  showTooltip?: boolean;
}

/**
 * Theme Toggle Button Component
 *
 * Simple button to cycle through theme modes.
 * Useful for header/toolbar placement.
 *
 * @example
 * ```tsx
 * <ThemeToggleButton />
 * ```
 */
export function ThemeToggleButton({ showTooltip = true }: ThemeToggleButtonProps) {
  const { mode, toggleTheme, isDark } = useTheme();

  const tooltipText = useMemo(() => {
    if (mode === 'light') return 'Switch to dark mode';
    if (mode === 'dark') return 'Switch to system theme';
    return 'Switch to light mode';
  }, [mode]);

  const icon = useMemo(() => {
    if (mode === 'system') return <ComputerIcon />;
    if (isDark) return <DarkModeIcon />;
    return <LightModeIcon />;
  }, [mode, isDark]);

  const button = (
    <Box
      component="button"
      onClick={toggleTheme}
      aria-label={tooltipText}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 1,
        border: 'none',
        backgroundColor: 'transparent',
        color: 'text.primary',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      {icon}
    </Box>
  );

  if (showTooltip) {
    return <Tooltip title={tooltipText}>{button}</Tooltip>;
  }

  return button;
}

export default ThemeSettings;
