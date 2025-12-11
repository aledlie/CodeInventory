# Phase 5: Advanced Visual Storytelling - Design Specification

**Comprehensive Visual Design Guide for Dashboard Enhancement**

**Status:** READY FOR IMPLEMENTATION
**Related:** `PHASE5_IMPLEMENTATION_GUIDE.md`
**Created:** 2025-12-09

---

## Executive Summary

This document provides the complete visual storytelling strategy for Phase 5, transforming the Code Inventory dashboard into an intelligent, personalized analytics platform. Building on the established design system from Phases 1-3, this specification defines visual patterns, animations, color extensions, and user journey flows for all Phase 5 features.

---

## Design Philosophy

### Core Principles

1. **Progressive Insight** - High-level overview → detailed drill-down
2. **Contextual Guidance** - Data + meaning + action in every view
3. **Temporal Awareness** - Past, present, and future context
4. **Personalization** - Individual and team customization
5. **Actionable Intelligence** - Every visualization leads to action

### Visual Narrative Strategy

Phase 5 tells a story through data:
- **Where were we?** (Historical Comparison)
- **Where are we now?** (Current Analytics)
- **Where are we going?** (Predictive Insights)
- **What should we do?** (Actionable Recommendations)

---

## Extended Color Palette

### Comparison Colors

```css
/* Improvement indicators */
--color-improvement-strong: #1b5e20;     /* +10% or more */
--color-improvement-moderate: #2e7d32;   /* +5% to +10% */
--color-improvement-slight: #4caf50;     /* +1% to +5% */

/* Regression indicators */
--color-regression-strong: #b71c1c;      /* -10% or more */
--color-regression-moderate: #c62828;    /* -5% to -10% */
--color-regression-slight: #ef5350;      /* -1% to -5% */

/* Neutral indicators */
--color-neutral: #9e9e9e;                /* ±1% */
--color-neutral-background: #f5f5f5;
```

### Prediction Confidence Levels

```css
/* High confidence (80%+) */
--color-confidence-high: #0066cc;
--color-confidence-high-bg: rgba(0, 102, 204, 0.1);
--border-confidence-high: solid;

/* Medium confidence (50-79%) */
--color-confidence-medium: #ff9800;
--color-confidence-medium-bg: rgba(255, 152, 0, 0.1);
--border-confidence-medium: dashed;

/* Low confidence (<50%) */
--color-confidence-low: #9e9e9e;
--color-confidence-low-bg: rgba(158, 158, 158, 0.1);
--border-confidence-low: dotted;
```

### Risk Severity Scale

```css
/* Critical risk (80-100) */
--color-risk-critical: #b71c1c;
--color-risk-critical-bg: rgba(183, 28, 28, 0.15);

/* High risk (60-79) */
--color-risk-high: #e53935;
--color-risk-high-bg: rgba(229, 57, 53, 0.12);

/* Medium risk (40-59) */
--color-risk-medium: #ff9800;
--color-risk-medium-bg: rgba(255, 152, 0, 0.1);

/* Low risk (20-39) */
--color-risk-low: #ffc107;
--color-risk-low-bg: rgba(255, 193, 7, 0.08);

/* Minimal risk (0-19) */
--color-risk-minimal: #4caf50;
--color-risk-minimal-bg: rgba(76, 175, 80, 0.08);
```

### Technical Debt Gradients

```css
/* Debt severity gradient */
--gradient-debt-severe: linear-gradient(135deg, #b71c1c 0%, #e53935 100%);
--gradient-debt-high: linear-gradient(135deg, #e53935 0%, #ff9800 100%);
--gradient-debt-medium: linear-gradient(135deg, #ff9800 0%, #ffc107 100%);
--gradient-debt-low: linear-gradient(135deg, #ffc107 0%, #4caf50 100%);
--gradient-debt-minimal: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
```

### Personalization States

```css
/* Widget interaction states */
--color-widget-hover: rgba(0, 102, 204, 0.08);
--color-widget-drag: rgba(0, 102, 204, 0.15);
--color-widget-drop-zone: rgba(76, 175, 80, 0.2);
--color-widget-drop-invalid: rgba(229, 57, 53, 0.2);
--border-widget-drag: 2px dashed var(--color-primary);
```

---

## Visual Encoding Standards

### Delta Indicators

Display metric changes with consistent visual language:

```
Improvement:  ↗ +15.3%  (green, upward arrow)
Regression:   ↘ -8.2%   (red, downward arrow)
Neutral:      → ±1.0%   (gray, horizontal arrow)
```

**Component Implementation:**

```typescript
interface DeltaIndicatorProps {
  value: number;
  previousValue: number;
  format?: 'percentage' | 'absolute' | 'points';
  size?: 'small' | 'medium' | 'large';
  showArrow?: boolean;
  threshold?: number; // Default ±1% for neutral
}

function getDeltaColor(delta: number, threshold: number): string {
  if (Math.abs(delta) < threshold) return 'var(--color-neutral)';
  if (delta > 0) {
    if (delta >= 10) return 'var(--color-improvement-strong)';
    if (delta >= 5) return 'var(--color-improvement-moderate)';
    return 'var(--color-improvement-slight)';
  }
  if (delta <= -10) return 'var(--color-regression-strong)';
  if (delta <= -5) return 'var(--color-regression-moderate)';
  return 'var(--color-regression-slight)';
}
```

### Confidence Level Indicators

Visual representation of prediction confidence:

```typescript
interface ConfidenceIndicatorProps {
  confidence: number; // 0-100
  label?: string;
  showBar?: boolean;
  showPercentage?: boolean;
}

function getConfidenceStyle(confidence: number) {
  if (confidence >= 80) {
    return {
      color: 'var(--color-confidence-high)',
      borderStyle: 'solid',
      label: 'High',
    };
  }
  if (confidence >= 50) {
    return {
      color: 'var(--color-confidence-medium)',
      borderStyle: 'dashed',
      label: 'Medium',
    };
  }
  return {
    color: 'var(--color-confidence-low)',
    borderStyle: 'dotted',
    label: 'Low',
  };
}
```

### Risk Severity Badges

```typescript
interface RiskBadgeProps {
  score: number; // 0-100
  showIcon?: boolean;
  size?: 'small' | 'medium';
}

function getRiskLevel(score: number) {
  if (score >= 80) return { label: 'Critical', icon: '🔴', color: 'var(--color-risk-critical)' };
  if (score >= 60) return { label: 'High', icon: '🟠', color: 'var(--color-risk-high)' };
  if (score >= 40) return { label: 'Medium', icon: '🟡', color: 'var(--color-risk-medium)' };
  if (score >= 20) return { label: 'Low', icon: '🟢', color: 'var(--color-risk-low)' };
  return { label: 'Minimal', icon: '✅', color: 'var(--color-risk-minimal)' };
}
```

---

## Chart Types & Visualization Recommendations

### 1. Delta Waterfall Chart

Shows incremental changes between comparison periods.

```
Quality Score Change Breakdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Previous Score     ████████████████████████████████████  82.5
                                                           │
Type Safety        ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  +3.2
                                                           │
Code Complexity    ░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░  -1.8
                                                           │
Documentation      ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  +1.5
                                                           │
Test Coverage      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  +0.9
                   ─────────────────────────────────────────
Current Score      █████████████████████████████████████  86.3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Use Case:** Historical comparison drill-down
**Library:** Chart.js with custom plugin

### 2. Multi-Dimensional Radar Chart

Compare multiple metrics across two time periods.

```
                    Quality
                      100
                       │
                  80 ──┼── 80
                 /     │     \
         Coverage      │      Maintainability
              60 ──────┼────── 60
                 \     │     /
                  40 ──┼── 40
                       │
                Dependencies

────  Current (solid blue)
- - - Previous (dashed gray)
```

**Use Case:** Executive overview comparison
**Library:** Chart.js radar type

### 3. Risk Assessment Heatmap

Module × Category risk matrix.

```
                │ Complexity │ Coverage │ Dependencies │ Churn │ Age │
────────────────┼────────────┼──────────┼──────────────┼───────┼─────┤
src/features/   │    ████    │   ░░░░   │     ████     │  ░░░░ │ ░░░░│
src/components/ │    ░░░░    │   ████   │     ░░░░     │  ████ │ ░░░░│
src/utils/      │    ░░░░    │   ░░░░   │     ░░░░     │  ░░░░ │ ████│
src/api/        │    ████    │   ████   │     ████     │  ░░░░ │ ░░░░│

Legend: ████ High Risk  ▓▓▓▓ Medium  ░░░░ Low
```

**Use Case:** Advanced analytics overview
**Library:** Custom SVG or D3.js

### 4. Technical Debt Sunburst

Hierarchical breakdown of debt by category and module.

```
           ┌─────────────────────────────────────┐
          /   Complexity (35%)                    \
         /  ┌───────────────────────┐              \
        │   │ features/ (20%)       │               │
        │   │   └─ dashboard (12%) │               │
        │   │   └─ auth (8%)       │               │
        │   └───────────────────────┘               │
        │                                           │
        │   Coverage (28%)                          │
        │   ┌───────────────────┐                  │
        │   │ utils/ (15%)      │                  │
        │   │ api/ (13%)        │                  │
        │   └───────────────────┘                  │
        │                                          │
         \  Dependencies (22%)  │  Other (15%)    /
          \                                      /
           └─────────────────────────────────────┘
```

**Use Case:** Debt prioritization
**Library:** D3.js sunburst or Chart.js doughnut (nested)

### 5. Predictive Trend with Confidence Bands

```
Score
100 │
    │                              ╭─────── Predicted (high conf)
 90 │                         ╭───╯ · · · · Upper bound
    │                    ╭───╯    · · · ·
 80 │               ╭───╯ · · · · · · · · · Lower bound
    │          ╭───╯
 70 │     ╭───╯
    │ ───╯
 60 │
    └────────────────────────────────────────────────
      Jan   Feb   Mar   Apr   May   Jun   Jul   Aug

      ─── Actual    ─ ─ Predicted    ░░░ Confidence Band
```

**Use Case:** Predictive analytics
**Library:** Chart.js with fill between lines

### 6. Anomaly Detection Scatter

```
Z-Score
  3 │                    ●              ● Anomaly (red)
    │                                   ○ Normal (blue)
  2 │              ●
    │     ○   ○        ○    ○
  1 │  ○    ○   ○   ○     ○
    │ ○  ○ ○  ○ ○ ○  ○ ○    ○
  0 ├─○──○─○──○─○─○──○─○────○─────────────────
    │    ○  ○    ○ ○    ○
 -1 │      ○        ○
    │                         ●
 -2 │
    └─────────────────────────────────────────
      Jan        Feb        Mar        Apr
```

**Use Case:** Quality anomaly detection
**Library:** Chart.js scatter with threshold lines

---

## User Journey Flows

### Journey 1: Engineering Manager - Weekly Review

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTRY: Dashboard Overview                                        │
│ Goal: Understand team progress and prepare for standup          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: View Trend Summary                                       │
│ • See quality score trend (last 7 days)                         │
│ • Note: Score improved +3.2% this week                          │
│ • Action: Click "Compare" for details                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Historical Comparison (/dashboard/compare)               │
│ • Select: This week vs Last week                                │
│ • View: Side-by-side metric cards                               │
│ • Insight: "Type safety improved 15%, coverage dropped 2%"      │
│ • Action: Click "Generate Report"                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Report Generation (/dashboard/reports)                   │
│ • Select: "Executive Summary" template                          │
│ • Configure: Include comparison charts                          │
│ • Export: PDF for stakeholder meeting                           │
│ • Optional: Schedule weekly delivery                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ EXIT: Standup-Ready                                              │
│ • Has PDF report for sharing                                    │
│ • Knows key metrics and trends                                  │
│ • Can articulate team progress                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Journey 2: Developer - Fix and Validate

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTRY: Insight Card Alert                                        │
│ "High Priority: 5 files missing type safety"                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: View Insight Details                                     │
│ • See affected files list                                       │
│ • Estimated impact: +5-10% quality                              │
│ • Effort: ~4 hours                                              │
│ • Action: Click "View Files"                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Fix Issues (External - IDE/Editor)                       │
│ • Add TypeScript strict types to identified files               │
│ • Run local tests                                               │
│ • Commit and push changes                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Run New Analysis                                         │
│ • Pipeline runs automatically (CI/CD) or manually               │
│ • New reports generated                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Validate Improvement (/dashboard/compare)                │
│ • Compare: Before fix vs After fix                              │
│ • Confirm: Type safety improved as expected                     │
│ • Check: No regressions in other metrics                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ EXIT: Issue Resolved                                             │
│ • Insight card dismissed/resolved                               │
│ • Quality score reflects improvement                            │
│ • PR ready with evidence of impact                              │
└─────────────────────────────────────────────────────────────────┘
```

### Journey 3: QA Lead - Risk Prioritization

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTRY: Sprint Planning                                           │
│ Goal: Identify high-risk areas for testing focus                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Advanced Analytics (/dashboard/analytics)                │
│ • View risk heatmap                                             │
│ • Identify: src/features/dashboard has highest risk             │
│ • Factors: High complexity, low coverage, recent churn          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Drill Down to Module                                     │
│ • Click high-risk cell in heatmap                               │
│ • See: Individual file risk scores                              │
│ • See: Specific risk factors per file                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Generate Test Priority Report                            │
│ • Select "Technical Report" template                            │
│ • Include: Risk heatmap, coverage gaps, priority list           │
│ • Export: Share with testing team                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ EXIT: Testing Plan Ready                                         │
│ • Has prioritized list of areas to test                         │
│ • Can allocate QA resources effectively                         │
│ • Report documents rationale for stakeholders                   │
└─────────────────────────────────────────────────────────────────┘
```

### Journey 4: Architect - Debt Remediation Planning

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTRY: Technical Debt Review                                     │
│ Goal: Plan refactoring priorities for next quarter              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: View Debt Overview (/dashboard/analytics)                │
│ • See technical debt score: 127 hours                           │
│ • View sunburst: Complexity (35%), Coverage (28%), Deps (22%)   │
│ • Trend: Debt increasing 5% per month                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Analyze Debt Breakdown                                   │
│ • Click "Complexity" segment in sunburst                        │
│ • See: Top 10 complex modules                                   │
│ • See: Specific complexity factors                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: View Predictive Trend                                    │
│ • If no action: Debt reaches 180 hours in 6 months              │
│ • Confidence: High (82%)                                        │
│ • Recommendation: Address complexity first (highest ROI)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Create Remediation Plan                                  │
│ • Set debt target: 80 hours (quarterly goal)                    │
│ • Configure burndown tracking                                   │
│ • Generate compliance report for leadership                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ EXIT: Actionable Plan                                            │
│ • Has prioritized refactoring list                              │
│ • Has debt reduction target with tracking                       │
│ • Has report for leadership buy-in                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Animation & Interaction Patterns

### Micro-Animations

#### 1. Metric Card Reveal

```typescript
// Staggered reveal for metric cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
};

// Usage with Framer Motion
<motion.div
  custom={index}
  initial="hidden"
  animate="visible"
  variants={cardVariants}
>
  <MetricCard {...props} />
</motion.div>
```

#### 2. Delta Indicator Animation

```typescript
// Slide-in with color glow for improvements
const deltaVariants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// Success glow effect
const glowKeyframes = `
  @keyframes successGlow {
    0% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(46, 125, 50, 0); }
    100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
  }
`;
```

#### 3. Chart Data Point Hover

```typescript
// Chart.js hover configuration
const hoverConfig = {
  interaction: {
    mode: 'nearest',
    intersect: true,
  },
  plugins: {
    tooltip: {
      animation: {
        duration: 150,
        easing: 'easeOutQuart',
      },
    },
  },
  elements: {
    point: {
      hoverRadius: 8,
      hoverBorderWidth: 3,
      hitRadius: 10,
    },
  },
};
```

#### 4. Risk Heatmap Cell Animation

```typescript
// Sequential cell reveal
const cellVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (delay: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: delay * 0.02,
    },
  }),
};
```

### Page Transitions

```typescript
// Route transition wrapper
const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2, ease: 'easeInOut' },
};

// Layout component
function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      {children}
    </motion.div>
  );
}
```

### Loading States

```typescript
// Skeleton configurations for each component type
const skeletonConfigs = {
  metricCard: {
    width: '100%',
    height: 120,
    variant: 'rounded',
    animation: 'pulse',
  },
  chart: {
    width: '100%',
    height: 300,
    variant: 'rectangular',
    animation: 'wave',
  },
  table: {
    rows: 5,
    columns: 4,
    rowHeight: 52,
    animation: 'pulse',
  },
  heatmap: {
    rows: 6,
    columns: 5,
    cellSize: 48,
    animation: 'pulse',
  },
};
```

### Drag-and-Drop Feedback

```typescript
// Widget drag states
const widgetDragStyles = {
  idle: {
    cursor: 'grab',
    boxShadow: 'var(--shadow-sm)',
    transform: 'scale(1)',
  },
  dragging: {
    cursor: 'grabbing',
    boxShadow: 'var(--shadow-lg)',
    transform: 'scale(1.02) rotate(2deg)',
    opacity: 0.9,
    zIndex: 1000,
  },
  dropZoneActive: {
    backgroundColor: 'var(--color-widget-drop-zone)',
    border: '2px dashed var(--color-success)',
  },
  dropZoneInvalid: {
    backgroundColor: 'var(--color-widget-drop-invalid)',
    border: '2px dashed var(--color-error)',
  },
};
```

### Reduced Motion Support

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```typescript
// Hook for respecting motion preferences
function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}
```

---

## Accessibility Deep Dive

### Keyboard Navigation Map

| Context | Key | Action |
|---------|-----|--------|
| Global | `Tab` | Move to next focusable element |
| Global | `Shift+Tab` | Move to previous focusable element |
| Global | `Escape` | Close modal/dialog |
| Charts | `Arrow Left/Right` | Navigate data points |
| Charts | `Enter` | Show tooltip for current point |
| Heatmap | `Arrow keys` | Navigate cells |
| Heatmap | `Enter` | Drill down to cell details |
| Widget Library | `Space` | Toggle widget on/off |
| Drag-Drop | `Space` | Pick up/drop widget |
| Drag-Drop | `Arrow keys` | Move widget position |

### Screen Reader Announcements

```typescript
// Live region for dynamic updates
function Announcer({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Announcement examples
const announcements = {
  comparisonLoaded: 'Comparison loaded. Quality score improved by 3.2 percent.',
  reportGenerated: 'Report generated successfully. Download starting.',
  widgetAdded: 'Risk heatmap widget added to dashboard.',
  widgetRemoved: 'Coverage gauge widget removed from dashboard.',
  insightDismissed: 'Insight dismissed. 4 insights remaining.',
};
```

### Chart Accessibility

```typescript
// Accessible chart wrapper
interface AccessibleChartProps {
  title: string;
  description: string;
  data: ChartData;
  children: ReactNode; // The actual chart
}

function AccessibleChart({
  title,
  description,
  data,
  children,
}: AccessibleChartProps) {
  const tableId = useId();

  return (
    <figure role="figure" aria-labelledby={`${tableId}-title`}>
      <figcaption id={`${tableId}-title`} className="sr-only">
        {title}. {description}
      </figcaption>

      {/* Visual chart - hidden from screen readers */}
      <div aria-hidden="true">{children}</div>

      {/* Data table - visible to screen readers */}
      <table className="sr-only" aria-describedby={`${tableId}-title`}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.points.map((point, i) => (
            <tr key={i}>
              <td>{point.label}</td>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
```

### Focus Management

```typescript
// Focus trap for modals
function useFocusTrap(isOpen: boolean, containerRef: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element on open
    firstElement?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, containerRef]);
}
```

---

## Performance Optimization

### Performance Budgets

| Metric | Target | Maximum |
|--------|--------|---------|
| Time to Interactive | < 2s | 3s |
| First Contentful Paint | < 1s | 1.5s |
| Animation Frame Rate | 60fps | 30fps |
| Bundle Size (per route) | < 50KB | 75KB |
| Chart Render | < 100ms | 200ms |
| PDF Generation | < 5s | 10s |

### Optimization Strategies

#### 1. Code Splitting

```typescript
// Lazy load Phase 5 routes
const AnalyticsPage = lazy(() =>
  import('./routes/dashboard/analytics').then((m) => ({
    default: m.AnalyticsPage,
  }))
);

const PersonalizationPage = lazy(() =>
  import('./routes/dashboard/settings/personalization').then((m) => ({
    default: m.PersonalizationPage,
  }))
);
```

#### 2. Data Caching

```typescript
// TanStack Query configuration for analytics
const analyticsQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  refetchOnWindowFocus: false,
  retry: 2,
};
```

#### 3. Virtual Scrolling

```typescript
// For large lists (100+ items)
import { FixedSizeList as List } from 'react-window';

function VirtualizedInsightList({ insights }: { insights: Insight[] }) {
  return (
    <List
      height={400}
      itemCount={insights.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <InsightCard {...insights[index]} />
        </div>
      )}
    </List>
  );
}
```

#### 4. Web Workers for Heavy Computation

```typescript
// Worker for predictive calculations
// predictive.worker.ts
self.onmessage = (e: MessageEvent<PredictiveInput>) => {
  const { historicalData, targetMetric, forecastPeriod } = e.data;

  // Linear regression for trend prediction
  const prediction = calculateLinearRegression(historicalData);
  const forecast = generateForecast(prediction, forecastPeriod);
  const confidence = calculateConfidence(historicalData, prediction);

  self.postMessage({ forecast, confidence });
};

// Usage in component
const predictiveWorker = new Worker(
  new URL('./predictive.worker.ts', import.meta.url)
);
```

#### 5. Memoization

```typescript
// Memoize expensive chart data transformations
const chartData = useMemo(() => {
  return transformDataForChart(rawData, timeRange, groupBy);
}, [rawData, timeRange, groupBy]);

// Memoize risk calculations
const riskScores = useMemo(() => {
  return calculateRiskScores(modules, weights);
}, [modules, weights]);
```

---

## Component File Structure

### New Components (45 total)

```
src/features/dashboard/components/
├── analytics/                    # 10 components
│   ├── RiskHeatmap.tsx          # Risk matrix visualization
│   ├── RiskHeatmapCell.tsx      # Individual heatmap cell
│   ├── RiskHeatmapLegend.tsx    # Color legend
│   ├── DebtBurndownChart.tsx    # Debt over time
│   ├── DebtSunburst.tsx         # Hierarchical debt breakdown
│   ├── PredictiveTrendCard.tsx  # Forecast with confidence
│   ├── AnomalyScatter.tsx       # Outlier detection
│   ├── InsightCard.tsx          # Actionable recommendation
│   ├── InsightList.tsx          # List of insights
│   └── index.ts                 # Barrel export
│
├── comparison/                   # 10 components
│   ├── RunSelector.tsx          # Date/run picker
│   ├── ComparisonBanner.tsx     # Summary hero
│   ├── DeltaIndicator.tsx       # Change display
│   ├── ComparisonCard.tsx       # Side-by-side metric
│   ├── DeltaWaterfall.tsx       # Waterfall chart
│   ├── RadarComparison.tsx      # Multi-axis radar
│   ├── IssuesDiff.tsx           # New/resolved issues
│   ├── ComparisonInsight.tsx    # AI-generated insight
│   ├── TimelineSlider.tsx       # Time range selector
│   └── index.ts
│
├── reports/                      # 12 components
│   ├── ReportBuilder.tsx        # Main builder
│   ├── TemplateSelector.tsx     # Pre-built templates
│   ├── SectionPicker.tsx        # Drag-and-drop sections
│   ├── SectionPreview.tsx       # Live preview
│   ├── ExportOptions.tsx        # Format selection
│   ├── BrandingConfig.tsx       # Logo/colors
│   ├── ScheduleConfig.tsx       # Recurring reports
│   ├── ReportPreview.tsx        # Full preview
│   ├── PDFTemplate.tsx          # PDF layout
│   ├── HTMLTemplate.tsx         # HTML layout
│   ├── MarkdownTemplate.tsx     # MD layout
│   └── index.ts
│
└── personalization/              # 13 components
    ├── WidgetLibrary.tsx        # Available widgets
    ├── WidgetCard.tsx           # Single widget option
    ├── DashboardEditor.tsx      # Edit mode container
    ├── WidgetGrid.tsx           # Drag-drop grid
    ├── WidgetPlaceholder.tsx    # Drop zone
    ├── SavedViewsDropdown.tsx   # View switcher
    ├── CreateViewModal.tsx      # New view dialog
    ├── ShareViewModal.tsx       # Sharing options
    ├── NotificationConfig.tsx   # Alert settings
    ├── AlertRule.tsx            # Single alert rule
    ├── ThemeToggle.tsx          # Light/dark mode
    ├── LayoutPresets.tsx        # Pre-built layouts
    └── index.ts
```

### Route Files (4 new routes)

```
src/routes/dashboard/
├── analytics/
│   └── index.tsx                # /dashboard/analytics
├── settings/
│   ├── index.tsx                # /dashboard/settings
│   ├── personalization.tsx      # /dashboard/settings/personalization
│   └── notifications.tsx        # /dashboard/settings/notifications
└── team/
    └── index.tsx                # /dashboard/team
```

### Estimated Lines of Code

| Category | Files | Lines |
|----------|-------|-------|
| Analytics Components | 10 | ~2,500 |
| Comparison Components | 10 | ~2,200 |
| Report Components | 12 | ~3,000 |
| Personalization Components | 13 | ~2,800 |
| Routes | 4 | ~1,200 |
| Types | 4 | ~600 |
| Hooks | 4 | ~800 |
| API | 4 | ~600 |
| Utilities | 3 | ~400 |
| Tests | ~40 | ~3,500 |
| **Total** | **~104** | **~17,600** |

---

## Visual Mockups

### Analytics Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Dashboard    Analytics                                    [Export] [Share]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ RISK OVERVIEW                                                         │  │
│  │ ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │ │            │ Complex │ Coverage │ Deps │ Churn │ Age │          │   │  │
│  │ │ features/  │  ████   │   ░░░░   │ ████ │  ░░░░ │ ░░░░│          │   │  │
│  │ │ components/│  ░░░░   │   ████   │ ░░░░ │  ████ │ ░░░░│          │   │  │
│  │ │ utils/     │  ░░░░   │   ░░░░   │ ░░░░ │  ░░░░ │ ████│          │   │  │
│  │ │ api/       │  ████   │   ████   │ ████ │  ░░░░ │ ░░░░│          │   │  │
│  │ └─────────────────────────────────────────────────────────────────┘   │  │
│  │ Legend: ████ Critical  ▓▓▓▓ High  ▒▒▒▒ Medium  ░░░░ Low              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐    │
│  │ TECHNICAL DEBT                 │  │ PREDICTION (90 days)           │    │
│  │                                │  │                                │    │
│  │     ┌─────────────────┐        │  │ Quality Score                  │    │
│  │    /   Complex (35%)   \       │  │ Current: 82.5%                 │    │
│  │   /  ┌───────────┐      \      │  │ Projected: 88.2%               │    │
│  │  │   │ feat (20%)│       │     │  │ Confidence: High (82%)         │    │
│  │  │   └───────────┘       │     │  │ ████████░░░░░░░░░░             │    │
│  │   \  Coverage (28%)     /      │  │                                │    │
│  │    \                   /       │  │ "On track to reach 90%         │    │
│  │     └─────────────────┘        │  │  target by June"               │    │
│  │                                │  │                                │    │
│  │ Total: 127 hours               │  │ [View Details] [Set Goal]      │    │
│  └────────────────────────────────┘  └────────────────────────────────┘    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ ACTIONABLE INSIGHTS                                         [View All]│  │
│  │ ┌─────────────────────────────┐ ┌─────────────────────────────┐      │  │
│  │ │ 🔴 HIGH                     │ │ 🟡 MEDIUM                   │      │  │
│  │ │ Improve Type Safety         │ │ Reduce Circular Deps        │      │  │
│  │ │                             │ │                             │      │  │
│  │ │ 5 files missing strict mode │ │ 3 dependency cycles found   │      │  │
│  │ │                             │ │                             │      │  │
│  │ │ Impact: +5-10%   Effort: 4h │ │ Impact: +3-5%   Effort: 8h  │      │  │
│  │ │ [View] [Dismiss]            │ │ [View] [Dismiss]            │      │  │
│  │ └─────────────────────────────┘ └─────────────────────────────┘      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Personalization Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Settings    Personalization                              [Reset] [Save]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current View: [My Dashboard ▼]                     [+ Create New View]     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ WIDGET LIBRARY                                                        │  │
│  │ ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │ │ Metrics                                                         │   │  │
│  │ │ ☑ Quality Score    ☑ Coverage Gauge    ☐ Issue Count           │   │  │
│  │ │ ☑ Health Summary   ☐ Trend Sparkline   ☐ Debt Score            │   │  │
│  │ ├─────────────────────────────────────────────────────────────────┤   │  │
│  │ │ Charts                                                          │   │  │
│  │ │ ☐ Quality Trend    ☑ Coverage Trend    ☐ Issues Trend          │   │  │
│  │ │ ☐ Dependency Graph ☐ Risk Heatmap      ☐ Debt Burndown         │   │  │
│  │ ├─────────────────────────────────────────────────────────────────┤   │  │
│  │ │ Insights                                                        │   │  │
│  │ │ ☑ Top Insights     ☐ Recent Changes    ☐ Predictions           │   │  │
│  │ └─────────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ DASHBOARD PREVIEW                                     [Edit Layout]   │  │
│  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │ │ Quality      │ │ Coverage     │ │ Health       │ │ Insights     │  │  │
│  │ │ Score        │ │ Gauge        │ │ Summary      │ │              │  │  │
│  │ │   87.3%      │ │   72.5%      │ │   Good       │ │   3 items    │  │  │
│  │ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │  │
│  │ ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │ │ Coverage Trend                                                  │  │  │
│  │ │     ╭─────────────────────────────────────────────────╮         │  │  │
│  │ │ 80% │                                    ╭────────────│         │  │  │
│  │ │ 70% │              ╭─────────────────────╯            │         │  │  │
│  │ │ 60% │─────────────╯                                   │         │  │  │
│  │ │     └─────────────────────────────────────────────────╯         │  │  │
│  │ │       Jan   Feb   Mar   Apr   May   Jun   Jul   Aug             │  │  │
│  │ └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 5A: Analytics (Weeks 1-3)

- [ ] Create extended color palette CSS variables
- [ ] Implement `RiskHeatmap` component
- [ ] Implement `DebtBurndownChart` component
- [ ] Implement `DebtSunburst` component
- [ ] Implement `PredictiveTrendCard` component
- [ ] Implement `InsightCard` component
- [ ] Create `/dashboard/analytics` route
- [ ] Add Web Worker for predictions
- [ ] Write unit tests (80% coverage)
- [ ] Accessibility audit (WCAG AA)

### Phase 5B: Personalization (Weeks 4-5)

- [ ] Install `react-grid-layout` and `framer-motion`
- [ ] Create Zustand store for dashboard state
- [ ] Implement `WidgetLibrary` component
- [ ] Implement `DashboardEditor` with drag-drop
- [ ] Implement `SavedViewsDropdown` component
- [ ] Implement `NotificationConfig` component
- [ ] Create `/dashboard/settings` routes
- [ ] Add animation patterns
- [ ] Write integration tests
- [ ] Performance audit (bundle size)

### Phase 5C: Team Features (Weeks 6-7)

- [ ] Implement permission model
- [ ] Create team API endpoints
- [ ] Implement `TeamDashboard` component
- [ ] Implement `SharedInsights` component
- [ ] Create `/dashboard/team` route
- [ ] Add real-time collaboration (optional)
- [ ] Write E2E tests
- [ ] Security audit

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User engagement with analytics | +30% | Page views, time on page |
| Report generation usage | 50+ reports/week | Export count |
| Dashboard customization adoption | 40% of users | Saved views created |
| Insight action rate | 25% | Insights acted upon |
| Page load time | < 2s | Lighthouse TTI |
| Accessibility score | 95+ | Lighthouse a11y |
| User satisfaction | 4.5/5 | Survey feedback |

---

**Document Version:** 1.0
**Created:** 2025-12-09
**Author:** Visual Storyteller Agent
**Related:** `PHASE5_IMPLEMENTATION_GUIDE.md`
