# Phase 4 Quick Reference

**TL;DR: AI-powered insights, predictions, custom visualizations, and team collaboration**

---

## Quick Start (5 Minutes)

### 1. Review Phase 4 Visual Guide
Read `/Users/alyshialedlie/code/Inventory/PHASE4_VISUAL_STORYTELLING_GUIDE.md` (20,000+ words)

### 2. Install New Dependencies

```bash
# AI & ML libraries (Python)
pip install scikit-learn statsmodels prophet anthropic

# Drag & drop (React)
npm install react-dnd react-dnd-html5-backend

# WebSockets (React)
npm install socket.io-client

# Backend (if implementing collaboration)
npm install express sqlite3 jsonwebtoken bcrypt
```

### 3. Environment Variables

```bash
# Add to .env
ANTHROPIC_API_KEY=your_claude_api_key_here
ENABLE_AI_INSIGHTS=true
ENABLE_PREDICTIONS=true
ENABLE_COLLABORATION=false  # Requires backend setup
```

---

## 5 Core Features

| Feature | What It Does | User Benefit |
|---------|--------------|--------------|
| **1. AI Insights** | Natural language summaries of code health | "Your quality improved because..." |
| **2. Predictions** | Forecast quality trends 90 days ahead | "You'll hit 90% quality by March" |
| **3. Custom Charts** | Drag-and-drop visualization builder | Build your own metrics dashboard |
| **4. Collaboration** | Assign issues, comment, set goals | Work together on code quality |
| **5. Smart Notifications** | Real-time alerts for critical issues | Stay informed, never overwhelmed |

---

## File Structure (Phase 4)

```
src/
├── analyzers/                    # Python analyzers (NEW)
│   ├── insights_analyzer.py      # AI insights generation
│   ├── predictions_analyzer.py   # Forecasting algorithms
│   └── risks_analyzer.py         # Risk assessment
├── features/dashboard/
│   ├── components/               # React components (NEW)
│   │   ├── insights/
│   │   │   ├── InsightsPage.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   └── InsightsCategoryTabs.tsx
│   │   ├── predictions/
│   │   │   ├── PredictiveDashboard.tsx
│   │   │   ├── PredictionChart.tsx
│   │   │   └── RiskMatrix.tsx
│   │   ├── visualizations/
│   │   │   ├── VisualizationBuilder.tsx
│   │   │   ├── BuilderSidebar.tsx
│   │   │   └── BuilderCanvas.tsx
│   │   ├── collaboration/
│   │   │   ├── CollaborationHub.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── IssueAssignments.tsx
│   │   │   └── CommentThread.tsx
│   │   └── notifications/
│   │       ├── NotificationCenter.tsx
│   │       ├── NotificationBell.tsx
│   │       └── NotificationDropdown.tsx
│   ├── api/                      # API modules (NEW)
│   │   ├── insightsApi.ts
│   │   ├── predictionsApi.ts
│   │   ├── visualizationApi.ts
│   │   └── collaborationApi.ts
│   ├── hooks/                    # React hooks (NEW)
│   │   ├── useInsights.ts
│   │   ├── usePredictions.ts
│   │   ├── useVisualization.ts
│   │   ├── useCollaboration.ts
│   │   └── useNotifications.ts
│   ├── types/                    # TypeScript types (NEW)
│   │   ├── insights.ts
│   │   ├── predictions.ts
│   │   ├── visualizations.ts
│   │   └── collaboration.ts
│   └── utils/                    # Utility functions (NEW)
│       ├── predictionAlgorithms.ts
│       ├── riskCalculations.ts
│       └── chartExport.ts
└── routes/dashboard/             # Routes (NEW)
    ├── insights/index.tsx
    ├── predictions/index.tsx
    ├── visualizations/index.tsx
    └── collaboration/index.tsx

public/data/                      # Data files (NEW)
├── insights/
│   └── insights_latest.json
├── predictions/
│   └── predictions_latest.json
└── risks/
    └── risks_latest.json
```

---

## Key API Functions

### Insights API

```typescript
import { insightsApi } from '../api/insightsApi';

// Get all insights
const insights = await insightsApi.getInsights();

// Get insights by category
const improvements = await insightsApi.getInsights('improvement');

// Acknowledge insight
await insightsApi.acknowledgeInsight('insight-123');

// Regenerate insights
await insightsApi.regenerateInsights();
```

### Predictions API

```typescript
import { predictionsApi } from '../api/predictionsApi';

// Get prediction for quality score (90 days ahead)
const prediction = await predictionsApi.getPrediction('qualityScore', 90);

// Get risk assessment
const risks = await predictionsApi.getRisks();

// Update scenario
const newPrediction = await predictionsApi.updateScenario({
  coverageGrowthRate: 0.05,  // 5% per month
  issueResolutionRate: 10,   // 10 per week
});
```

### Visualization API

```typescript
import { visualizationApi } from '../api/visualizationApi';

// Save custom visualization
const vizId = await visualizationApi.saveVisualization({
  title: 'Quality Trend',
  chartType: 'line',
  metrics: ['qualityScore'],
  dateRange: '30d',
});

// Load saved visualizations
const vizList = await visualizationApi.getVisualizations();

// Export visualization
const blob = await visualizationApi.exportVisualization('viz-123', 'png');
```

### Collaboration API

```typescript
import { collaborationApi } from '../api/collaborationApi';

// Get activity feed
const activity = await collaborationApi.getActivity({
  type: 'all',
  limit: 20,
});

// Assign issue
await collaborationApi.assignIssue('issue-123', 'user-456');

// Add comment
await collaborationApi.addComment('issue-123', 'Working on this now');

// Set sprint goal
await collaborationApi.setGoal({
  title: 'Reach 85% coverage',
  target: { metric: 'coverage', current: 72, target: 85 },
  endDate: '2025-03-15',
});
```

---

## React Hooks Pattern

### useInsights Hook

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';
import { insightsApi } from '../api/insightsApi';

export function useInsights(category?: InsightType) {
  return useSuspenseQuery({
    queryKey: ['insights', category],
    queryFn: () => insightsApi.getInsights(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage in component
function InsightsPage() {
  const { data: insights } = useInsights('improvement');

  return (
    <Box>
      {insights.map(insight => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </Box>
  );
}
```

### usePredictions Hook

```typescript
export function usePredictions(metric: string, horizon: number = 90) {
  return useSuspenseQuery({
    queryKey: ['predictions', metric, horizon],
    queryFn: () => predictionsApi.getPrediction(metric, horizon),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Usage
function PredictiveDashboard() {
  const { data: qualityPrediction } = usePredictions('qualityScore', 90);

  return <PredictionChart data={qualityPrediction} />;
}
```

---

## Python Analysis Pattern

### Insights Analyzer

```python
# src/analyzers/insights_analyzer.py
import anthropic
import os

def analyze_trends(quality_history, coverage_history, dependency_history):
    """
    Analyze historical data to identify trends and patterns.

    Returns list of insights with type, severity, confidence.
    """
    insights = []

    # Example: Detect quality improvement
    if quality_history[-1] > quality_history[0]:
        improvement_percent = (
            (quality_history[-1] - quality_history[0]) / quality_history[0] * 100
        )
        insights.append({
            'type': 'improvement',
            'severity': 'high' if improvement_percent > 10 else 'medium',
            'title': f'Quality improved by {improvement_percent:.1f}%',
            'confidence': 85,
            'metrics': [
                {
                    'name': 'Quality Score',
                    'current': quality_history[-1],
                    'previous': quality_history[0],
                    'change': quality_history[-1] - quality_history[0],
                }
            ],
        })

    return insights


def generate_summary(insights):
    """
    Use Claude API to generate natural language summary.
    """
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    prompt = f"""
    Analyze these code quality insights and write a 2-3 sentence summary
    for a developer explaining what's happening with their codebase:

    {json.dumps(insights, indent=2)}

    Be concise, actionable, and encouraging.
    """

    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )

    return message.content[0].text
```

### Predictions Analyzer

```python
# src/analyzers/predictions_analyzer.py
from sklearn.linear_model import LinearRegression
import numpy as np

def predict_quality_score(historical_data, horizon_days=90):
    """
    Forecast quality score using linear regression.

    Args:
        historical_data: List of (timestamp, score) tuples
        horizon_days: Days to forecast ahead

    Returns:
        PredictionData with historical, predicted, confidence bands
    """
    # Prepare data
    X = np.array([i for i in range(len(historical_data))]).reshape(-1, 1)
    y = np.array([score for _, score in historical_data])

    # Train model
    model = LinearRegression()
    model.fit(X, y)

    # Predict future
    future_X = np.array([
        len(historical_data) + i for i in range(horizon_days)
    ]).reshape(-1, 1)
    predictions = model.predict(future_X)

    # Calculate confidence bands (simple ±5 points)
    confidence_lower = predictions - 5
    confidence_upper = predictions + 5

    return {
        'metric': 'qualityScore',
        'historical': [
            {'date': date, 'value': score}
            for date, score in historical_data
        ],
        'predicted': [
            {'date': f'day_{i}', 'value': float(pred)}
            for i, pred in enumerate(predictions)
        ],
        'confidenceBands': {
            'lower': [
                {'date': f'day_{i}', 'value': float(val)}
                for i, val in enumerate(confidence_lower)
            ],
            'upper': [
                {'date': f'day_{i}', 'value': float(val)}
                for i, val in enumerate(confidence_upper)
            ],
        },
        'confidence': 85,
        'horizon': horizon_days,
        'methodology': 'linear-regression',
    }
```

---

## Component Patterns

### Insight Card Pattern

```typescript
interface InsightCardProps {
  insight: AIInsight;
  onAcknowledge?: (id: string) => void;
}

export function InsightCard({ insight, onAcknowledge }: InsightCardProps) {
  const severityColor = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success',
  }[insight.severity];

  return (
    <Card
      sx={{
        borderLeft: 4,
        borderLeftColor: `${severityColor}.main`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <InsightIcon type={insight.type} />
          <Typography variant="h6">{insight.title}</Typography>
          <Chip
            label={`${insight.confidence}%`}
            size="small"
            color={severityColor}
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          {insight.explanation}
        </Typography>

        {insight.metrics.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <MetricsList metrics={insight.metrics} />
          </Box>
        )}

        {insight.affectedFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <FilesList files={insight.affectedFiles} />
          </Box>
        )}
      </CardContent>

      <CardActions>
        <Button size="small">View Details</Button>
        {onAcknowledge && (
          <Button
            size="small"
            onClick={() => onAcknowledge(insight.id)}
          >
            Acknowledge
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
```

### Prediction Chart Pattern

```typescript
import { Line } from 'react-chartjs-2';
import { useTheme } from '@mui/material/styles';

interface PredictionChartProps {
  data: PredictionData;
  height?: number;
}

export function PredictionChart({ data, height = 300 }: PredictionChartProps) {
  const theme = useTheme();

  const chartData = {
    labels: [
      ...data.historical.map(d => d.date),
      ...data.predicted.map(d => d.date),
    ],
    datasets: [
      {
        label: 'Historical',
        data: data.historical.map(d => d.value),
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
        borderDash: [],
        fill: false,
      },
      {
        label: 'Predicted',
        data: [
          ...Array(data.historical.length - 1).fill(null),
          data.historical[data.historical.length - 1].value,
          ...data.predicted.map(d => d.value),
        ],
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
      },
      {
        label: 'Confidence Band',
        data: [
          ...Array(data.historical.length).fill(null),
          ...data.confidenceBands.upper.map(d => d.value),
        ],
        backgroundColor: theme.palette.primary.light,
        fill: '+1',
        borderWidth: 0,
      },
      {
        label: '',
        data: [
          ...Array(data.historical.length).fill(null),
          ...data.confidenceBands.lower.map(d => d.value),
        ],
        backgroundColor: theme.palette.primary.light,
        fill: false,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: data.metric,
        },
      },
    },
  };

  return (
    <Box sx={{ height }}>
      <Line data={chartData} options={options} />
    </Box>
  );
}
```

---

## Color Scheme Extensions

```typescript
// Add to dashboardTheme.ts
export const phase4Colors = {
  prediction: '#9c27b0',
  predictionLight: '#ba68c8',
  predictionLightest: '#f3e5f5',

  riskLow: '#28a745',
  riskMedium: '#ff9800',
  riskHigh: '#ff5722',
  riskCritical: '#dc3545',

  activityComment: '#17a2b8',
  activityAssignment: '#ff9800',
  activityResolution: '#28a745',
  activityGoal: '#9c27b0',
};

// Usage in components
<Box sx={{ color: phase4Colors.prediction }}>
  Prediction
</Box>
```

---

## Testing Checklist

### Unit Tests
- [ ] InsightCard renders with all insight types
- [ ] PredictionChart displays historical and predicted data
- [ ] RiskMatrix positions bubbles correctly
- [ ] VisualizationBuilder handles drag & drop
- [ ] ActivityFeed filters by type
- [ ] CommentThread supports nested replies
- [ ] NotificationBell shows correct badge count

### Integration Tests
- [ ] Insights page fetches and displays data
- [ ] Predictions page updates on scenario change
- [ ] Visualization builder saves and loads configs
- [ ] Collaboration hub assigns issues successfully
- [ ] Notifications trigger on events

### Accessibility Tests
- [ ] Keyboard navigation works for all features
- [ ] Screen readers announce insights correctly
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] prefers-reduced-motion respected

### Performance Tests
- [ ] Insights page loads in <1s
- [ ] Prediction calculation completes in <2s
- [ ] Risk matrix renders 50 risks in <200ms
- [ ] Visualization builder updates in <100ms
- [ ] Notification delivery latency <100ms

---

## Common Issues & Solutions

### Issue: AI insights not generating

**Solution:**
1. Check `ANTHROPIC_API_KEY` is set in `.env`
2. Verify API key has sufficient credits
3. Check Python logs for API errors
4. Fallback: Use rule-based insights instead

### Issue: Predictions showing "NaN"

**Solution:**
1. Ensure historical data has at least 10 data points
2. Check for null values in historical data
3. Verify dates are in correct ISO format
4. Add data validation before prediction

### Issue: Drag & drop not working in visualization builder

**Solution:**
1. Verify `react-dnd` and `react-dnd-html5-backend` installed
2. Check `DndProvider` wraps VisualizationBuilder
3. Ensure drag sources and drop targets configured correctly
4. Test in different browsers (Safari has quirks)

### Issue: Notifications not appearing

**Solution:**
1. Check WebSocket connection established
2. Verify NotificationBell component mounted
3. Check browser console for WebSocket errors
4. Test notification permissions granted
5. Check notification preferences not blocking

---

## Performance Optimization Tips

1. **Code Splitting:**
   ```typescript
   const InsightsPage = lazy(() => import('./components/insights/InsightsPage'));
   const PredictiveDashboard = lazy(() => import('./components/predictions/PredictiveDashboard'));
   ```

2. **Memoization:**
   ```typescript
   const processedInsights = useMemo(
     () => insights.filter(i => i.severity === 'critical'),
     [insights]
   );
   ```

3. **Debouncing:**
   ```typescript
   const debouncedSearch = useDebouncedCallback(
     (value: string) => setSearchQuery(value),
     500
   );
   ```

4. **Virtual Scrolling:**
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';

   const virtualizer = useVirtualizer({
     count: activityItems.length,
     getScrollElement: () => scrollRef.current,
     estimateSize: () => 80,
   });
   ```

---

## Next Steps

1. **Read Full Guide:** Review `PHASE4_VISUAL_STORYTELLING_GUIDE.md`
2. **Set Up Environment:** Install dependencies, configure API keys
3. **Start with Phase 4A:** Implement AI Insights Engine first
4. **Iterate:** Ship small, get feedback, improve
5. **Monitor:** Track performance, user engagement, error rates

---

**Questions?** Refer to full Phase 4 Visual Storytelling Guide for detailed explanations, visual mockups, and implementation examples.

---

**Last Updated:** 2025-12-09
**Version:** 1.1
**Status:** IN PROGRESS

## Implementation Progress

### Completed (2025-12-09)

| Component | Files Created | Status |
|-----------|---------------|--------|
| **AI Insights UI** | InsightsPage.tsx, InsightCard.tsx, InsightsCategoryTabs.tsx, InsightsSummaryCard.tsx | Done |
| **Insights API** | insightsApi.ts | Done |
| **Predictions API** | predictionsApi.ts | Done |
| **Insights Hook** | useInsights.ts | Done |
| **Predictions Hook** | usePredictions.ts | Done |
| **TypeScript Types** | insights.ts, predictions.ts, collaboration.ts | Done |

### Pending

| Component | Files Needed | Priority |
|-----------|--------------|----------|
| **Predictions UI** | PredictiveDashboard.tsx, PredictionChart.tsx, RiskMatrix.tsx | High |
| **Visualization Builder** | VisualizationBuilder.tsx, BuilderSidebar.tsx, BuilderCanvas.tsx | Medium |
| **Collaboration Hub** | CollaborationHub.tsx, ActivityFeed.tsx, IssueAssignments.tsx | Medium |
| **Notifications** | NotificationCenter.tsx, NotificationBell.tsx, NotificationDropdown.tsx | Low |
| **Routes** | /dashboard/insights, /dashboard/predictions, /dashboard/visualizations | High |

### Recent Commits

| Commit | Description |
|--------|-------------|
| `6d30432` | feat(phase4): add AI insights UI components |
| `8209d4b` | feat(phase4): add AI insights and predictions infrastructure |
| `01d1d54` | docs(phase4-5): add planning documents for advanced dashboard features |
| `ff00ba0` | fix(tools): correct MetricGrid usage and update type exports |
| `0762663` | fix(typescript): resolve unused variables in tools components |

---
