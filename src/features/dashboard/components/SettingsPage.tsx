/**
 * SettingsPage Component
 *
 * Phase 5B: Dashboard Personalization
 * Main settings page for dashboard customization
 */

import { useState, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link as MuiLink,
  Skeleton,
  Alert,
  Button,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import WidgetsIcon from '@mui/icons-material/Widgets';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import {
  WidgetLibrary,
  SavedViewsDropdown,
  NotificationPreferences,
  DashboardEditor,
} from './personalization';
import { useSavedViewsManager, usePreferencesManager, useWidgetLibrary } from '../hooks/usePersonalization';
import type { WidgetCategory, EditorMode, DashboardLayout, WidgetId } from '../types';
import { WIDGET_METADATA } from '../api/personalizationApi';

// ============================================================================
// Tab Panel Component
// ============================================================================

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      sx={{ py: 3 }}
    >
      {value === index && children}
    </Box>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

// ============================================================================
// Error Fallback Component
// ============================================================================

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={resetErrorBoundary}>
            Retry
          </Button>
        }
      >
        <Typography variant="subtitle2" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body2">{error.message}</Typography>
      </Alert>
    </Box>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function SettingsSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" height={48} sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" height={400} />
    </Box>
  );
}

// ============================================================================
// Widget Library Tab Content
// ============================================================================

function WidgetLibraryContent() {
  const { widgets } = useWidgetLibrary();
  const { activeView, updateView, activeViewId } = useSavedViewsManager();
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');

  const activeWidgets = activeView?.layout.widgets || [];

  const handleToggleWidget = (widgetId: WidgetId, visible: boolean) => {
    if (!activeView || !activeViewId) return;

    const updatedWidgets = visible
      ? [
          ...activeWidgets,
          {
            instanceId: `${widgetId}-${Date.now()}`,
            widgetId,
            visible: true,
            size: WIDGET_METADATA.find((w) => w.id === widgetId)?.defaultSize || 'medium',
            position: {
              row: Math.floor(activeWidgets.length / 2),
              column: activeWidgets.length % 2,
            },
            settings: {},
          },
        ]
      : activeWidgets.filter((w) => w.widgetId !== widgetId);

    updateView({
      viewId: activeViewId,
      updates: {
        layout: {
          ...activeView.layout,
          widgets: updatedWidgets,
        },
      },
    });
  };

  const handleAddWidget = (widgetId: WidgetId) => {
    handleToggleWidget(widgetId, true);
  };

  const handleRemoveWidget = (instanceId: string) => {
    if (!activeView || !activeViewId) return;

    const updatedWidgets = activeWidgets.filter((w) => w.instanceId !== instanceId);

    updateView({
      viewId: activeViewId,
      updates: {
        layout: {
          ...activeView.layout,
          widgets: updatedWidgets,
        },
      },
    });
  };

  return (
    <WidgetLibrary
      widgets={widgets}
      activeWidgets={activeWidgets}
      onToggleWidget={handleToggleWidget}
      onAddWidget={handleAddWidget}
      onRemoveWidget={handleRemoveWidget}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
    />
  );
}

// ============================================================================
// Saved Views Tab Content
// ============================================================================

function SavedViewsContent() {
  const {
    views,
    activeViewId,
    activeView,
    selectView,
    createView,
    deleteView,
    updateView,
    setDefault,
  } = useSavedViewsManager();
  const [editorMode, setEditorMode] = useState<EditorMode>('view');
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null);

  // Initialize current layout from active view
  const layout = currentLayout || activeView?.layout;

  const handleLayoutChange = (newLayout: DashboardLayout) => {
    setCurrentLayout(newLayout);
  };

  const handleSave = () => {
    if (activeViewId && currentLayout) {
      updateView({
        viewId: activeViewId,
        updates: { layout: currentLayout },
      });
      setEditorMode('view');
      setCurrentLayout(null);
    }
  };

  const handleCancel = () => {
    setEditorMode('view');
    setCurrentLayout(null);
  };

  const handleModeChange = (mode: EditorMode) => {
    if (mode === 'edit' && activeView) {
      setCurrentLayout({ ...activeView.layout });
    }
    setEditorMode(mode);
  };

  const handleCreateView = (name: string, description?: string) => {
    if (layout) {
      createView({
        name,
        description,
        layout,
        isDefault: false,
        isShared: false,
        createdBy: 'current-user',
      });
    }
  };

  const handleDeleteView = (viewId: string) => {
    deleteView(viewId);
  };

  const handleRenameView = (viewId: string, newName: string) => {
    updateView({ viewId, updates: { name: newName } });
  };

  const handleSetDefault = (viewId: string) => {
    setDefault(viewId);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Current View:
        </Typography>
        <SavedViewsDropdown
          views={views}
          activeViewId={activeViewId}
          onSelectView={selectView}
          onCreateView={handleCreateView}
          onDeleteView={handleDeleteView}
          onRenameView={handleRenameView}
          onSetDefault={handleSetDefault}
        />
      </Box>

      {layout && (
        <DashboardEditor
          layout={layout}
          availableWidgets={WIDGET_METADATA}
          onLayoutChange={handleLayoutChange}
          onSave={handleSave}
          onCancel={handleCancel}
          mode={editorMode}
          onModeChange={handleModeChange}
        />
      )}
    </Box>
  );
}

// ============================================================================
// Notification Preferences Tab Content
// ============================================================================

function NotificationPreferencesContent() {
  const { notificationSettings, updateNotifications } = usePreferencesManager();

  return (
    <NotificationPreferences
      settings={notificationSettings}
      onUpdateSettings={updateNotifications}
      availableWidgets={WIDGET_METADATA}
    />
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.secondary',
            textDecoration: 'none',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <HomeIcon fontSize="small" />
          Home
        </MuiLink>
        <MuiLink
          component={Link}
          to="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.secondary',
            textDecoration: 'none',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <DashboardIcon fontSize="small" />
          Dashboard
        </MuiLink>
        <Typography
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.primary',
          }}
        >
          <SettingsIcon fontSize="small" />
          Settings
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Customize your dashboard layout, manage saved views, and configure
          notification preferences.
        </Typography>
      </Box>

      {/* Settings Tabs */}
      <Paper sx={{ bgcolor: 'background.paper' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              minHeight: 56,
            },
          }}
        >
          <Tab
            icon={<WidgetsIcon />}
            iconPosition="start"
            label="Widget Library"
            {...a11yProps(0)}
          />
          <Tab
            icon={<ViewModuleIcon />}
            iconPosition="start"
            label="Saved Views"
            {...a11yProps(1)}
          />
          <Tab
            icon={<NotificationsIcon />}
            iconPosition="start"
            label="Notifications"
            {...a11yProps(2)}
          />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<SettingsSkeleton />}>
              <TabPanel value={activeTab} index={0}>
                <WidgetLibraryContent />
              </TabPanel>
              <TabPanel value={activeTab} index={1}>
                <SavedViewsContent />
              </TabPanel>
              <TabPanel value={activeTab} index={2}>
                <NotificationPreferencesContent />
              </TabPanel>
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Paper>
    </Container>
  );
}

export default SettingsPage;
