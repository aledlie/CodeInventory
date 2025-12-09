# Phase 4 Component Visual Mockups

**Purpose:** ASCII wireframes and detailed component specifications for Phase 4 features

---

## Table of Contents

1. [AI Insights Components](#ai-insights-components)
2. [Predictive Analytics Components](#predictive-analytics-components)
3. [Visualization Builder Components](#visualization-builder-components)
4. [Collaboration Components](#collaboration-components)
5. [Notification Components](#notification-components)
6. [Responsive Breakpoints](#responsive-breakpoints)

---

## AI Insights Components

### 1. Insights Summary Hero Card

**Desktop (1440px+)**
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   🤖 AI Insights                                       Confidence: ⭐⭐⭐⭐⭐    ║
║                                                                               ║
║   "Your codebase quality has improved by 18% over the past 30 days,          ║
║    driven primarily by increased test coverage and resolution of              ║
║    12 high-severity issues."                                                  ║
║                                                                               ║
║   ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  ║
║   │   Quality Score      │  │   Test Coverage      │  │   Open Issues    │  ║
║   │                      │  │                      │  │                  │  ║
║   │       87             │  │       78%            │  │       33         │  ║
║   │    ▲ +5 pts          │  │    ▲ +6%            │  │    ▼ -12         │  ║
║   │                      │  │                      │  │                  │  ║
║   │   Previous: 82       │  │   Previous: 72%      │  │   Previous: 45   │  ║
║   │   Target: 90         │  │   Target: 85%        │  │   Target: 20     │  ║
║   └──────────────────────┘  └──────────────────────┘  └──────────────────┘  ║
║                                                                               ║
║   [View Full Analysis]  [Share Report]  [Export PDF]                         ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Mobile (< 768px)**
```
┌─────────────────────────────────────────┐
│ 🤖 AI Insights          Confidence: ⭐⭐⭐⭐⭐│
├─────────────────────────────────────────┤
│ "Your codebase quality has improved     │
│  by 18% over the past 30 days..."       │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Quality Score                       │ │
│ │ 87    ▲ +5 pts                      │ │
│ │ Previous: 82  Target: 90            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Test Coverage                       │ │
│ │ 78%   ▲ +6%                         │ │
│ │ Previous: 72%  Target: 85%          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Open Issues                         │ │
│ │ 33    ▼ -12                         │ │
│ │ Previous: 45  Target: 20            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [View Analysis] [Share] [Export]        │
└─────────────────────────────────────────┘
```

**Component Props:**
```typescript
interface InsightsSummaryCardProps {
  summary: string;
  confidence: number; // 0-100
  metrics: Array<{
    name: string;
    current: number;
    previous: number;
    target: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  onViewAnalysis: () => void;
  onShare: () => void;
  onExport: () => void;
}
```

**Styling:**
- Background: Linear gradient from `#e6f2ff` to white
- Border: 2px solid `--color-primary-light`
- Border radius: 12px
- Padding: 32px
- Shadow: `--shadow-lg`
- Metric cards: White background, `--shadow-card`, hover lift 4px

---

### 2. Insight Card (Individual)

**Desktop**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎯 Improvement · High Priority                            Confidence: 85%   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Test Coverage Increased in Critical Files                                  │
│                                                                             │
│ You've added 23 new test cases covering authentication and payment         │
│ processing modules. This reduces risk of production bugs by an estimated   │
│ 35%.                                                                        │
│                                                                             │
│ 📊 Coverage Trend (30 days)                                                │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ 100% ┤                                                              │   │
│ │      │                                                     ╱╱      │   │
│ │  80% ┤                                              ╱╱╱╱╱╱         │   │
│ │      │                                       ╱╱╱╱╱╱                │   │
│ │  60% ┤                                ╱╱╱╱╱╱                       │   │
│ │      │                         ╱╱╱╱╱╱                              │   │
│ │  40% ┤                  ╱╱╱╱╱╱                                     │   │
│ │      │           ╱╱╱╱╱╱                                            │   │
│ │  20% ┤    ╱╱╱╱╱╱                                                   │   │
│ │      └───────────────────────────────────────────────────────────┘   │
│ │        Week 1    Week 2    Week 3    Week 4                          │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ 📁 Affected Files (3):                                                     │
│    • src/auth/login.ts         72% → 94%  (+22%)                          │
│    • src/payments/checkout.ts  65% → 89%  (+24%)                          │
│    • src/api/userService.ts    58% → 78%  (+20%)                          │
│                                                                             │
│ 💡 Recommendations:                                                        │
│    • Continue adding edge case tests                                       │
│    • Focus on error handling paths                                         │
│    • Add integration tests for payment flow                                │
│                                                                             │
│ [View Full Coverage Report]  [Acknowledge]  [Share with Team]              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Mobile**
```
┌─────────────────────────────────────────┐
│ 🎯 Improvement · High   Confidence: 85%│
├─────────────────────────────────────────┤
│ Test Coverage Increased                 │
│                                         │
│ Added 23 new test cases in auth and    │
│ payment modules. Reduces bug risk by    │
│ 35%.                                    │
│                                         │
│ 📊 Coverage Trend                       │
│ [Mini sparkline chart]                  │
│ 72% → 94%  (+22%)                       │
│                                         │
│ 📁 Files (3):                           │
│ • login.ts     72% → 94%                │
│ • checkout.ts  65% → 89%                │
│ • userService  58% → 78%                │
│                                         │
│ 💡 Recommendations (3)                  │
│ [Tap to expand]                         │
│                                         │
│ [View Report] [✓ Acknowledge]           │
└─────────────────────────────────────────┘
```

**Component Props:**
```typescript
interface InsightCardProps {
  insight: {
    id: string;
    type: 'improvement' | 'concern' | 'recommendation' | 'prediction';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    explanation: string;
    confidence: number;
    trendData?: Array<{ date: string; value: number }>;
    affectedFiles: Array<{
      path: string;
      previousValue: number;
      currentValue: number;
      change: number;
    }>;
    recommendations: string[];
    createdAt: string;
  };
  onViewReport: () => void;
  onAcknowledge: () => void;
  onShare: () => void;
}
```

**Color Mapping:**
```typescript
const insightColors = {
  improvement: {
    border: '--color-success',
    background: '--color-success-lightest',
    icon: '🎯',
  },
  concern: {
    border: '--color-error',
    background: '--color-error-lightest',
    icon: '⚠️',
  },
  recommendation: {
    border: '--color-info',
    background: '--color-info-lightest',
    icon: '💡',
  },
  prediction: {
    border: '#9c27b0',
    background: '#f3e5f5',
    icon: '🔮',
  },
};
```

---

### 3. Insights Category Tabs

**Desktop**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│ │ ✅ Improvements│ │ ⚠️ Concerns  │ │ 💡 Recommendations │ │ 🔮 Predictions │ │
│ │    (8)       │ │    (3)       │ │    (5)         │ │    (2)       │       │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Mobile (Scrollable)**
```
┌─────────────────────────────────────────┐
│ ← ✅ Improvements (8)  ⚠️ Concerns → │
└─────────────────────────────────────────┘
```

**Active State:**
- Bold text
- Underline with 3px border in category color
- Background: category color at 10% opacity

---

## Predictive Analytics Components

### 1. Prediction Timeline Chart

**Desktop**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Quality Score Prediction                                90-day forecast      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 100 ┤                                          ╱ ╱ ╱                        │
│     │                                      ╱ ╱ ╱                            │
│  90 ┤  ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╱ ╱ ╱  🎯 Goal (90)                   │
│     │                                ╱ ╱ ╱                                   │
│  80 ┤                            ╱ ╱ ╱ ╱                                     │
│     │                        ╱ ╱ ╱ ╱ ╱                                       │
│  70 ┤                    ╱ ╱ ╱ ╱ ╱                                           │
│     │                ╱ ╱ ╱ ╱ ╱                                               │
│  60 ┤────────────────────┐                                                  │
│     │ Historical         │ Today  Predicted (90% confidence)                │
│     └────────────────────┴───────────────────────────────────────────────   │
│      Dec    Jan    Feb    Mar    Apr                                        │
│                                                                              │
│  📊 Prediction Summary:                                                      │
│      • Current: 87 points                                                    │
│      • Predicted (30d): 89 points (+2)                                       │
│      • Predicted (90d): 93 points (+6)                                       │
│      • Goal achievable: March 15 (76 days)                                   │
│                                                                              │
│  ⚙️  Adjust Scenario:                                                       │
│      Coverage Growth: [▓▓▓▓░░░░░░] 5%/month                                 │
│      Issue Resolution: [▓▓▓▓▓▓░░░░] 10/week                                 │
│                                                                              │
│  [Download Data] [Share Prediction] [Set Alert]                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Mobile**
```
┌─────────────────────────────────────────┐
│ Quality Score Prediction                │
│ 90-day forecast                         │
├─────────────────────────────────────────┤
│                                         │
│ [Simplified chart view]                 │
│                                         │
│ Current: 87                             │
│ 30d: 89 (+2)                            │
│ 90d: 93 (+6)                            │
│                                         │
│ 🎯 Goal (90): Achievable by Mar 15     │
│                                         │
│ ⚙️ Scenario                             │
│ Coverage: 5%/mo  [Adjust]              │
│ Issues: 10/wk    [Adjust]              │
│                                         │
│ [Data] [Share] [Alert]                  │
└─────────────────────────────────────────┘
```

**Component Props:**
```typescript
interface PredictionTimelineProps {
  metric: string;
  historicalData: Array<{ date: string; value: number }>;
  predictedData: Array<{ date: string; value: number }>;
  confidenceBands: {
    upper: Array<{ date: string; value: number }>;
    lower: Array<{ date: string; value: number }>;
  };
  goalValue?: number;
  goalDate?: string;
  scenarios: {
    coverageGrowthRate: number;
    issueResolutionRate: number;
  };
  onScenarioChange: (scenarios: any) => void;
}
```

**Chart.js Configuration:**
```typescript
const chartConfig = {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Historical',
        data: historicalData,
        borderColor: '--color-primary',
        borderWidth: 2,
        borderDash: [],
        pointRadius: 3,
        fill: false,
      },
      {
        label: 'Predicted',
        data: predictedData,
        borderColor: '--color-primary',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 3,
        fill: false,
      },
      {
        label: 'Confidence Band',
        data: confidenceBands.upper,
        backgroundColor: 'rgba(0, 102, 204, 0.1)',
        borderWidth: 0,
        fill: '+1',
      },
      {
        label: '',
        data: confidenceBands.lower,
        backgroundColor: 'rgba(0, 102, 204, 0.1)',
        borderWidth: 0,
        fill: false,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => `Date: ${context[0].label}`,
          label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
        },
      },
      annotation: {
        annotations: {
          goal: {
            type: 'line',
            yMin: goalValue,
            yMax: goalValue,
            borderColor: '--color-success',
            borderWidth: 2,
            borderDash: [10, 5],
            label: {
              content: `Goal: ${goalValue}`,
              enabled: true,
            },
          },
        },
      },
    },
  },
};
```

---

### 2. Risk Assessment Matrix

**Desktop**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Risk Assessment Matrix                                       Last updated: Now│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ High Impact     │  ⚠️ High Risk          │  🔴 Critical Risk                │
│                 │                        │                                  │
│                 │      ●                 │        ●                         │
│                 │   Outdated             │    Security Gap                  │
│                 │   Dependencies         │    (OWASP #3)                    │
│ ────────────────┼────────────────────────┼──────────────────────────────── │
│ Medium Impact   │  📋 Monitor            │  ⚠️ High Risk                    │
│                 │                        │                                  │
│                 │        ●               │      ●                           │
│                 │   Test Debt            │  Technical Debt                  │
│                 │   (200 hrs)            │  (80 hrs)                        │
│ ────────────────┼────────────────────────┼──────────────────────────────── │
│ Low Impact      │  ✅ Low Risk           │  📋 Monitor                      │
│                 │                        │                                  │
│                 │    ●                   │        ●                         │
│                 │ Minor Linting          │   Unused Imports                 │
│                 │ Issues                 │                                  │
│                 └────────────────────────┴──────────────────────────────── │
│                  Low Probability             High Probability               │
│                                                                              │
│  Legend:                                                                     │
│  ● Size = Estimated impact (hours)         Color = Risk level               │
│  🔴 Critical  ⚠️ High  📋 Medium  ✅ Low                                     │
│                                                                              │
│  [View All Risks (12)] [Export Report] [Set Alert Rules]                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Mobile**
```
┌─────────────────────────────────────────┐
│ Risk Matrix                             │
├─────────────────────────────────────────┤
│ 🔴 Critical (1)                         │
│ • Security Gap (High impact, High prob) │
│   85% confidence · 40 hrs to fix        │
│                                         │
│ ⚠️ High (2)                             │
│ • Technical Debt (Med impact, High)     │
│ • Outdated Deps (High impact, Med)      │
│                                         │
│ 📋 Medium (4)                           │
│ [Show more]                             │
│                                         │
│ ✅ Low (5)                              │
│ [Show more]                             │
│                                         │
│ [View All] [Export] [Alerts]            │
└─────────────────────────────────────────┘
```

**Component Props:**
```typescript
interface RiskMatrixProps {
  risks: Array<{
    id: string;
    name: string;
    description: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    probability: 'low' | 'medium' | 'high';
    estimatedEffort: number; // hours
    confidence: number; // 0-100
    category: 'quality' | 'coverage' | 'dependency' | 'security';
    mitigation: string;
  }>;
  onRiskClick: (riskId: string) => void;
}
```

**Bubble Calculation:**
```typescript
function calculateBubblePosition(impact, probability) {
  const impactMap = { low: 16, medium: 50, high: 84, critical: 100 };
  const probMap = { low: 16, medium: 50, high: 84 };

  return {
    x: probMap[probability],
    y: 100 - impactMap[impact],
  };
}

function calculateBubbleSize(estimatedEffort) {
  const minSize = 30;
  const maxSize = 80;
  const normalizedSize = Math.min(estimatedEffort / 100, 1);
  return minSize + normalizedSize * (maxSize - minSize);
}

function calculateBubbleColor(impact) {
  const colorMap = {
    low: '--color-success',
    medium: '--color-warning',
    high: '--color-error',
    critical: '#dc3545',
  };
  return colorMap[impact];
}
```

---

## Visualization Builder Components

### 1. Visualization Builder Interface

**Desktop**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🎨 Custom Visualization Builder                              [Save] [Export] │
├────────────┬─────────────────────────────────────────────────────────────────┤
│ Metrics    │                                                                 │
│            │  ┌───────────────────────────────────────────────────────────┐ │
│ ● Quality  │  │                                                           │ │
│ ● Coverage │  │      Drop metrics and chart type here                    │ │
│ ● Issues   │  │                                                           │ │
│ ● Deps     │  │                                                           │ │
│ ● Files    │  │                                                           │ │
│            │  │                                                           │ │
│ Chart Type │  │                                                           │ │
│ ┌────────┐ │  │                                                           │ │
│ │ 📈 Line│ │  └───────────────────────────────────────────────────────────┘ │
│ └────────┘ │                                                                 │
│ ┌────────┐ │  Preview will appear after you add metrics                     │
│ │ 📊 Bar │ │                                                                 │
│ └────────┘ │                                                                 │
│ ┌────────┐ │                                                                 │
│ │ 🥧 Pie │ │                                                                 │
│ └────────┘ │                                                                 │
│ ┌────────┐ │                                                                 │
│ │ 📉 Area│ │                                                                 │
│ └────────┘ │                                                                 │
│            │                                                                 │
│ Filters    │                                                                 │
│ Date: 30d ▼│                                                                 │
│ Files: All▼│                                                                 │
│            │                                                                 │
│ Style      │                                                                 │
│ Colors: ■▼ │                                                                 │
│ Grid: ☑    │                                                                 │
│ Legend: ☑  │                                                                 │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

**With Chart Created:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🎨 Quality Trend (30 days)                          [Save] [⬇️ Export] [×]   │
├────────────┬─────────────────────────────────────────────────────────────────┤
│ Metrics    │                                                                 │
│            │  ┌───────────────────────────────────────────────────────────┐ │
│ ☑ Quality  │  │ 100 ┤                                                     │ │
│ ☐ Coverage │  │     │                                             ╱       │ │
│ ☐ Issues   │  │  80 ┤                                         ╱╱╱         │ │
│ ☐ Deps     │  │     │                                    ╱╱╱╱             │ │
│            │  │  60 ┤                               ╱╱╱╱                  │ │
│ Chart Type │  │     │                          ╱╱╱╱                       │ │
│ ☑ 📈 Line  │  │  40 ┤                     ╱╱╱╱                            │ │
│ ☐ 📊 Bar   │  │     │                ╱╱╱╱                                 │ │
│ ☐ 🥧 Pie   │  │  20 ┤           ╱╱╱╱                                      │ │
│ ☐ 📉 Area  │  │     └──────────────────────────────────────────────────  │ │
│            │  │      Week 1    Week 2    Week 3    Week 4                │ │
│ Filters    │  └───────────────────────────────────────────────────────────┘ │
│ Date: 30d ▼│                                                                 │
│ Files: All▼│  Drag to resize chart · Click axis labels to edit              │
│            │                                                                 │
│ Style      │  Export options:                                                │
│ Colors: ■▼ │  [PNG Image] [SVG Vector] [CSV Data] [JSON Config]             │
│ Grid: ☑    │                                                                 │
│ Legend: ☑  │                                                                 │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

**Mobile**
```
┌─────────────────────────────────────────┐
│ 🎨 Visualization Builder                │
├─────────────────────────────────────────┤
│ Step 1: Select Metric                   │
│ ○ Quality Score                         │
│ ○ Test Coverage                         │
│ ○ Open Issues                           │
│ ○ Dependencies                          │
│                                         │
│ Step 2: Select Chart                    │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│ │📈  │ │📊  │ │🥧  │ │📉  │           │
│ │Line│ │Bar │ │Pie │ │Area│           │
│ └────┘ └────┘ └────┘ └────┘           │
│                                         │
│ Step 3: Filters                         │
│ Date: [30 days ▼]                       │
│ Files: [All files ▼]                    │
│                                         │
│ [Create Chart]                          │
└─────────────────────────────────────────┘
```

---

### 2. Quick Chart Templates

**Desktop Grid**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Quick Start Templates                                    [View All Templates]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│ │ Quality Trend   │  │ Coverage by File│  │ Issues by Type  │            │
│ │                 │  │                 │  │                 │            │
│ │    [📈]         │  │    [📊]         │  │    [🥧]         │            │
│ │                 │  │                 │  │                 │            │
│ │ Line chart      │  │ Bar chart       │  │ Pie chart       │            │
│ │ showing quality │  │ showing test    │  │ showing issue   │            │
│ │ score over time │  │ coverage by     │  │ distribution    │            │
│ │                 │  │ file            │  │                 │            │
│ │                 │  │                 │  │                 │            │
│ │ [Use Template]  │  │ [Use Template]  │  │ [Use Template]  │            │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│ │ Dependency Graph│  │ Trend Comparison│  │ Multi-Metric    │            │
│ │                 │  │                 │  │                 │            │
│ │    [🕸️]         │  │    [📈📉]       │  │    [📊📈🥧]     │            │
│ │                 │  │                 │  │                 │            │
│ │ Network viz     │  │ Multiple lines  │  │ Combined chart  │            │
│ │ of module       │  │ comparing       │  │ showing all     │            │
│ │ dependencies    │  │ metrics         │  │ key metrics     │            │
│ │                 │  │                 │  │                 │            │
│ │ [Use Template]  │  │ [Use Template]  │  │ [Use Template]  │            │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Collaboration Components

### 1. Activity Feed

**Desktop**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🏃 Team Activity                                          Filter: All ▼  🔍  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──┐  @alice assigned issue "Unused imports" to @bob                        │
│ │AB│  📁 src/utils/helpers.ts · 2 hours ago                                 │
│ └──┘  [View Issue]                                                          │
│                                                                              │
│ ┌──┐  @bob commented on "Circular dependency detected"                      │
│ │CD│  "I'll refactor this module to break the cycle. Should be done by EOD."│
│ └──┘  👍 2  ❤️ 1 · 3 hours ago                                              │
│       [View Thread (3 replies)]                                              │
│                                                                              │
│ ┌──┐  @charlie resolved 5 issues in authentication module                   │
│ │EF│  Quality score increased by 3 points · 5 hours ago                     │
│ └──┘  🎉 Great work!                                                        │
│       [View Changes]                                                         │
│                                                                              │
│ ┌──┐  @alice set sprint goal: "Reach 85% test coverage"                    │
│ │AB│  Due: March 15, 2025 · 1 day ago                                       │
│ └──┘  Current progress: 78% (92% complete)                                  │
│       [View Goal Details]                                                    │
│                                                                              │
│ ┌──┐  System: New critical issue detected                                   │
│ │🤖│  "SQL injection vulnerability in auth module"                          │
│ └──┘  Severity: Critical · Just now                                         │
│       [Assign to Team Member]                                                │
│                                                                              │
│                       [Load More Activity (24 older items)]                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Mobile**
```
┌─────────────────────────────────────────┐
│ 🏃 Activity          Filter: All ▼  🔍  │
├─────────────────────────────────────────┤
│ ┌──┐ @alice → @bob                     │
│ │AB│ "Unused imports"                  │
│ └──┘ 2h ago                            │
│                                         │
│ ┌──┐ @bob commented                    │
│ │CD│ "I'll refactor this..."           │
│ └──┘ 👍 2  ❤️ 1 · 3h ago               │
│                                         │
│ ┌──┐ @charlie resolved 5               │
│ │EF│ Quality +3 pts                    │
│ └──┘ 🎉 · 5h ago                       │
│                                         │
│ ┌──┐ @alice set goal                   │
│ │AB│ "85% coverage"                    │
│ └──┘ 1d ago · 92% done                 │
│                                         │
│ [Load More (24)]                        │
└─────────────────────────────────────────┘
```

---

### 2. Issue Assignment Board

**Desktop**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Team Members                                              [Add Member]  ⚙️   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│ │    ┌────┐    │  │    ┌────┐    │  │    ┌────┐    │  │      ?        │ │
│ │    │ AB │    │  │    │ CD │    │  │    │ EF │    │  │               │ │
│ │    └────┘    │  │    └────┘    │  │    └────┘    │  │               │ │
│ │    Alice     │  │     Bob      │  │   Charlie    │  │  Unassigned   │ │
│ │ Developer    │  │  Tech Lead   │  │     QA       │  │               │ │
│ │              │  │              │  │              │  │               │ │
│ │  🎯 3 issues  │  │  🎯 7 issues  │  │  🎯 2 issues  │  │ 🎯 12 issues   │ │
│ │  📊 75% done  │  │  📊 60% done  │  │  📊 90% done  │  │               │ │
│ │              │  │              │  │              │  │               │ │
│ │ [View Board] │  │ [View Board] │  │ [View Board] │  │  [View All]   │ │
│ └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                   ⬇ Drag issues here
┌──────────────────────────────────────────────────────────────────────────────┐
│ Unassigned Issues (12)                                    Priority: All ▼    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
││ 🔴 Critical: Memory leak in data processor                               ││
││ src/processors/data.ts:145 · Created 2 days ago by System                ││
││ Estimated: 8 hours · Priority: Critical                                  ││
││ [Assign to... ▼]  [View Details]                                         ││
│└──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
││ 🟠 High: Duplicate code in validation logic                              ││
││ src/validators/input.ts:67 · Created 1 week ago by @alice                ││
││ Estimated: 4 hours · Priority: High                                      ││
││ [Assign to... ▼]  [View Details]                                         ││
│└──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ [Show 10 more issues]                                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Comment Thread

**Desktop**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 💬 Comments (5)                                               [Sort: Newest] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──┐  Alice Brown (Developer)                              2 hours ago      │
│ │AB│  This circular dependency is causing build issues in production.       │
│ └──┘  We should prioritize fixing this ASAP. @bob can you take a look?      │
│       👍 3  ❤️ 1                                                             │
│       [Reply] [Edit] [Delete]                                                │
│                                                                              │
│    ┌──┐  Bob Chen (Tech Lead)                            1 hour ago         │
│    │CD│  @alice Good catch! I'll create a refactoring plan by EOD.         │
│    └──┘  The issue is in the service layer - we're importing utils that    │
│          import services. I'll break this by creating a shared types module.│
│          👍 2                                                                 │
│          [Reply] [Edit] [Delete]                                             │
│                                                                              │
│       ┌──┐  Alice Brown                                  30 minutes ago     │
│       │AB│  Sounds great! Let me know if you need help with testing.       │
│       └──┘  👍 1                                                            │
│             [Reply] [Edit] [Delete]                                          │
│                                                                              │
│ ┌──┐  Charlie Davis (QA)                                 10 minutes ago     │
│ │EF│  I've added this to our regression test suite. Will verify once fixed.│
│ └──┘  [Reply] [Edit] [Delete]                                               │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
││ 💬 Add a comment (Markdown supported)                                    ││
││ ┌──────────────────────────────────────────────────────────────────────┐ ││
│││                                                                        │ ││
│││ [Type your comment here...]                                            │ ││
│││                                                                        │ ││
││└──────────────────────────────────────────────────────────────────────┘ ││
││ [Bold] [Italic] [Code] [Link] [Mention]            [Cancel] [Comment]  ││
│└──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Mobile**
```
┌─────────────────────────────────────────┐
│ 💬 Comments (5)         Sort: Newest ▼  │
├─────────────────────────────────────────┤
│ ┌──┐ Alice · 2h ago                     │
│ │AB│ Circular dependency causing        │
│ └──┘ issues. @bob can you look?         │
│      👍 3  ❤️ 1  [Reply]                │
│                                         │
│   ┌──┐ Bob · 1h ago                     │
│   │CD│ @alice Will refactor by EOD      │
│   └──┘ 👍 2  [Reply]                    │
│                                         │
│     ┌──┐ Alice · 30m ago                │
│     │AB│ Great! Let me know.            │
│     └──┘ 👍 1  [Reply]                  │
│                                         │
│ ┌──┐ Charlie · 10m ago                  │
│ │EF│ Added to regression tests          │
│ └──┘ [Reply]                            │
│                                         │
│ [Add comment...]                        │
└─────────────────────────────────────────┘
```

---

## Notification Components

### 1. Notification Bell & Badge

**States:**
```
No notifications:
  🔔

New notifications (1-9):
  🔔 (3)

New notifications (10+):
  🔔 (10+)

Critical alert (pulse):
  🔔 (!) ← pulsing red
```

### 2. Notification Dropdown

**Desktop**
```
┌──────────────────────────────────────────────────────────────────┐
│ 🔔 Notifications (3 unread)                        ⚙️ Settings    │
├──────────────────────────────────────────────────────────────────┤
│ All | @Mentions | 🚨 Alerts | 📰 Updates                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ● 🚨 New critical issue detected                                │
│     "SQL injection vulnerability in authentication module"      │
│     2 minutes ago                                                │
│     [View Issue] [Assign] [Dismiss]                              │
│                                                                  │
│ ● 💬 @bob mentioned you in a comment                            │
│     "Can you review this refactoring?"                           │
│     1 hour ago                                                   │
│     [View Comment] [Reply] [Dismiss]                             │
│                                                                  │
│ ○ ✅ Sprint goal achieved: "85% test coverage"                  │
│     "Congratulations team! 🎉"                                   │
│     3 hours ago                                                  │
│     [View Report] [Share] [Dismiss]                              │
│                                                                  │
│ ○ 📰 Weekly summary report available                            │
│     "Your code quality improved by 12% this week"                │
│     1 day ago                                                    │
│     [View Report] [Dismiss]                                      │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ [Mark All as Read]                      [View All Notifications] │
└──────────────────────────────────────────────────────────────────┘
```

**Mobile**
```
┌─────────────────────────────────────────┐
│ 🔔 Notifications (3)            ⚙️       │
├─────────────────────────────────────────┤
│ All | @Me | 🚨 | 📰                     │
├─────────────────────────────────────────┤
│ ● 🚨 Critical issue                     │
│   "SQL injection..."                    │
│   2m ago · [View] [✓]                   │
│                                         │
│ ● 💬 @bob mentioned you                 │
│   "Can you review..."                   │
│   1h ago · [View] [✓]                   │
│                                         │
│ ○ ✅ Sprint goal hit!                   │
│   "85% coverage"                        │
│   3h ago · [View] [✓]                   │
│                                         │
│ [✓ All] [View All (24)]                 │
└─────────────────────────────────────────┘
```

---

## Responsive Breakpoints

### Breakpoint Strategy

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| **xs** | < 576px | Single column, stacked cards, hamburger menu |
| **sm** | 576-767px | 2-column grids, collapsible sidebar |
| **md** | 768-991px | 3-column grids, visible sidebar |
| **lg** | 992-1199px | 4-column grids, expanded sidebar |
| **xl** | ≥ 1200px | Full desktop layout, multi-panel views |

### Responsive Component Behavior

**Insights Summary Card:**
- **xs/sm:** Vertical stack, full-width metric cards
- **md:** 2-column grid for metrics
- **lg/xl:** 3-column grid for metrics

**Prediction Chart:**
- **xs/sm:** Simplified chart, key points only
- **md:** Full chart with reduced annotations
- **lg/xl:** Full chart with all features

**Risk Matrix:**
- **xs/sm:** List view with risk cards
- **md:** 2×2 simplified matrix
- **lg/xl:** Full 3×3 matrix with bubbles

**Visualization Builder:**
- **xs/sm:** Wizard-style steps (metric → chart → filters)
- **md:** Side panel + canvas (80/20 split)
- **lg/xl:** Full sidebar + canvas (25/75 split)

**Activity Feed:**
- **xs/sm:** Compact list, avatars only
- **md:** Expanded cards with content preview
- **lg/xl:** Full cards with all actions

---

## Accessibility Features

### Keyboard Navigation

All components support full keyboard navigation:

- **Tab:** Navigate between interactive elements
- **Shift+Tab:** Navigate backwards
- **Enter/Space:** Activate buttons, expand cards
- **Arrow keys:** Navigate chart data points, risk bubbles
- **Escape:** Close modals, cancel actions
- **Home/End:** Jump to start/end of lists

### Screen Reader Support

Every component has appropriate ARIA attributes:

```html
<!-- Insight Card -->
<article
  role="article"
  aria-labelledby="insight-title-123"
  aria-describedby="insight-desc-123"
  tabindex="0"
>
  <h3 id="insight-title-123">Test Coverage Increased</h3>
  <p id="insight-desc-123">
    High priority improvement. Confidence 85%.
    Coverage increased from 72% to 78%.
  </p>
</article>

<!-- Risk Bubble -->
<button
  role="button"
  aria-label="Critical risk: Security Gap. High impact, high probability. 85% confidence. Click to view details."
  aria-pressed="false"
  tabindex="0"
>
  Security Gap
</button>

<!-- Prediction Chart -->
<figure
  role="img"
  aria-label="Quality score prediction. Historical data shows increase from 70 to 87 over past 90 days. Predicted to reach 93 in next 90 days with 90% confidence."
>
  <canvas id="prediction-chart" />
  <table className="sr-only">
    <!-- Data table fallback -->
  </table>
</figure>
```

### Focus Indicators

All interactive elements have visible focus indicators:

```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* High contrast for critical elements */
.risk-bubble:focus-visible {
  outline-width: 3px;
  outline-color: var(--color-text-primary);
  box-shadow: 0 0 0 5px rgba(0, 102, 204, 0.3);
}
```

---

## Animation & Motion

### Animation Principles

1. **Purposeful:** Animations guide attention and provide feedback
2. **Fast:** Most animations <300ms for responsiveness
3. **Respectful:** Honor `prefers-reduced-motion` setting
4. **Smooth:** Use CSS transforms for 60fps performance

### Key Animations

**Card Entrance:**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.insight-card {
  animation: fadeInUp 300ms ease-out;
}
```

**Loading Skeleton:**
```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

**Notification Pulse:**
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.notification-badge--critical {
  animation: pulse 2s infinite;
}
```

**Respect Reduced Motion:**
```css
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

---

## Print Styles

All Phase 4 components support print-friendly layouts:

```css
@media print {
  /* Hide interactive elements */
  .notification-bell,
  .action-buttons,
  .drag-handle {
    display: none;
  }

  /* Expand collapsed sections */
  .insight-card,
  .activity-item {
    page-break-inside: avoid;
  }

  /* Simplify colors for print */
  .insight-card {
    border: 1px solid #000;
    background: #fff;
  }

  /* Show URLs for links */
  a[href]:after {
    content: " (" attr(href) ")";
  }
}
```

---

## Component Library Summary

Total new components for Phase 4:

| Category | Components | Total Files |
|----------|------------|-------------|
| AI Insights | 6 components | 8 files |
| Predictions | 5 components | 7 files |
| Visualizations | 7 components | 10 files |
| Collaboration | 8 components | 12 files |
| Notifications | 4 components | 6 files |
| **Total** | **30 components** | **43 files** |

---

**Document Version:** 1.0
**Created:** 2025-12-09
**Status:** DESIGN SPECIFICATION
**Next Action:** Begin Phase 4A implementation with these mockups as reference
