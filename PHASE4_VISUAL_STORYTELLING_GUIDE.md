# Phase 4: Visual Storytelling & Advanced Analytics - Design Guide

**Status:** PLANNING
**Branch:** feature/dashboard-visualization
**Prerequisites:** Phase 1-3 Complete
**Estimated Duration:** 4-6 weeks

---

## Executive Summary

Phase 4 transforms the Code Inventory Dashboard from a comprehensive analysis tool into an intelligent, narrative-driven platform that tells the story of your code's journey. Building on the foundation of Phases 1-3 (detailed pages, trend charts, dependency graphs, and comparison tools), Phase 4 adds:

1. **AI-Powered Insights Engine** - Natural language summaries and recommendations
2. **Interactive Story Dashboards** - Guided narratives through complex data
3. **Predictive Analytics** - Forecast quality trends and identify risks early
4. **Custom Visualizations** - User-defined charts and metric combinations
5. **Team Collaboration Features** - Annotations, comments, and shared insights

---

## Visual Narrative Structure

### The Code Health Journey (User Flow)

```
┌─────────────────────────────────────────────────────────────┐
│                     ENTRY POINT                              │
│         "How is my codebase doing?"                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  CHAPTER 1: The Current State (Existing Dashboard)          │
│  - Overview metrics in cards                                 │
│  - Health summary indicator                                  │
│  - Quick wins: "3 critical issues need attention"           │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  CHAPTER 2: The Story So Far (Phase 3 Trends)               │
│  - Quality score trending up 15% over 30 days               │
│  - Coverage improved in 23 files                             │
│  - 2 circular dependencies resolved                          │
│  📊 Visual: Line charts with annotated key events            │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  CHAPTER 3: The Deep Dive (Phase 2 Detail Pages)            │
│  - Click into specific concern areas                         │
│  - Filter by severity, file, category                        │
│  - See code snippets and suggestions                         │
│  📊 Visual: Expandable tables, syntax highlighting           │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  ⭐ CHAPTER 4: The Intelligence Layer (PHASE 4 NEW!) ⭐      │
│  - AI explains: "Your quality improved because..."           │
│  - Predictive: "At current rate, 90% quality by March"      │
│  - Recommendations: "Focus on these 5 files first"          │
│  - Risk alerts: "Dependency X may cause issues"             │
│  📊 Visual: Insight cards, prediction curves, risk matrix    │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  CHAPTER 5: The Action Plan (Phase 4 Collaboration)         │
│  - Assign issues to team members                             │
│  - Comment on specific files/issues                          │
│  - Track sprint goals and progress                           │
│  - Export custom reports for stakeholders                    │
│  📊 Visual: Kanban boards, comment threads, goal trackers    │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 4 Features: Detailed Visual Designs

### Feature 1: AI-Powered Insights Engine

**Visual Narrative:** "Your personal code quality analyst"

#### Component Hierarchy

```
InsightsPage
├── InsightsSummaryCard (hero section)
│   ├── AI-generated headline ("Code health is improving steadily")
│   ├── Confidence score (85%)
│   ├── Key metrics carousel
│   └── Quick actions CTA
├── InsightsCategoryTabs
│   ├── "Improvements" tab (green accent)
│   ├── "Concerns" tab (red accent)
│   ├── "Recommendations" tab (blue accent)
│   └── "Predictions" tab (purple accent)
└── InsightDetailList
    └── InsightCard (for each insight)
        ├── Icon + severity badge
        ├── Natural language title
        ├── Explanation paragraph
        ├── Supporting metrics chart (mini sparkline)
        ├── Related code files (clickable links)
        └── Action buttons ("View Details", "Mark as Resolved")
```

#### Visual Design Patterns

**1. Insight Summary Card (Hero)**
```
╔══════════════════════════════════════════════════════════════╗
║  🤖 AI Insights                         Confidence: ⭐⭐⭐⭐⭐ ║
║                                                              ║
║  "Your codebase quality has improved by 18% over the        ║
║   past 30 days, driven primarily by increased test          ║
║   coverage and resolution of 12 high-severity issues."      ║
║                                                              ║
║  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          ║
║  │ Quality     │ │ Coverage    │ │ Issues      │          ║
║  │ 87 → 92    │ │ 72% → 78%  │ │ 45 → 33    │          ║
║  │ ▲ +5 pts   │ │ ▲ +6 pts   │ │ ▼ -12      │          ║
║  └─────────────┘ └─────────────┘ └─────────────┘          ║
║                                                              ║
║  [View Full Analysis] [Share Report] [Export PDF]           ║
╚══════════════════════════════════════════════════════════════╝
```

**Color Scheme:**
- Background: gradient from `--color-primary-lightest` to white
- Border: 2px solid `--color-primary-light`
- Confidence stars: `--color-warning` (gold)
- Metric cards: white with `--shadow-card`

**Interactions:**
- Hover over confidence score → tooltip explains calculation
- Click metric cards → jump to detail page
- Animate numbers count-up on page load

**2. Insight Card (Individual)**
```
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Improvement · High Priority                              │
│                                                              │
│ Test Coverage Increased in Critical Files                   │
│                                                              │
│ You've added 23 new test cases covering authentication      │
│ and payment processing modules. This reduces risk of        │
│ production bugs by an estimated 35%.                         │
│                                                              │
│ 📊 Coverage Trend (30d): [■■■■■■■■■░] 78% (+6%)            │
│                                                              │
│ 📁 Affected Files:                                          │
│    • src/auth/login.ts (87% → 94%)                         │
│    • src/payments/checkout.ts (72% → 89%)                  │
│    • src/api/userService.ts (65% → 78%)                    │
│                                                              │
│ [View Full Coverage Report] [Mark as Acknowledged]          │
└──────────────────────────────────────────────────────────────┘
```

**Color Logic:**
- **Improvement** (green): `--color-success-lightest` background, `--color-success` border
- **Concern** (red): `--color-error-lightest` background, `--color-error` border
- **Recommendation** (blue): `--color-info-lightest` background, `--color-info` border
- **Prediction** (purple): custom `#f3e5f5` background, `#9c27b0` border

---

### Feature 2: Predictive Analytics Dashboard

**Visual Narrative:** "See the future of your code health"

#### Component Hierarchy

```
PredictiveDashboard
├── PredictionTimelineChart
│   ├── Historical data (solid line, past 90 days)
│   ├── Predicted trend (dashed line, next 90 days)
│   ├── Confidence bands (shaded area)
│   └── Key milestone markers
├── PredictionMetricsGrid
│   ├── QualityScorePrediction
│   ├── CoveragePrediction
│   ├── IssueCountPrediction
│   └── DebtPrediction
├── RiskMatrix
│   └── RiskBubble (each risk plotted by impact × probability)
└── ScenarioComparator
    ├── "Current Pace" scenario
    ├── "Accelerated" scenario
    └── "Relaxed" scenario
```

#### Visual Design: Prediction Timeline Chart

```
Quality Score Prediction

100 ┤                                    ╱ ╱ ╱  Predicted
    │                                ╱ ╱ ╱      (90% confidence)
 90 ┤                            ╱ ╱ ╱
    │                        ╱ ╱ ╱ ╱
 80 ┤                    ╱ ╱ ╱ ╱
    │                ╱ ╱ ╱ ╱ ╱          ▓▓▓▓ Confidence band
 70 ┤            ╱ ╱ ╱ ╱ ╱
    │        ╱ ╱ ╱ ╱ ╱                  ──── Historical
 60 ┤────────────────────┐
    │ Past 90d │ Today   │ Next 90d
    └──────────┴─────────┴─────────────────────
     Dec        Jan      Feb    Mar    Apr

    🎯 Goal (90): Achievable by March 15 at current pace
    ⚠️  Risk: Coverage slowdown may delay goal by 2 weeks
```

**Chart Configuration:**
- Historical line: `--color-primary`, 2px solid
- Predicted line: `--color-primary`, 2px dashed
- Confidence band: `--color-primary-lightest`, 40% opacity
- Goal marker: `--color-success`, horizontal dashed line
- Risk marker: `--color-warning`, vertical dashed line with annotation

**Interactions:**
- Hover over prediction line → show confidence interval tooltip
- Click goal marker → edit goal settings modal
- Drag timeline scrubber → see predictions at different dates

#### Visual Design: Risk Matrix

```
Risk Assessment Matrix

High Impact  ┤  ⚠️ High Risk    │  🔴 Critical Risk
             │                  │
             │     ●            │       ●
             │   Dep X          │   Security Gap
             ├──────────────────┼──────────────────
Medium       │  📋 Monitor      │  ⚠️ High Risk
Impact       │                  │
             │       ●          │     ●
             │   Test Debt      │  Tech Debt
             ├──────────────────┼──────────────────
Low Impact   │  ✅ Low Risk     │  📋 Monitor
             │                  │
             │   ●              │       ●
             │ Minor Issues     │  Old Deps
             └──────────────────┴──────────────────
               Low Probability     High Probability

● Click any bubble for details
```

**Bubble Styling:**
- Size: proportional to estimated impact (hours)
- Color: by risk level (green → yellow → orange → red)
- Opacity: by confidence (50% = low confidence, 100% = high)
- Label: risk name, positioned above bubble

**Accessibility:**
- Screen reader: "Critical risk: Security Gap. High impact, high probability. 85% confidence."
- Keyboard: Tab through bubbles, Enter to open detail modal

---

### Feature 3: Custom Visualization Builder

**Visual Narrative:** "Create your own story with your data"

#### Component Hierarchy

```
VisualizationBuilder
├── BuilderSidebar
│   ├── MetricSelector (drag source)
│   ├── ChartTypeSelector (grid of icons)
│   ├── FilterPanel (date, severity, file)
│   └── StylePanel (colors, axes, labels)
├── BuilderCanvas (drop zone)
│   ├── ChartPreview (live-updating)
│   ├── ResizeHandles
│   └── ConfigOverlay
└── BuilderToolbar
    ├── SaveButton
    ├── ExportButton (PNG, SVG, data)
    ├── ShareButton (generate shareable link)
    └── UndoRedo
```

#### Visual Design: Builder Interface

```
┌─────────────────────────────────────────────────────────────┐
│ 🎨 Custom Visualization Builder                              │
├─────────────┬───────────────────────────────────────────────┤
│ Metrics     │                                               │
│             │  Drop metrics here to create chart            │
│ Quality ●   │                                               │
│ Coverage ●  │  ┌─────────────────────────────────────┐     │
│ Issues ●    │  │                                     │     │
│ Deps ●      │  │     [Drag "Quality" here]          │     │
│             │  │                                     │     │
│ Chart Type  │  │                                     │     │
│ ├─ Line     │  │                                     │     │
│ ├─ Bar      │  │                                     │     │
│ ├─ Area     │  │                                     │     │
│ ├─ Scatter  │  │                                     │     │
│ └─ Radar    │  └─────────────────────────────────────┘     │
│             │                                               │
│ Filters     │  [Preview will appear here]                  │
│ Date: 30d ▼ │                                               │
│ Files: All ▼│                                               │
│             │                                               │
│ [Save] [⬇️]  │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

**Drag & Drop States:**
- **Default:** Dashed border, gray background
- **Drag over:** Solid blue border, `--color-primary-lightest` background
- **Dropped:** Chart renders immediately with animation
- **Invalid drop:** Red border pulse, shake animation

**Chart Templates (Quick Start):**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Quality     │ │ Coverage    │ │ Issues by   │
│ Trend       │ │ by File     │ │ Severity    │
│             │ │             │ │             │
│ [📈]        │ │ [📊]        │ │ [🥧]        │
│             │ │             │ │             │
│ Use Template│ │ Use Template│ │ Use Template│
└─────────────┘ └─────────────┘ └─────────────┘
```

---

### Feature 4: Team Collaboration Hub

**Visual Narrative:** "Work together on code quality"

#### Component Hierarchy

```
CollaborationHub
├── ActivityFeed
│   ├── ActivityItem (comment, assignment, resolution)
│   ├── FilterChips (All, Comments, Assignments, Mentions)
│   └── LoadMoreButton
├── IssueAssignments
│   ├── TeamMemberCard (with avatar, assigned count)
│   ├── UnassignedIssuesList
│   └── AssignmentDialog
├── CommentThread
│   ├── CommentItem
│   │   ├── Avatar + Author + Timestamp
│   │   ├── CommentText (Markdown support)
│   │   ├── Reactions (👍 ❤️ 🎉)
│   │   └── ReplyButton
│   └── CommentComposer
└── GoalTracker
    ├── SprintGoalCard
    ├── ProgressBar
    └── MilestoneTimeline
```

#### Visual Design: Activity Feed

```
┌──────────────────────────────────────────────────────────────┐
│ 🏃 Team Activity                                Filter: All ▼ │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 👤 @alice assigned issue "Unused imports" to @bob           │
│    📁 src/utils/helpers.ts · 2 hours ago                    │
│                                                              │
│ 💬 @bob commented on "Circular dependency detected"         │
│    "I'll refactor this module to break the cycle"           │
│    👍 2  ❤️ 1 · 3 hours ago                                 │
│                                                              │
│ ✅ @charlie resolved 5 issues in auth module                │
│    Quality score increased by 3 points · 5 hours ago        │
│                                                              │
│ 🎯 @alice set sprint goal: "Reach 85% test coverage"       │
│    Due: March 15 · 1 day ago                                │
│                                                              │
│ [Load More Activity]                                         │
└──────────────────────────────────────────────────────────────┘
```

**Activity Item Styling:**
- Avatar: 40px circle, border color matches activity type
- Assignment: `--color-info` accent
- Comment: `--color-neutral-500` accent
- Resolution: `--color-success` accent
- Goal: `--color-warning` accent

**Interactions:**
- Click activity → navigate to related item
- Hover avatar → show user tooltip (role, recent activity)
- Right-click → context menu (Copy link, Mute thread, Report)

#### Visual Design: Issue Assignment Board

```
┌──────────────────────────────────────────────────────────────┐
│ Team Members                                                 │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│ │   AB     │  │   CD     │  │   EF     │  │   ?      │     │
│ │  Alice   │  │   Bob    │  │ Charlie  │  │Unassigned│     │
│ │ 🎯 3     │  │ 🎯 7     │  │ 🎯 2     │  │ 🎯 12    │     │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└──────────────────────────────────────────────────────────────┘
                        ⬇ Drag issues here
┌──────────────────────────────────────────────────────────────┐
│ Unassigned Issues (12)                         Priority: All ▼│
├──────────────────────────────────────────────────────────────┤
│ 🔴 Critical: Memory leak in data processor                   │
│    src/processors/data.ts:145 · Created 2 days ago          │
│    [Assign to...▼]                                           │
│                                                              │
│ 🟠 High: Duplicate code in validation                        │
│    src/validators/input.ts:67 · Created 1 week ago          │
│    [Assign to...▼]                                           │
│                                                              │
│ 🟡 Medium: Missing error handling                            │
│    src/api/endpoints.ts:234 · Created 2 weeks ago           │
│    [Assign to...▼]                                           │
└──────────────────────────────────────────────────────────────┘
```

**Drag & Drop Assignment:**
- Drag issue card over team member → highlight member card
- Drop → issue assigned, card moves to member's section
- Visual feedback: smooth animation, confetti burst on successful assignment

---

### Feature 5: Smart Notifications & Alerts

**Visual Narrative:** "Stay informed, never overwhelmed"

#### Component Hierarchy

```
NotificationCenter
├── NotificationBell (header icon with badge)
├── NotificationDropdown
│   ├── NotificationTabs (All, Mentions, Alerts, Updates)
│   ├── NotificationList
│   │   └── NotificationItem
│   │       ├── Icon + color indicator
│   │       ├── Message preview
│   │       ├── Timestamp
│   │       └── Actions (Mark read, Snooze, View)
│   └── NotificationSettings (gear icon)
└── NotificationPreferences
    ├── ChannelToggles (Email, In-app, Slack)
    ├── FrequencySelector (Real-time, Daily digest, Weekly)
    └── FilterRules (Only critical, Mentions only, etc.)
```

#### Visual Design: Notification Bell & Dropdown

```
Header Bar
┌──────────────────────────────────────────────────────────────┐
│ Code Inventory Dashboard            👤 Alice    🔔 (3)       │
└──────────────────────────────────────────────────────────────┘
                                                  ⬇ Click
┌──────────────────────────────────────────────────────────────┐
│ 🔔 Notifications (3 unread)                        ⚙️ Settings│
├──────────────────────────────────────────────────────────────┤
│ All | @Mentions | 🚨 Alerts | 📰 Updates                     │
├──────────────────────────────────────────────────────────────┤
│ ● 🚨 New critical issue detected                             │
│     "SQL injection vulnerability in auth"                    │
│     2 minutes ago · [View Issue]                             │
│                                                              │
│ ● 💬 @bob mentioned you in a comment                        │
│     "Can you review this refactoring?"                       │
│     1 hour ago · [View Comment]                              │
│                                                              │
│ ○ ✅ Sprint goal achieved: 85% coverage                      │
│     "Great work team!"                                       │
│     3 hours ago · [View Report]                              │
├──────────────────────────────────────────────────────────────┤
│ [Mark All as Read]                        [View All (24)]    │
└──────────────────────────────────────────────────────────────┘
```

**Notification Types & Styling:**
- **Critical Alert** (🚨): Red dot, `--color-error` background glow
- **Mention** (💬): Blue dot, `--color-info` background
- **Achievement** (✅): Green dot, `--color-success` background
- **Update** (📰): Gray dot, `--color-neutral-300` background

**Badge Behavior:**
- Count: unread notifications (max 99+)
- Pulse animation: new critical alert
- Color: red for critical, blue for normal

---

## Data Flow Architecture

### Phase 4 Data Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ Python Analysis Pipeline (Existing)                         │
│ - code_quality.py                                            │
│ - test_coverage.py                                           │
│ - dependencies.py                                            │
└──────────┬──────────────────────────────────────────────────┘
           │ Outputs: quality_report.json,
           │          coverage_report.json,
           │          dependency_report.json
           ▼
┌─────────────────────────────────────────────────────────────┐
│ NEW: AI Insights Analyzer (Python)                          │
│ - insights_analyzer.py                                       │
│   ├── analyze_trends() → Detect patterns in historical data │
│   ├── generate_predictions() → ML forecasting               │
│   ├── calculate_risks() → Risk assessment                   │
│   └── create_summaries() → Claude API for NLG               │
└──────────┬──────────────────────────────────────────────────┘
           │ Outputs: insights_report.json,
           │          predictions_report.json,
           │          risks_report.json
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Historical Data Store (JSON)                                │
│ public/data/                                                 │
│ ├── history/manifest.json (index of all runs)              │
│ ├── insights/insights_latest.json                          │
│ ├── predictions/predictions_latest.json                     │
│ └── risks/risks_latest.json                                │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ React Dashboard (Existing + New)                            │
│ ├── Existing: Dashboard, Quality, Coverage, Dependencies    │
│ ├── NEW: InsightsPage                                       │
│ ├── NEW: PredictiveDashboard                                │
│ ├── NEW: VisualizationBuilder                               │
│ ├── NEW: CollaborationHub                                   │
│ └── NEW: NotificationCenter                                 │
└──────────┬──────────────────────────────────────────────────┘
           │ TanStack Query fetches data
           │ TanStack Router handles navigation
           ▼
┌─────────────────────────────────────────────────────────────┐
│ User Interactions                                            │
│ - View AI insights                                           │
│ - Explore predictions                                        │
│ - Build custom charts                                        │
│ - Collaborate with team                                      │
│ - Receive smart notifications                                │
└─────────────────────────────────────────────────────────────┘
```

### New API Endpoints

```typescript
// src/features/dashboard/api/insightsApi.ts
export const insightsApi = {
  // Fetch AI-generated insights
  getInsights: (category?: InsightType) =>
    Promise<AIInsight[]>,

  // Mark insight as acknowledged
  acknowledgeInsight: (insightId: string) =>
    Promise<void>,

  // Request insight regeneration
  regenerateInsights: () =>
    Promise<AIInsight[]>,
};

// src/features/dashboard/api/predictionsApi.ts
export const predictionsApi = {
  // Fetch predictions for a metric
  getPrediction: (metric: string, horizon: number) =>
    Promise<PredictionData>,

  // Fetch risk assessment
  getRisks: () =>
    Promise<Risk[]>,

  // Update scenario parameters
  updateScenario: (scenario: ScenarioConfig) =>
    Promise<PredictionData>,
};

// src/features/dashboard/api/visualizationApi.ts
export const visualizationApi = {
  // Save custom visualization
  saveVisualization: (config: VisualizationConfig) =>
    Promise<string>,

  // Load saved visualizations
  getVisualizations: () =>
    Promise<VisualizationConfig[]>,

  // Export visualization data
  exportVisualization: (id: string, format: ExportFormat) =>
    Promise<Blob>,
};

// src/features/dashboard/api/collaborationApi.ts
export const collaborationApi = {
  // Fetch activity feed
  getActivity: (filters: ActivityFilters) =>
    Promise<ActivityItem[]>,

  // Assign issue to user
  assignIssue: (issueId: string, userId: string) =>
    Promise<void>,

  // Add comment
  addComment: (issueId: string, text: string) =>
    Promise<Comment>,

  // Set sprint goal
  setGoal: (goal: SprintGoal) =>
    Promise<void>,
};
```

---

## Type System Extensions

### Phase 4 Types

```typescript
// src/features/dashboard/types/insights.ts

/**
 * AI-generated insight
 */
export interface AIInsight {
  id: string;
  type: InsightType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  explanation: string;
  confidence: number; // 0-100
  metrics: MetricSnapshot[];
  affectedFiles: FileReference[];
  recommendations: string[];
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export type InsightType =
  | 'improvement'
  | 'concern'
  | 'recommendation'
  | 'prediction';

/**
 * Metric snapshot for insight
 */
export interface MetricSnapshot {
  name: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * File reference with line number
 */
export interface FileReference {
  path: string;
  line?: number;
  snippet?: string;
  url?: string;
}

// src/features/dashboard/types/predictions.ts

/**
 * Prediction data for a metric
 */
export interface PredictionData {
  metric: string;
  historical: DataPoint[];
  predicted: DataPoint[];
  confidenceBands: {
    lower: DataPoint[];
    upper: DataPoint[];
  };
  confidence: number; // 0-100
  horizon: number; // days
  methodology: string; // "linear-regression" | "arima" | etc.
  factors: PredictionFactor[];
}

export interface DataPoint {
  date: string;
  value: number;
}

export interface PredictionFactor {
  name: string;
  weight: number; // 0-1
  direction: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

/**
 * Risk assessment
 */
export interface Risk {
  id: string;
  name: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  category: 'quality' | 'coverage' | 'dependency' | 'security';
  affectedFiles: string[];
  mitigation: string;
  estimatedEffort: number; // hours
  confidence: number; // 0-100
}

// src/features/dashboard/types/collaboration.ts

/**
 * Activity feed item
 */
export interface ActivityItem {
  id: string;
  type: 'comment' | 'assignment' | 'resolution' | 'goal';
  actor: User;
  timestamp: string;
  target: ActivityTarget;
  message: string;
  reactions: Reaction[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'developer' | 'lead' | 'manager' | 'qa';
}

export interface ActivityTarget {
  type: 'issue' | 'file' | 'goal';
  id: string;
  title: string;
  url: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs
}

/**
 * Issue assignment
 */
export interface IssueAssignment {
  issueId: string;
  userId: string;
  assignedAt: string;
  assignedBy: string;
  dueDate?: string;
  status: 'assigned' | 'in-progress' | 'resolved' | 'blocked';
}

/**
 * Comment thread
 */
export interface Comment {
  id: string;
  issueId: string;
  author: User;
  text: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string; // for nested replies
  reactions: Reaction[];
  mentions: string[]; // user IDs
}

/**
 * Sprint goal
 */
export interface SprintGoal {
  id: string;
  title: string;
  description: string;
  target: MetricTarget;
  startDate: string;
  endDate: string;
  createdBy: User;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'missed' | 'cancelled';
}

export interface MetricTarget {
  metric: string;
  current: number;
  target: number;
  unit: string;
}
```

---

## Implementation Roadmap

### Phase 4A: AI Insights Engine (Weeks 1-2)

**Python Work:**
- Create `src/analyzers/insights_analyzer.py`
- Integrate Claude API for natural language summaries
- Generate `insights_report.json` output

**React Work:**
- Create `InsightsPage.tsx` component
- Create `InsightCard.tsx` component
- Create `insightsApi.ts` for data fetching
- Add route: `/dashboard/insights`

**Files to Create:** 8 files
- Python: 1 analyzer, 1 utility module
- React: 4 components, 1 API module, 1 route, 1 hook

### Phase 4B: Predictive Analytics (Weeks 3-4)

**Python Work:**
- Create `src/analyzers/predictions_analyzer.py`
- Implement forecasting algorithms (linear regression, ARIMA)
- Generate `predictions_report.json` and `risks_report.json`

**React Work:**
- Create `PredictiveDashboard.tsx` component
- Create `PredictionChart.tsx` component
- Create `RiskMatrix.tsx` component
- Create `predictionsApi.ts` for data fetching
- Add route: `/dashboard/predictions`

**Files to Create:** 10 files
- Python: 1 analyzer, 2 utility modules
- React: 5 components, 1 API module, 1 route, 2 hooks

### Phase 4C: Visualization Builder (Week 5)

**React Work Only:**
- Create `VisualizationBuilder.tsx` component
- Create `BuilderSidebar.tsx`, `BuilderCanvas.tsx`, `BuilderToolbar.tsx`
- Create `visualizationApi.ts` for saving/loading configs
- Implement drag-and-drop with `react-dnd`
- Add route: `/dashboard/visualizations`

**Files to Create:** 8 files
- React: 6 components, 1 API module, 1 route

### Phase 4D: Collaboration Features (Week 6)

**Backend Work (New!):**
- Set up lightweight backend (Express.js or FastAPI)
- Add SQLite database for comments, assignments, goals
- Create REST API endpoints

**React Work:**
- Create `CollaborationHub.tsx` component
- Create `ActivityFeed.tsx`, `IssueAssignments.tsx`, `CommentThread.tsx`
- Create `collaborationApi.ts` for backend communication
- Add route: `/dashboard/collaboration`

**Files to Create:** 12 files
- Backend: 4 API routes, 2 database models, 1 migration
- React: 4 components, 1 API module, 1 route

### Phase 4E: Notifications & Polish (Week 7)

**React Work:**
- Create `NotificationCenter.tsx` component
- Create `NotificationBell.tsx`, `NotificationDropdown.tsx`
- Implement WebSocket connection for real-time updates
- Add notification preferences page
- Add route: `/dashboard/settings/notifications`

**Files to Create:** 6 files
- React: 5 components, 1 WebSocket hook

**Polish:**
- Add loading skeletons for all new pages
- Add error boundaries
- Add accessibility improvements (ARIA labels, keyboard navigation)
- Add unit tests for new components
- Add integration tests for new flows

---

## Visual Design System Extensions

### New Color Palette Additions

```css
/* Phase 4 Custom Colors */
:root {
  /* Prediction colors */
  --color-prediction: #9c27b0;
  --color-prediction-light: #ba68c8;
  --color-prediction-lighter: #e1bee7;
  --color-prediction-lightest: #f3e5f5;

  /* Insight colors (semantic overlays) */
  --color-insight-improvement: var(--color-success);
  --color-insight-concern: var(--color-error);
  --color-insight-recommendation: var(--color-info);
  --color-insight-prediction: var(--color-prediction);

  /* Risk matrix colors */
  --color-risk-low: #28a745;
  --color-risk-medium: #ff9800;
  --color-risk-high: #ff5722;
  --color-risk-critical: #dc3545;

  /* Activity feed colors */
  --color-activity-comment: var(--color-info);
  --color-activity-assignment: var(--color-warning);
  --color-activity-resolution: var(--color-success);
  --color-activity-goal: var(--color-prediction);
}
```

### New Component Styles

```css
/* Insight Card */
.insight-card {
  border-left: 4px solid var(--color-insight-improvement);
  background: var(--color-background-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  transition: var(--transition);
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.insight-card--concern {
  border-left-color: var(--color-insight-concern);
}

.insight-card--recommendation {
  border-left-color: var(--color-insight-recommendation);
}

.insight-card--prediction {
  border-left-color: var(--color-insight-prediction);
}

/* Confidence Score */
.confidence-score {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.confidence-star {
  color: var(--color-warning);
  font-size: 16px;
}

.confidence-star--filled {
  opacity: 1;
}

.confidence-star--empty {
  opacity: 0.3;
}

/* Risk Bubble */
.risk-bubble {
  position: absolute;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.risk-bubble:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-lg);
  z-index: 10;
}

.risk-bubble--low {
  background: var(--color-risk-low);
}

.risk-bubble--medium {
  background: var(--color-risk-medium);
}

.risk-bubble--high {
  background: var(--color-risk-high);
}

.risk-bubble--critical {
  background: var(--color-risk-critical);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Activity Item */
.activity-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.activity-item:hover {
  background: var(--color-background-secondary);
}

.activity-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-timestamp {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

/* Notification Badge */
.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--color-error);
  color: white;
  border-radius: var(--radius-full);
  font-size: var(--font-size-tiny);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.notification-badge--pulse {
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
```

---

## Accessibility Requirements

### Phase 4 WCAG Compliance

All Phase 4 features must meet **WCAG 2.1 Level AA** standards:

#### Keyboard Navigation

- **Insight Cards:** Tab to navigate, Enter to expand, Escape to collapse
- **Risk Matrix:** Tab through bubbles, Arrow keys to navigate grid, Enter to open details
- **Visualization Builder:** Tab to metrics/chart types, Spacebar to select, Arrows to navigate canvas
- **Activity Feed:** Tab through items, Enter to open, Escape to return
- **Comment Threads:** Tab through comments, Enter to reply, Escape to cancel

#### Screen Reader Support

```html
<!-- Insight Card -->
<article
  role="article"
  aria-labelledby="insight-title-123"
  aria-describedby="insight-desc-123"
>
  <h3 id="insight-title-123">Test Coverage Increased</h3>
  <p id="insight-desc-123">
    High priority improvement. Confidence 85%.
    Coverage increased from 72% to 78% in authentication modules.
  </p>
</article>

<!-- Risk Matrix Bubble -->
<button
  role="button"
  aria-label="Critical risk: Security Gap. High impact, high probability. View details."
  aria-pressed="false"
  onClick={openRiskDetails}
>
  Security Gap
</button>

<!-- Prediction Chart -->
<figure
  role="img"
  aria-label="Quality score prediction. Historical data shows increase from 70 to 87 over past 90 days. Predicted to reach 92 in next 90 days with 90% confidence."
>
  <canvas ref={chartRef} />
  <table className="sr-only">
    {/* Data table fallback for screen readers */}
  </table>
</figure>
```

#### Color Contrast

All Phase 4 colors meet minimum contrast ratios:
- **Text on backgrounds:** 4.5:1 minimum
- **Interactive elements:** 3:1 minimum
- **Focus indicators:** 3:1 against adjacent colors

#### Motion & Animation

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .insight-card,
  .risk-bubble,
  .activity-item,
  .notification-badge {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Performance Targets

### Phase 4 Performance Budgets

| Feature | Target | Measurement |
|---------|--------|-------------|
| Insights page initial load | <1s | Time to interactive |
| AI insight generation (Python) | <5s | API response time |
| Prediction calculation | <2s | API response time |
| Risk matrix render (50 risks) | <200ms | Canvas paint |
| Visualization builder preview | <100ms | Chart update on drag |
| Activity feed fetch | <500ms | API response time |
| Comment post | <300ms | API response + UI update |
| Notification delivery | <100ms | WebSocket latency |
| Custom chart export (PNG) | <2s | Canvas to blob |
| Page bundle size | <250KB | Per route (gzipped) |

### Optimization Strategies

1. **Code Splitting:**
   - Lazy load Phase 4 routes with `React.lazy()`
   - Split AI insights, predictions, and collaboration into separate bundles
   - Load chart libraries on demand

2. **Data Caching:**
   - TanStack Query caches insights for 5 minutes
   - Predictions cached for 1 hour (stale data acceptable)
   - Activity feed uses SWR (stale-while-revalidate)

3. **Virtual Scrolling:**
   - Activity feed with `react-virtual` for 100+ items
   - Comment threads with virtual scrolling
   - Risk matrix uses canvas clustering for 500+ risks

4. **Debouncing:**
   - Visualization builder updates debounced to 300ms
   - Search/filter inputs debounced to 500ms
   - Comment draft autosave debounced to 2s

5. **WebSocket Optimization:**
   - Batch notification updates (max 1 per second)
   - Disconnect on idle (5 minutes inactivity)
   - Reconnect with exponential backoff

---

## Testing Strategy

### Phase 4 Test Coverage

**Unit Tests (80% coverage target):**
- All React components with Jest + React Testing Library
- All API functions with mocked fetch
- All utility functions (prediction algorithms, risk calculations)
- All hooks with `@testing-library/react-hooks`

**Integration Tests:**
- Full user flow: View insights → Explore predictions → Build chart → Share
- Assignment flow: View unassigned → Assign to user → Add comment → Resolve
- Notification flow: Trigger event → Receive notification → Mark as read

**E2E Tests (Playwright):**
- Critical paths through Phase 4 features
- Accessibility checks with `@axe-core/playwright`
- Performance monitoring with Lighthouse CI

**Visual Regression Tests:**
- Snapshot tests for key Phase 4 pages
- Chromatic visual testing for component library

### Test Examples

```typescript
// Unit test: InsightCard component
describe('InsightCard', () => {
  it('renders improvement insight with correct styling', () => {
    const insight: AIInsight = {
      id: '1',
      type: 'improvement',
      severity: 'high',
      title: 'Test coverage increased',
      explanation: 'Coverage improved from 70% to 85%',
      confidence: 90,
      metrics: [],
      affectedFiles: [],
      recommendations: [],
      createdAt: '2025-01-15T10:00:00Z',
    };

    render(<InsightCard insight={insight} />);

    expect(screen.getByText('Test coverage increased')).toBeInTheDocument();
    expect(screen.getByText(/90%/)).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveStyle({
      borderLeftColor: 'var(--color-success)',
    });
  });

  it('is keyboard accessible', () => {
    const insight = createMockInsight();
    render(<InsightCard insight={insight} />);

    const card = screen.getByRole('article');
    card.focus();

    expect(card).toHaveFocus();
    fireEvent.keyDown(card, { key: 'Enter' });

    // Verify expansion logic
  });
});

// Integration test: Assignment flow
describe('Issue Assignment Flow', () => {
  it('allows assigning issue to team member', async () => {
    render(<CollaborationHub />);

    // Find unassigned issue
    const issue = await screen.findByText(/Memory leak/);

    // Click assign dropdown
    const assignButton = within(issue.closest('div')!).getByText(/Assign to/);
    fireEvent.click(assignButton);

    // Select team member
    const alice = await screen.findByText(/Alice/);
    fireEvent.click(alice);

    // Verify API call
    await waitFor(() => {
      expect(mockCollaborationApi.assignIssue).toHaveBeenCalledWith(
        'issue-123',
        'alice-id'
      );
    });

    // Verify UI update
    expect(await screen.findByText(/Assigned to Alice/)).toBeInTheDocument();
  });
});

// E2E test: Insights to chart export
test('user can view insights and export custom chart', async ({ page }) => {
  await page.goto('/dashboard/insights');

  // View insights page
  await expect(page.locator('h1')).toContainText('AI Insights');

  // Click on quality improvement insight
  await page.click('text=Quality score improved');

  // Navigate to visualization builder
  await page.click('text=Create Custom Chart');

  // Drag quality metric to canvas
  await page.dragAndDrop('.metric-quality', '.builder-canvas');

  // Verify chart renders
  await expect(page.locator('canvas')).toBeVisible();

  // Export as PNG
  const downloadPromise = page.waitForEvent('download');
  await page.click('text=Export PNG');
  const download = await downloadPromise;

  // Verify download
  expect(download.suggestedFilename()).toMatch(/quality-chart.*\.png/);
});
```

---

## Migration & Rollout Plan

### Phased Rollout Strategy

**Week 1-2: Internal Alpha**
- Deploy Phase 4A (AI Insights) to staging
- Internal team testing with real code data
- Gather feedback on insight quality and UI/UX

**Week 3-4: Beta with Select Users**
- Deploy Phase 4B (Predictions) to beta environment
- Invite 5-10 beta testers from community
- A/B test: existing dashboard vs. Phase 4 features
- Collect metrics: engagement, time on page, feature adoption

**Week 5-6: Progressive Rollout**
- Deploy Phase 4C & 4D (Visualization + Collaboration)
- Feature flag: gradually enable for 10% → 50% → 100% of users
- Monitor error rates, performance metrics, user feedback

**Week 7: General Availability**
- Deploy Phase 4E (Notifications + Polish)
- Full public release
- Marketing announcement: blog post, demo video
- Documentation: update README, add tutorials

### Feature Flags

```typescript
// src/features/dashboard/utils/featureFlags.ts

export const FEATURE_FLAGS = {
  AI_INSIGHTS: process.env.VITE_ENABLE_AI_INSIGHTS === 'true',
  PREDICTIONS: process.env.VITE_ENABLE_PREDICTIONS === 'true',
  VISUALIZATION_BUILDER: process.env.VITE_ENABLE_VIZ_BUILDER === 'true',
  COLLABORATION: process.env.VITE_ENABLE_COLLABORATION === 'true',
  NOTIFICATIONS: process.env.VITE_ENABLE_NOTIFICATIONS === 'true',
};

// Usage in components
function InsightsPage() {
  if (!FEATURE_FLAGS.AI_INSIGHTS) {
    return <ComingSoonPage feature="AI Insights" />;
  }

  return <ActualInsightsPage />;
}
```

### Rollback Plan

If critical issues arise:

1. **Instant Rollback:** Toggle feature flag to disable feature
2. **Partial Rollback:** Disable specific sub-features (e.g., predictions but keep insights)
3. **Full Rollback:** Revert to previous deployment via CI/CD
4. **Data Preservation:** Phase 4 data stored separately, no risk to existing data

### Success Metrics

Track these KPIs post-launch:

- **Engagement:**
  - % users visiting Phase 4 pages
  - Average time on insights page
  - Number of custom charts created per week

- **Adoption:**
  - % teams using collaboration features
  - Number of comments posted per week
  - Number of issues assigned per week

- **Impact:**
  - Correlation between insights viewed and quality improvements
  - % users who act on recommendations
  - Time saved by using predictions vs. manual analysis

- **Technical:**
  - Page load times (target: <1s)
  - Error rates (target: <0.1%)
  - Notification delivery rate (target: >99%)

---

## Documentation Deliverables

### Phase 4 Documentation Checklist

- [ ] **PHASE4_IMPLEMENTATION_GUIDE.md** - Step-by-step developer instructions
- [ ] **PHASE4_API_REFERENCE.md** - Python analyzer API documentation
- [ ] **PHASE4_COMPONENT_LIBRARY.md** - React component API documentation
- [ ] **PHASE4_USER_GUIDE.md** - End-user tutorial with screenshots
- [ ] **PHASE4_ARCHITECTURE.md** - Technical architecture deep dive
- [ ] **CHANGELOG.md** - Add Phase 4 release notes
- [ ] **README.md** - Update with Phase 4 features
- [ ] **Video Tutorial** - 5-minute walkthrough of Phase 4 features

---

## Conclusion

Phase 4 transforms the Code Inventory Dashboard from a powerful analysis tool into an **intelligent code health assistant**. By combining AI-powered insights, predictive analytics, custom visualizations, team collaboration, and smart notifications, we create a platform that not only shows *what* is happening in your codebase, but *why* it's happening, *what* will happen next, and *how* to make it better together.

The visual storytelling approach ensures that developers at all levels—from junior engineers to CTOs—can quickly understand code health trends and take informed action. Phase 4 doesn't just present data; it **tells the story of your code's journey** toward quality, maintainability, and excellence.

---

**Ready to implement?** Start with Phase 4A (AI Insights) and iterate based on user feedback. Ship small, learn fast, and build the future of code quality tooling.

---

**Document Version:** 1.0
**Created:** 2025-12-09
**Last Updated:** 2025-12-09
**Status:** PLANNING - Awaiting Stakeholder Approval
**Next Action:** Review with product team, create Phase 4A task breakdown
