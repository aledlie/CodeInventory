# Phase 5 Implementation Guide

**Advanced Analytics & Dashboard Personalization**

**Status:** PLANNING
**Branch:** feature/dashboard-visualization
**Predecessor:** Phase 3 (Visual Storytelling & Reports) - COMPLETE
**Target:** Enterprise-Grade Analytics Platform

---

## Executive Summary

Phase 5 transforms the Code Inventory dashboard from a visualization tool into an intelligent analytics platform with predictive insights, personalized dashboards, and team collaboration features. Building on the foundation of Phases 1-3, this phase introduces advanced analytics capabilities that help teams make data-driven decisions about code quality improvements.

### Key Objectives

1. **Predictive Analytics** - Forecast code quality trends and identify risks before they become problems
2. **Dashboard Personalization** - Enable users to customize their view with widgets, saved layouts, and preferences
3. **Team Collaboration** - Support shared dashboards, role-based access, and collaborative insights
4. **Advanced Reporting** - Extend report generation with scheduling, templates, and automated delivery

---

## Prerequisites

### Completed Phase 3 Features

Phase 5 builds on these Phase 3 deliverables (verified complete as of 2025-12-09):

| Feature | Status | Location |
|---------|--------|----------|
| Trend Charts | Complete | `/dashboard/trends` |
| Dependency Graph | Complete | `/dashboard/graph` |
| Tools & Utilities | Complete | `/dashboard/tools` |
| Historical Comparison | Complete | `/dashboard/compare` |
| Report Generation | Complete | `/dashboard/reports` |

### Technology Stack

- React 18.3.1 + TypeScript 5.7.2 (strict mode)
- MUI v7 (6.1.10) with design tokens
- TanStack Query 5.62.11 + TanStack Router 1.93.0
- Chart.js 4.5.1 for visualizations
- Vite 6.0.5 with chunk splitting

### Required Dependencies (Phase 5)

```bash
# State management for personalization
npm install zustand@^4.5.0

# Drag-and-drop for widget arrangement
npm install @dnd-kit/core@^6.1.0 @dnd-kit/sortable@^8.0.0

# Date handling for scheduling
npm install date-fns@^3.3.0

# PDF generation (enhanced)
npm install @react-pdf/renderer@^3.3.0

# Statistical analysis
npm install simple-statistics@^7.8.3
```

---

## Architecture Overview

### Directory Structure

```
src/features/dashboard/
├── components/
│   ├── analytics/           # Phase 5: Advanced analytics
│   │   ├── RiskHeatmap.tsx
│   │   ├── DebtBurndownChart.tsx
│   │   ├── PredictiveTrendCard.tsx
│   │   ├── InsightCard.tsx
│   │   └── index.ts
│   ├── personalization/     # Phase 5: Dashboard customization
│   │   ├── WidgetLibrary.tsx
│   │   ├── SavedViewsDropdown.tsx
│   │   ├── NotificationPreferences.tsx
│   │   ├── DashboardEditor.tsx
│   │   └── index.ts
│   └── collaboration/       # Phase 5: Team features
│       ├── TeamDashboard.tsx
│       ├── SharedInsights.tsx
│       └── index.ts
├── api/
│   ├── analyticsApi.ts      # Phase 5: Analytics data fetching
│   ├── personalizationApi.ts # Phase 5: User preferences
│   └── collaborationApi.ts  # Phase 5: Team features
├── hooks/
│   ├── useAnalytics.ts      # Phase 5: Analytics hooks
│   ├── usePersonalization.ts # Phase 5: Personalization hooks
│   └── useCollaboration.ts  # Phase 5: Team hooks
├── types/
│   ├── analytics.ts         # Phase 5: Analytics types
│   ├── personalization.ts   # Phase 5: Personalization types
│   └── collaboration.ts     # Phase 5: Team types
└── stores/
    └── dashboardStore.ts    # Phase 5: Zustand store

src/routes/dashboard/
├── analytics/               # Phase 5: Analytics routes
│   └── index.tsx
├── settings/                # Phase 5: Personalization routes
│   ├── index.tsx
│   └── notifications.tsx
└── team/                    # Phase 5: Team routes
    └── index.tsx
```

---

## Feature Specifications

### Feature 5.1: Predictive Analytics

#### 5.1.1 Risk Score Heatmap

Visualize risk concentration across the codebase using a bar chart with color gradients.

**Component:** `RiskHeatmap.tsx`

```typescript
interface RiskHeatmapProps {
  data: RiskData[];
  maxItems?: number;
  onItemClick?: (item: RiskData) => void;
}

interface RiskData {
  path: string;
  riskScore: number;      // 0-100
  factors: RiskFactor[];
  confidence: number;     // 0-100
}

interface RiskFactor {
  type: 'complexity' | 'coverage' | 'dependencies' | 'age' | 'churn';
  weight: number;
  value: number;
}
```

**Visual Design:**
- Bar height: 24px
- Bar width: Responsive (full width - label - percentage)
- Colors: Gradient green (0-33%) → orange (33-66%) → red (66-100%)
- Interactive: Hover shows tooltip with full path + confidence
- Grouping: Optional by directory

**Accessibility:**
- `role="img"` with descriptive `aria-label`
- Data table alternative (visually hidden)
- Keyboard navigation for interactive elements

#### 5.1.2 Technical Debt Burndown Chart

Time-series comparing actual debt reduction vs. target pace.

**Component:** `DebtBurndownChart.tsx`

```typescript
interface DebtBurndownProps {
  actualData: DataPoint[];
  targetData: DataPoint[];
  projectedData?: DataPoint[];
  timeRange: TimeRange;
  height?: number;
}

interface DataPoint {
  timestamp: string;
  value: number;
  label?: string;
}
```

**Visual Design:**
- Solid line: Actual debt (primary or error color)
- Dashed line: Target pace (success color)
- Filled area: Semi-transparent (20% opacity)
- Height: 300px desktop, 250px mobile
- Status below: "Current: XXX hrs | Target: YYY hrs | Pace: On track"

#### 5.1.3 Predictive Trend Cards

Show where metrics are heading with confidence indicators.

**Component:** `PredictiveTrendCard.tsx`

```typescript
interface PredictiveTrendCardProps {
  metric: MetricType;
  currentValue: number;
  projectedValue: number;
  confidence: number;      // 0-100
  timeframe: string;       // "90d", "6mo", etc.
  insight?: string;
  actions?: CardAction[];
}

interface CardAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
}
```

**Visual Design:**
```
┌─────────────────────────────────────┐
│ Quality Score Trend (Next 90d)      │
│ Current: 82.5% → Projected: 88.2%   │
│ Confidence: High (82%) ████░░       │
│                                     │
│ If current pace continues, quality  │
│ will reach your target of 90 by     │
│ June.                               │
│                                     │
│ [View Details] [Add to Goals]       │
└─────────────────────────────────────┘
```

- Container: Elevation 1, border-left 4px (metric color)
- Confidence bar: 120px width, color-coded (green 80+, orange 50-79, red <50)
- AI Insight: Italic body2, info.lightest background, 12px padding

#### 5.1.4 AI-Powered Insight Cards

Actionable recommendations based on analysis.

**Component:** `InsightCard.tsx`

```typescript
interface InsightCardProps {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedFiles?: string[];
  impact: string;
  effort: string;
  onView: () => void;
  onDismiss: () => void;
}
```

**Visual Design:**
```
┌─────────────────────────────────────┐
│ HIGH PRIORITY                       │
│ Improve Type Safety                 │
│                                     │
│ Files missing TypeScript strict:    │
│ src/utils/validation.ts, ...        │
│                                     │
│ Est. Impact: +5-10% quality         │
│ Effort: ~4 hours                    │
│                                     │
│ [View Files] [Dismiss]              │
└─────────────────────────────────────┘
```

- Border-left 4px: HIGH=error.main, MEDIUM=warning.main, LOW=info.main
- Priority chip: Small variant
- Description: 2-3 lines max (truncate)
- Actions: Small text buttons

---

### Feature 5.2: Dashboard Personalization

#### 5.2.1 Widget Library

Enable users to customize their dashboard layout.

**Component:** `WidgetLibrary.tsx`

```typescript
interface WidgetLibraryProps {
  availableWidgets: WidgetDefinition[];
  enabledWidgets: string[];
  onToggle: (widgetId: string, enabled: boolean) => void;
  onReorder?: (widgets: string[]) => void;
}

interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: 'metrics' | 'charts' | 'insights' | 'tools';
  defaultSize: 'small' | 'medium' | 'large';
  icon: ReactNode;
}
```

**Visual Design:**
- Location: Right sidebar (320px) on desktop, modal on mobile
- Toggle checkboxes for each widget
- Instant visibility changes (no submit button)
- Grid layout: 2 columns desktop, 1 mobile
- Grid gap: 16px

**Available Widgets:**
| Widget | Category | Default Size |
|--------|----------|--------------|
| Quality Score | metrics | small |
| Coverage Gauge | metrics | small |
| Issue Count | metrics | small |
| Risk Heatmap | charts | large |
| Trend Chart | charts | medium |
| Insights | insights | medium |
| Recent Changes | tools | medium |

#### 5.2.2 Saved Views Management

Allow users to save and switch between dashboard configurations.

**Component:** `SavedViewsDropdown.tsx`

```typescript
interface SavedViewsDropdownProps {
  views: SavedView[];
  currentViewId: string;
  onViewChange: (viewId: string) => void;
  onCreateView: (config: ViewConfig) => void;
  onDeleteView: (viewId: string) => void;
  onShareView: (viewId: string) => void;
}

interface SavedView {
  id: string;
  name: string;
  description?: string;
  widgets: string[];
  layout: WidgetLayout[];
  isDefault: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Visual Design:**
```
┌─────────────────────────────┐
│ My Dashboard ▼              │
├─────────────────────────────┤
│ ● Default Dashboard         │
│   Executive Overview        │
│   Team Weekly Report        │
├─────────────────────────────┤
│ + Create New View           │
└─────────────────────────────┘
```

- Click to switch: Instant load (or brief skeleton)
- Create modal: Name + Description + Base on existing
- Delete: Confirmation required
- Share: One-click copy link

#### 5.2.3 Notification Preferences

Configure alerts for metric changes.

**Component:** `NotificationPreferences.tsx`

```typescript
interface NotificationPreferencesProps {
  preferences: NotificationConfig[];
  onSave: (preferences: NotificationConfig[]) => void;
}

interface NotificationConfig {
  id: string;
  metric: MetricType;
  enabled: boolean;
  condition: {
    type: 'threshold' | 'change' | 'trend';
    operator: 'gt' | 'lt' | 'eq' | 'change_by';
    value: number;
    timeframe?: string;
  };
  delivery: ('email' | 'slack' | 'in-app')[];
}
```

**Visual Design:**
```
┌─────────────────────────────────────┐
│ Quality Score Alert                 │
│ [Toggle ON]                         │
│ Notify if score drops by            │
│ [5% ▼] in [One week ▼]             │
│                                     │
│ Critical Issues Alert               │
│ [Toggle ON]                         │
│ Notify if count exceeds             │
│ [10 ▼] [Immediate ▼]               │
└─────────────────────────────────────┘
```

- Container: Max 600px width (centered)
- Each alert: Toggle + title + description + options
- Options appear only when toggle is ON
- Save button: Primary, contained

---

### Feature 5.3: Team Collaboration

#### 5.3.1 Team Dashboard

Shared view for team members with role-based access.

**Component:** `TeamDashboard.tsx`

```typescript
interface TeamDashboardProps {
  teamId: string;
  members: TeamMember[];
  dashboards: SharedDashboard[];
  permissions: TeamPermissions;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  avatar?: string;
}

interface TeamPermissions {
  canEdit: boolean;
  canShare: boolean;
  canInvite: boolean;
  canDelete: boolean;
}
```

#### 5.3.2 Shared Insights

Collaborative insight sharing and discussion.

**Component:** `SharedInsights.tsx`

```typescript
interface SharedInsightsProps {
  insights: SharedInsight[];
  onComment: (insightId: string, comment: string) => void;
  onReact: (insightId: string, reaction: ReactionType) => void;
  onShare: (insightId: string, teamId: string) => void;
}

interface SharedInsight {
  id: string;
  insight: InsightCardProps;
  author: TeamMember;
  comments: Comment[];
  reactions: Reaction[];
  sharedAt: string;
}
```

---

## Quality Control Standards

### Code Quality Requirements

| Metric | Minimum | Target |
|--------|---------|--------|
| Overall Type Coverage | 95% | 100% |
| Public API Types | 100% | 100% |
| Component Props | 100% | 100% |
| Hook Return Types | 100% | 100% |
| API Response Types | 100% | 100% |

**Prohibited Patterns:**
- `any` type - use `unknown` with type guards
- `@ts-ignore` - fix underlying issues
- `as` casting without validation - use type guards
- Non-null assertion `!` - use optional chaining or guards

### Test Coverage Requirements

| Coverage Type | Minimum | Target |
|---------------|---------|--------|
| Line coverage | 80% | 90% |
| Branch coverage | 75% | 85% |
| Function coverage | 85% | 95% |
| Critical path coverage | 95% | 100% |

**Required Tests:**
- Unit tests for all analytics calculations
- Integration tests for widget interactions
- E2E tests for personalization flows
- Accessibility tests (jest-axe)

### Performance Budgets

**Core Web Vitals:**

| Metric | Target | Maximum |
|--------|--------|---------|
| LCP (Largest Contentful Paint) | < 2.0s | 2.5s |
| FID (First Input Delay) | < 50ms | 100ms |
| CLS (Cumulative Layout Shift) | < 0.05 | 0.1 |
| INP (Interaction to Next Paint) | < 100ms | 200ms |

**Bundle Size Budgets:**

| Chunk | Max Size (gzipped) |
|-------|-------------------|
| Initial bundle | 150KB |
| react-vendor | 50KB |
| mui-vendor | 100KB |
| tanstack-vendor | 30KB |
| Route chunk (each) | 50KB |
| Total app | 500KB |

### Accessibility Standards

**WCAG 2.1 AA Compliance:**

| Element Type | Minimum Contrast Ratio |
|--------------|------------------------|
| Normal text | 4.5:1 |
| Large text (18px+) | 3:1 |
| UI components | 3:1 |
| Focus indicators | 3:1 |
| Data visualizations | 3:1 |

**Required Implementations:**
- All charts have ARIA labels and data table alternatives
- Keyboard navigation for all interactive elements
- Focus trap for modals and dialogs
- Live regions for dynamic content updates
- Color + pattern (not color alone) for data visualization

### Security Standards

**Input Validation:**
- All user inputs validated with Zod schemas
- Maximum field lengths enforced
- Content sanitization via DOMPurify for HTML export

**API Security:**

| Endpoint | Authentication | Authorization |
|----------|----------------|---------------|
| GET /api/dashboards | JWT required | View permission |
| POST /api/dashboards | JWT required | Team member |
| PUT /api/dashboards/:id | JWT required | Edit permission |
| DELETE /api/dashboards/:id | JWT required | Owner only |
| POST /api/dashboards/:id/share | JWT required | Share permission |

---

## UI/UX Design Specifications

### Visual Hierarchy

**Design Principle: Progressive Disclosure**
- Don't show all options at once
- Use expandable sections
- Conditional fields (show only when relevant)
- Modal dialogs for complex operations

**Status-Based Styling:**
- Green + checkmark icon: Improvements
- Orange + warning icon: Concerns
- Red + error icon: Critical issues
- Never rely on color alone (add icons)

### Responsive Strategy

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| xs | 0px | Single column, full-width components |
| sm | 576px | Single column with padding |
| md | 768px | Two-column grids |
| lg | 992px | Three-column grids, sidebar visible |
| xl | 1200px | Four-column grids, full features |
| 2xl | 1400px+ | Maximum width container |

**Mobile Adaptations:**
- Single column stack
- Preset tabs → dropdown
- Collapse sections (show 1st by default)
- Full-screen modals (no sidebars)
- Larger tap targets (48px min)

### Loading States

Use MUI `<Skeleton>` components:
- Same number of skeleton cards as expected content
- Duration: 300-800ms fade in
- No progress bars (too noisy)

### Empty States

**Formula:** Icon + Heading + Message + Optional Action

```
Icon (64px, 50% opacity)
"No historical data available"
"Run the analysis pipeline to generate snapshots"
[Learn How] button (optional)
```

- Center vertically/horizontally
- Min height: 200px
- Heading: h5, weight 600
- Message: body1, secondary color

### Animation Patterns

**Transitions:**
- Fast: 150ms (hover, focus)
- Normal: 200ms (state changes)
- Slow: 300ms (page transitions)

**Interactions:**
- Hover lift: translateY(-2px) on clickable cards
- Focus: 2px outline, primary color
- Active: Scale down slightly (0.98)

---

## Implementation Roadmap

### Phase 5A: Predictive Analytics (Weeks 1-3)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Risk scoring algorithm | `analyticsApi.ts`, `useAnalytics.ts` |
| 3-4 | Risk heatmap component | `RiskHeatmap.tsx` |
| 5-6 | Debt burndown chart | `DebtBurndownChart.tsx` |
| 7-8 | Predictive trend cards | `PredictiveTrendCard.tsx` |
| 9-10 | Insight cards | `InsightCard.tsx` |
| 11-12 | Analytics page route | `/dashboard/analytics/index.tsx` |
| 13-14 | Testing & refinement | Unit tests, integration tests |
| 15 | Documentation | API docs, user guide |

### Phase 5B: Dashboard Personalization (Weeks 4-5)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Zustand store setup | `dashboardStore.ts` |
| 3-4 | Widget library | `WidgetLibrary.tsx` |
| 5-6 | Saved views | `SavedViewsDropdown.tsx` |
| 7-8 | Notification preferences | `NotificationPreferences.tsx` |
| 9-10 | Settings page route | `/dashboard/settings/index.tsx` |

### Phase 5C: Team Collaboration (Weeks 6-7)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Team API | `collaborationApi.ts` |
| 3-4 | Team dashboard | `TeamDashboard.tsx` |
| 5-6 | Shared insights | `SharedInsights.tsx` |
| 7-8 | Team page route | `/dashboard/team/index.tsx` |
| 9-10 | Testing & QA | E2E tests, accessibility audit |

---

## Deployment Strategy

### Feature Flag Configuration

```typescript
const featureFlags = {
  'phase5-predictive-analytics': { rolloutPercentage: 0 },
  'phase5-personalization': { rolloutPercentage: 0 },
  'phase5-team-collaboration': { rolloutPercentage: 0 },
};
```

### Rollout Schedule

| Phase | Feature | Rollout % | Duration |
|-------|---------|-----------|----------|
| Week 1-3 | Predictive Analytics | 10% → 50% → 100% | 21 days |
| Week 4-5 | Personalization | 10% → 50% → 100% | 14 days |
| Week 6-7 | Team Collaboration | Beta → 50% → 100% | 14 days |

### Rollback Triggers

**Immediate Rollback:**
- Error rate > 5% increase
- P0 bug affecting data integrity
- Security vulnerability discovered

**Within 1 Hour:**
- Error rate > 2% increase
- P1 bug affecting core functionality
- Performance degradation > 50%

---

## Pre-Release Quality Checklist

### Code Quality Gate
- [ ] TypeScript strict mode passes with zero errors
- [ ] No `any` types in new code
- [ ] All public APIs have TypeScript documentation
- [ ] No console.log in production code
- [ ] Code review approved by 2+ reviewers
- [ ] No circular dependencies introduced

### Security Gate
- [ ] All user inputs validated with Zod schemas
- [ ] XSS protection verified for user-generated content
- [ ] CSV formula injection prevention tested
- [ ] No secrets in codebase (Doppler verified)
- [ ] API endpoints require authentication

### Accessibility Gate
- [ ] WCAG 2.1 AA automated testing passes (jest-axe)
- [ ] Manual keyboard navigation tested
- [ ] Screen reader testing completed
- [ ] Color contrast verified for all new UI
- [ ] Focus management tested for modals/dialogs
- [ ] Data tables provide accessible alternative to charts

### Performance Gate
- [ ] Lighthouse score >= 90 for all metrics
- [ ] Bundle size within budget (<500KB total)
- [ ] LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Lazy loading verified for route components
- [ ] Virtual scrolling for large lists

### Testing Gate
- [ ] Unit test coverage >= 80%
- [ ] Integration tests for all user flows
- [ ] E2E tests for critical paths
- [ ] Accessibility tests pass
- [ ] Performance regression tests pass

### Deployment Gate
- [ ] Feature flags configured
- [ ] Monitoring dashboards updated
- [ ] Rollback procedure documented
- [ ] Staging deployment validated

---

## Future Enhancements (Phase 6+)

Potential future improvements beyond Phase 5:

1. **Machine Learning Integration** - More sophisticated predictive models
2. **Real-Time Collaboration** - Live cursors, simultaneous editing
3. **Advanced Export** - Branded PDF templates, automated email delivery
4. **Integrations** - Slack, GitHub, Jira, Linear connectors
5. **Custom Metrics** - User-defined quality metrics and thresholds
6. **Audit Trail** - Complete history of dashboard changes
7. **API Access** - RESTful API for external integrations
8. **Mobile App** - Native mobile experience

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/Users/alyshialedlie/code/Inventory/tsconfig.json` | TypeScript configuration with strict mode |
| `/Users/alyshialedlie/code/Inventory/package.json` | Dependencies and scripts |
| `/Users/alyshialedlie/code/Inventory/vite.config.ts` | Build configuration with chunk splitting |
| `/Users/alyshialedlie/code/Inventory/src/styles/design-tokens.css` | WCAG AA compliant design tokens |
| `/Users/alyshialedlie/code/Inventory/src/theme/dashboardTheme.ts` | MUI v7 theme with accessibility focus |
| `/Users/alyshialedlie/code/Inventory/src/features/dashboard/types/index.ts` | Core type definitions |
| `/Users/alyshialedlie/code/Inventory/src/features/dashboard/types/comparison.ts` | Historical comparison types |
| `/Users/alyshialedlie/code/Inventory/src/features/dashboard/types/reports.ts` | Report generation types |

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `DASHBOARD_QUICKSTART.md` | Quick start guide for running the dashboard |
| `TOOLS_IMPLEMENTATION_SUMMARY.md` | Tools feature implementation details |
| `PHASE3_IMPLEMENTATION_GUIDE.md` | Phase 3 implementation details |
| `docs/guides/DASHBOARD_UI_UX_DESIGN.md` | Complete UI/UX design specs |
| `docs/guides/DASHBOARD_COMPONENT_EXAMPLES.md` | Production-ready code examples |

---

**Document Version:** 1.0
**Created:** 2025-12-09
**Last Updated:** 2025-12-09
**Authors:** Claude Code (CEO Quality Controller, UI/UX Design Expert, Visual Storyteller agents)
**Status:** READY FOR IMPLEMENTATION
