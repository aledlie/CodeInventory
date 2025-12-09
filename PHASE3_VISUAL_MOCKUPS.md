# Phase 3 Visual Mockups

**Detailed UI/UX Specifications with ASCII Wireframes**

## 1. Trend Charts Page

### Layout: `/dashboard/trends`

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo] Code Inventory Dashboard                    [User] [Settings] [?] │
├─────────────────────────────────────────────────────────────────────────┤
│ [≡]   TRENDS OVERVIEW                              Last Updated: 2m ago │
├────┬────────────────────────────────────────────────────────────────────┤
│ 📊 │ Time Range:  (•) 7 Days  ( ) 30 Days  ( ) 90 Days  ( ) All Time   │
│ ▪  ├────────────────────────────────────────────────────────────────────┤
│ 📈 │ ┌─────────────────────────────────────────────────────────────────┐│
│ ▪  │ │ Quality Score Over Time                            [Export 📥]  ││
│ 🔍 │ ├─────────────────────────────────────────────────────────────────┤│
│ ▪  │ │100%┤                                                             ││
│ 📦 │ │ 90%┤                                    ╭────────●              ││
│ ▪  │ │ 80%┤                          ╭─────────╯       Target Line ━   ││
│ 📄 │ │ 70%┤                    ╭─────╯    ●                            ││
│    │ │ 60%┤          ╭─────────╯     ●                                 ││
│    │ │ 50%┤    ╭─────╯          ●                                      ││
│    │ │    └────┬────┬────┬────┬────┬────┬────                         ││
│    │ │        Jan1 Jan8 Jan15 Jan22 Jan29 Feb5                         ││
│    │ │                                                                  ││
│    │ │ Latest: 87% (+5% from last week)   Trend: ↗ Improving         ││
│    │ └─────────────────────────────────────────────────────────────────┘│
│    │                                                                     │
│    │ ┌───────────────────────────┬─────────────────────────────────────┐│
│    │ │ Test Coverage Trend       │ Issue Velocity                      ││
│    │ ├───────────────────────────┼─────────────────────────────────────┤│
│    │ │100%┤                      │100┤                                 ││
│    │ │ 80%┤         ╱────●       │ 80┤      ████████████               ││
│    │ │ 60%┤    ╱───╯             │ 60┤  ████░░░░░░░░░░░░  Critical    ││
│    │ │ 40%┤╱──╯                  │ 40┤██░░░░▒▒▒▒▒▒▒▒▒▒▒  High        ││
│    │ │ 20%┤                      │ 20┤░░░░▒▒▒▒▓▓▓▓▓▓▓▓▓  Medium      ││
│    │ │    └──┬──┬──┬──┬──        │   └──┬──┬──┬──┬──    Low         ││
│    │ │      W1 W2 W3 W4 W5       │     W1 W2 W3 W4 W5                ││
│    │ │ 78% (+13%)                │ Total: 23 (-22)                    ││
│    │ └───────────────────────────┴─────────────────────────────────────┘│
│    │                                                                     │
│    │ ┌─────────────────────────────────────────────────────────────────┐│
│    │ │ Circular Dependencies Trend                      [Export 📥]    ││
│    │ ├─────────────────────────────────────────────────────────────────┤│
│    │ │12┤  ██                                                          ││
│    │ │10┤  ██  ██                                                      ││
│    │ │ 8┤  ██  ██                                                      ││
│    │ │ 6┤  ██  ██  ██                                                  ││
│    │ │ 4┤  ██  ██  ██  ▓▓              Goal: 0 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄       ││
│    │ │ 2┤  ██  ██  ██  ▓▓  ▓▓                                         ││
│    │ │ 0┼──────────────────────────────────────────────────────────    ││
│    │ │    W1  W2  W3  W4  W5                                          ││
│    │ │ Current: 1  Status: ✅ Near target  Change: -4 chains          ││
│    │ └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### Hover Interaction

```
When hovering over a data point:

┌────────────────────────┐
│ Jan 22, 2025          │
│                        │
│ Quality Score: 82%     │
│ Change: +4% from Jan15 │
│                        │
│ Issues Resolved: 15    │
│ New Issues: 3          │
│                        │
│ [View Details →]       │
└────────────────────────┘
     ↓
    ● ← Highlighted point
     ╱
   ─╯  Line dimmed before/after
```

## 2. Dependency Graph Page

### Layout: `/dashboard/dependencies/graph`

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo] Code Inventory Dashboard                    [User] [Settings] [?] │
├─────────────────────────────────────────────────────────────────────────┤
│ [≡]   DEPENDENCY GRAPH                             Last Updated: 2m ago │
├────┬────────────────────────────────────────────────┬────────────────────┤
│ 🏠 │ Graph Controls                                │ Node Details     ✕ │
│ 📊 ├────────────────────────────────────────────────┤                    │
│ 🔍 │ Search: [                          ] 🔍       │ ComponentName.tsx  │
│ 📦 │                                                │                    │
│ 📄 │ Layout:                                        │ Metrics:           │
│    │ (•) Force-Directed                            │ • Imports: 12      │
│    │ ( ) Hierarchical                              │ • Imported by: 8   │
│    │ ( ) Circular                                  │ • LOC: 245         │
│    │                                                │ • Coverage: 85%    │
│    │ Clustering:                                   │ • Issues: 2        │
│    │ (•) By Directory                              │                    │
│    │ ( ) By Module                                │ Dependencies:      │
│    │ ( ) None                                      │ ├─ utils/format   │
│    │                                                │ ├─ hooks/useData  │
│    │ Filters:                                      │ └─ api/dashboard   │
│    │ ☑ Show External                               │                    │
│    │ ☑ Show Type-Only                              │ Dependents:        │
│    │ ☑ Show Circular                               │ ├─ Dashboard.tsx  │
│    │ ☐ Untested Only                               │ ├─ Header.tsx     │
│    │                                                │ └─ App.tsx         │
│    │ Node Types:                                   │                    │
│    │ ☑ Application                                 │ [View Source]      │
│    │ ☑ Utils                                       │ [View Tests]       │
│    │ ☑ Services                                    │                    │
│    │ ☐ External                                    ├────────────────────┤
│    │                                                │                    │
│    │ [⊕ Zoom In]   [⊖ Zoom Out]                   │ Circular Deps      │
│    │ [↺ Reset View]                                │                    │
│    │                                                │ 1 chain detected   │
│    │ Minimap:                                      │                    │
│    │ ┌──────────┐                                  │ A → B → C → A      │
│    │ │ ╔══╗     │ ← Viewport                       │ Length: 3 nodes    │
│    │ │ ║  ║     │                                  │ Severity: Medium   │
│    │ │ ╚══╝     │                                  │                    │
│    │ └──────────┘                                  │ Suggestion:        │
│    │                                                │ Extract interface  │
├────┼────────────────────────────────────────────────┤ to break cycle     │
│    │                                                │                    │
│    │           GRAPH CANVAS AREA                   │ [Highlight Cycle]  │
│    │                                                │ [View All Cycles]  │
│    │          ┌───────────┐                        │                    │
│    │          │ ModuleA   │────┐                   └────────────────────┘
│    │    ┌─────│  • • •    │    │
│    │    │     └───────────┘    │
│    │    │                      ↓
│    │    │    ┌───────────┐
│    │    │    │ ModuleB   │
│    │    │    │  • •      │
│    │    │    └───────────┘
│    │    │          ↓
│    │    │    ┌───────────┐
│    │    └───→│ ModuleC   │
│    │         │  • • • •  │
│    │         └───────────┘
│    │
│    │  Legend:
│    │  ● Application  ● Utils  ● Services  ● External
│    │  ─────→ Normal   ═════⇒ Strong   ⟿⟿⟿⟿ Circular
│    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Graph Node Hover State

```
Normal State:
┌─────────────┐
│ ModuleA     │
│  • • •      │
└─────────────┘

Hover State:
┌─────────────┐ ← Glow effect
│ ModuleA     │   Opacity: 1.0
│  • • •      │
└─────────────┘
      ↑
  Incoming dependencies (green arrows)
      ↓
  Outgoing dependencies (blue arrows)

All other nodes: Opacity 0.3 (dimmed)

Tooltip:
┌────────────────────────┐
│ src/components/        │
│ ModuleA.tsx            │
│                        │
│ Imports: 8             │
│ Imported by: 12        │
│ Lines: 245             │
│ Coverage: 85%          │
│                        │
│ Click for details      │
└────────────────────────┘
```

### Circular Dependency Highlight

```
When hovering over circular dependency:

    ┌─────────────┐
    │  ModuleA    │───┐  ← All nodes pulse with red glow
    └─────────────┘   │
         ↑ ⟿⟿⟿⟿⟿⟿⟿⟿⟿│  ← Red curved arrows animate
         │            ↓
    ┌─────────────┐   │
    │  ModuleC    │←──│
    └─────────────┘   │
         ↑ ⟿⟿⟿⟿⟿⟿⟿⟿⟿│
         │            ↓
    ┌─────────────┐
    │  ModuleB    │
    └─────────────┘

Label overlay: "Cycle 1 of 3: A → B → C → A"
```

## 3. Historical Comparison Page

### Layout: `/dashboard/comparison`

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo] Code Inventory Dashboard                    [User] [Settings] [?] │
├─────────────────────────────────────────────────────────────────────────┤
│ [≡]   COMPARE ANALYSIS RUNS                        Last Updated: 2m ago │
├────┬────────────────────────────────────────────────────────────────────┤
│ 🏠 │ Select Runs to Compare:                                            │
│ 📊 ├────────────────────────────────────────────────────────────────────┤
│ 🔍 │ Baseline:  [Jan 15, 2025 - After refactor     ▼]                  │
│ 📦 │ Current:   [Jan 29, 2025 - Latest analysis    ▼]   [Compare 🔄]   │
│ 📄 │                                                                     │
│    │ Time Elapsed: 14 days                                              │
│    ├────────────────────────────────────────────────────────────────────┤
│    │ SIDE-BY-SIDE COMPARISON                                            │
│    ├────────────────────────────────────────────────────────────────────┤
│    │ ┌───────────────────────────────┬───────────────────────────────┐ │
│    │ │ Jan 15 (Baseline)             │ Jan 29 (Current)             │ │
│    │ ├───────────────────────────────┼───────────────────────────────┤ │
│    │ │ ┌─────────────┐               │ ┌─────────────┐              │ │
│    │ │ │ Quality     │ 72%           │ │ Quality     │ 87% ↗+15%   │ │
│    │ │ └─────────────┘               │ └─────────────┘              │ │
│    │ │ ┌─────────────┐               │ ┌─────────────┐              │ │
│    │ │ │ Coverage    │ 65%           │ │ Coverage    │ 78% ↗+13%   │ │
│    │ │ └─────────────┘               │ └─────────────┘              │ │
│    │ │ ┌─────────────┐               │ ┌─────────────┐              │ │
│    │ │ │ Issues      │ 45            │ │ Issues      │ 23 ↘-22     │ │
│    │ │ └─────────────┘               │ └─────────────┘              │ │
│    │ │ ┌─────────────┐               │ ┌─────────────┐              │ │
│    │ │ │ Circular    │ 5             │ │ Circular    │ 1 ↘-4       │ │
│    │ │ └─────────────┘               │ └─────────────┘              │ │
│    │ └───────────────────────────────┴───────────────────────────────┘ │
│    │                                                                     │
│    │ DELTA WATERFALL                                                    │
│    ├────────────────────────────────────────────────────────────────────┤
│    │ Change in Total Issues (Jan 15 → Jan 29)                          │
│    │                                                                     │
│    │ Start: 45 issues ■■■■■■■■■■■■■■■■■■■■■■■                        │
│    │                  │                                                  │
│    │ Security fixed   │ -12 ████████████ ↓                             │
│    │ Best practices   │ -8  ████████ ↓                                 │
│    │ New features     │ +3  ▓▓▓ ↑                                      │
│    │ Refactoring      │ -5  █████ ↓                                    │
│    │                  │                                                  │
│    │ End: 23 issues   ■■■■■■■■■■ (Net: -22)                          │
│    │                                                                     │
│    ├────────────────────────────────────────────────────────────────────┤
│    │ MULTI-DIMENSIONAL COMPARISON                                       │
│    ├────────────────────────────────────────────────────────────────────┤
│    │           Quality ●                                                │
│    │               ↑                                                    │
│    │               │       ● Jan 29 (Larger area = better)             │
│    │         ●─────┼──────●                                            │
│    │               │   ● Jan 15                                         │
│    │ Coverage ●────┼─────● Documentation                               │
│    │         ●─────│───●                                               │
│    │               │ ●●                                                 │
│    │               ↓                                                    │
│    │         Performance                                                │
│    │                                                                     │
│    ├────────────────────────────────────────────────────────────────────┤
│    │ SPARKLINE MATRIX (Last 10 Runs)                                   │
│    ├────────────────────────────────────────────────────────────────────┤
│    │ Quality       ╱╲╱‾╲_  █   87% (↗ +15%)                           │
│    │ Coverage      __╱‾‾‾  █   78% (↗ +13%)                           │
│    │ Issues        ‾╲╲__   █   23 (↘ -22)                             │
│    │ Circular      ‾‾╲___  █   1 (↘ -4)                               │
│    │ Files         __╱‾╱   █   156 (↗ +14)                            │
│    │                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### AI-Generated Insights Section

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AI INSIGHTS (Powered by Claude)                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ 🎉 SIGNIFICANT IMPROVEMENTS                                             │
│ ────────────────────────────────────────────────────────────────────    │
│ • Code quality increased 15% after authentication module refactor       │
│   - Resolved 12 critical security issues                                │
│   - Improved best practices compliance by 8 issues                      │
│                                                                          │
│ • Test coverage up 13% with 45 new test cases added                     │
│   - Focus on auth and API modules                                       │
│                                                                          │
│ • Eliminated 4 of 5 circular dependencies                               │
│   - Remaining cycle is low-severity (utils → helpers → utils)           │
│                                                                          │
│ ⚠️  AREAS NEEDING ATTENTION                                             │
│ ────────────────────────────────────────────────────────────────────    │
│ • 14 new files added without tests                                      │
│   - Located in src/features/dashboard/components/                       │
│   - Recommendation: Add unit tests this sprint                          │
│                                                                          │
│ • Performance issues increased from 2 to 5                              │
│   - Related to new chart rendering logic                                │
│   - May need optimization for large datasets                            │
│                                                                          │
│ 💡 RECOMMENDATIONS                                                       │
│ ────────────────────────────────────────────────────────────────────    │
│ 1. Priority High: Add tests for newly created dashboard components      │
│ 2. Priority Medium: Optimize chart rendering performance                │
│ 3. Priority Low: Resolve final circular dependency in utils             │
│                                                                          │
│ 📊 OVERALL ASSESSMENT: Strong Progress ✅                               │
│ ────────────────────────────────────────────────────────────────────    │
│ Score: 85/100 (↗ from 72/100)                                          │
│ Trend: Improving significantly                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4. Report Generation Page

### Layout: `/dashboard/reports`

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo] Code Inventory Dashboard                    [User] [Settings] [?] │
├─────────────────────────────────────────────────────────────────────────┤
│ [≡]   GENERATE CUSTOM REPORT                       Last Updated: 2m ago │
├────┬────────────────────────────────────────────────┬────────────────────┤
│ 🏠 │ STEP 1: Choose Template                       │ REPORT PREVIEW     │
│ 📊 ├────────────────────────────────────────────────┤                    │
│ 🔍 │ ┌──────────────┬──────────────┬──────────────┐│ ┌────────────────┐│
│ 📦 │ │ EXECUTIVE    │ TECHNICAL    │ COMPLIANCE  ││ │ Code Health    ││
│ 📄 │ │              │              │             ││ │ Report         ││
│    │ │ ✓ Summary    │ ✓ Detailed   │ ✓ Security  ││ │                ││
│    │ │ ✓ Trends     │ ✓ All Issues │ ✓ Coverage  ││ │ Jan 29, 2025   ││
│    │ │ ✓ Top Issues │ ✓ Coverage   │ ✓ Audit     ││ │                ││
│    │ │ ✓ Actions    │ ✓ Deps       │ ✓ Checklist ││ │ Quality: 87%   ││
│    │ │              │ ✓ Trends     │             ││ │ Coverage: 78%  ││
│    │ │  [Select]    │  [Select]    │  [Select]   ││ │ Issues: 23     ││
│    │ └──────────────┴──────────────┴──────────────┘│ │                ││
│    │                                                │ │ [Full Preview] ││
│    │ STEP 2: Customize Sections                    │ └────────────────┘│
│    ├────────────────────────────────────────────────┤                    │
│    │ Sections to Include:                          │                    │
│    │ ☑ Executive Summary                           │                    │
│    │    ☑ Include metrics                          │                    │
│    │    ☑ Include highlights                       │                    │
│    │    ☑ Include trend chart                      │                    │
│    │                                                │                    │
│    │ ☑ Quality Trends (Last 30 days)               │                    │
│    │                                                │                    │
│    │ ☑ Top 20 Issues                               │                    │
│    │    Severities: ☑ Critical ☑ High ☐ Medium    │                    │
│    │    ☑ Include code snippets                    │                    │
│    │    ☑ Include suggestions                      │                    │
│    │                                                │                    │
│    │ ☐ All Issues (Detail)                         │                    │
│    │                                                │                    │
│    │ ☑ Test Coverage Analysis                      │                    │
│    │    ☑ Coverage by file                         │                    │
│    │    ☐ Untested functions list                  │                    │
│    │                                                │                    │
│    │ ☑ Dependency Graph                            │                    │
│    │    Layout: [Force-Directed ▼]                │                    │
│    │    ☑ Show circular dependencies               │                    │
│    │                                                │                    │
│    │ ☐ File-by-File Breakdown                      │                    │
│    │                                                │                    │
│    │ ☑ AI-Generated Recommendations                │                    │
│    │                                                │                    │
│    ├────────────────────────────────────────────────┤                    │
│    │ STEP 3: Choose Format & Export                │                    │
│    ├────────────────────────────────────────────────┤                    │
│    │ Export Format:                                 │                    │
│    │ ( ) PDF       - Print-ready document          │                    │
│    │ (•) HTML      - Interactive, self-contained   │                    │
│    │ ( ) Markdown  - GitHub-friendly format        │                    │
│    │ ( ) JSON      - Machine-readable API format   │                    │
│    │ ( ) CSV       - Spreadsheet analysis          │                    │
│    │                                                │                    │
│    │ HTML Options:                                  │                    │
│    │ ☑ Self-contained (offline ready)              │                    │
│    │ ☑ Include interactive charts                  │                    │
│    │ ☑ Mobile responsive                           │                    │
│    │ ☑ Print stylesheet                            │                    │
│    │                                                │                    │
│    │ Branding:                                      │                    │
│    │ Company: [Acme Corp              ]            │                    │
│    │ Logo:    [Upload...]                          │                    │
│    │ Color:   [#0066cc] 🎨                         │                    │
│    │                                                │                    │
│    │ [Save as Template]  [Generate & Download 📥]  │                    │
│    │                                                │                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Report Templates Library

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MY REPORT TEMPLATES                                    [+ New Template] │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────┬──────────────────────────────────────┐│
│ │ Weekly Status Report          │ ⭐ Most Used                        ││
│ │ Format: HTML                  │ Created: Jan 1, 2025                ││
│ │ Sections: 5                   │ Last used: 2 days ago               ││
│ │ • Executive summary           │                                      ││
│ │ • Quality trends (7d)         │ [Use Template] [Edit] [Delete]      ││
│ │ • Top 10 issues               │                                      ││
│ └──────────────────────────────┴──────────────────────────────────────┘│
│                                                                          │
│ ┌──────────────────────────────┬──────────────────────────────────────┐│
│ │ Sprint Retrospective          │                                      ││
│ │ Format: Markdown              │ Created: Jan 15, 2025               ││
│ │ Sections: 8                   │ Last used: 5 days ago               ││
│ │ • Comparison with sprint start│                                      ││
│ │ • Detailed issue breakdown    │ [Use Template] [Edit] [Delete]      ││
│ │ • Coverage improvements       │                                      ││
│ └──────────────────────────────┴──────────────────────────────────────┘│
│                                                                          │
│ ┌──────────────────────────────┬──────────────────────────────────────┐│
│ │ Security Audit Report         │                                      ││
│ │ Format: PDF                   │ Created: Dec 20, 2024               ││
│ │ Sections: 6                   │ Last used: 20 days ago              ││
│ │ • Critical security issues    │                                      ││
│ │ • Compliance checklist        │ [Use Template] [Edit] [Delete]      ││
│ │ • Remediation recommendations │                                      ││
│ └──────────────────────────────┴──────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

## 5. Mobile Responsive Layouts

### Mobile Trends View (375px width)

```
┌─────────────────────────────────┐
│ ☰  Code Inventory      [User] [?]│
├─────────────────────────────────┤
│ TRENDS                           │
├─────────────────────────────────┤
│ Time: (•)7d ( )30d ( )90d       │
├─────────────────────────────────┤
│ Quality Score                    │
│ ┌─────────────────────────────┐ │
│ │100%┤                        │ │
│ │ 80%┤              ╭─────●   │ │
│ │ 60%┤     ╭────────╯         │ │
│ │ 40%┤╭────╯                  │ │
│ │    └─┬──┬──┬──┬──           │ │
│ │     W1 W2 W3 W4 W5          │ │
│ └─────────────────────────────┘ │
│ 87% (↗ +15%)                    │
├─────────────────────────────────┤
│ Coverage                         │
│ ┌─────────────────────────────┐ │
│ │ [Simplified chart]           │ │
│ └─────────────────────────────┘ │
│ 78% (↗ +13%)                    │
├─────────────────────────────────┤
│ Issues                          │
│ ┌─────────────────────────────┐ │
│ │ [Stacked area chart]         │ │
│ └─────────────────────────────┘ │
│ 23 (↘ -22)                      │
├─────────────────────────────────┤
│ [Show More Charts ▼]            │
└─────────────────────────────────┘
```

## 6. Color-Coded Status System

### Visual Status Indicators

```
Quality Score Display:
┌────────────────┐
│ Quality: 87%   │ ← Green background (rgba(40,167,69,0.1))
│ ✅ Excellent   │   Green icon and text (#28a745)
└────────────────┘

┌────────────────┐
│ Quality: 72%   │ ← Orange background (rgba(255,152,0,0.1))
│ ⚠️  Fair       │   Orange icon and text (#ff9800)
└────────────────┘

┌────────────────┐
│ Quality: 45%   │ ← Red background (rgba(220,53,69,0.1))
│ ❌ Poor        │   Red icon and text (#dc3545)
└────────────────┘
```

### Severity Badges

```
Critical Issue Badge:
╔═══════════╗
║ CRITICAL  ║ ← Red background (#dc3545)
╚═══════════╝   White text, bold, uppercase

High Issue Badge:
┌───────────┐
│   HIGH    │ ← Orange background (#ff9800)
└───────────┘   Dark text (#1a1a1a), bold

Medium Issue Badge:
┌───────────┐
│  MEDIUM   │ ← Blue background (#17a2b8)
└───────────┘   White text, regular weight

Low Issue Badge:
┌───────────┐
│    LOW    │ ← Gray background (#6c757d)
└───────────┘   White text, regular weight
```

## 7. Animation Patterns

### Chart Load Animation

```
Frame 1: Empty state
┌─────────────────────────────┐
│                             │
│                             │
│     Loading chart...        │
│         ⏳                  │
│                             │
└─────────────────────────────┘

Frame 2: Axes appear (fade in, 200ms)
┌─────────────────────────────┐
│   ↑                         │
│   │                         │
│   │                         │
│   └─────────────────→       │
└─────────────────────────────┘

Frame 3: Data animates in (slide + fade, 400ms)
┌─────────────────────────────┐
│100%┤                        │
│ 80%┤              ╭─────●   │ ← Line draws from left
│ 60%┤     ╭────────╯         │   to right with ease-out
│ 40%┤╭────╯                  │
│    └─────────────→           │
└─────────────────────────────┘
```

### Graph Node Animation

```
Initial load: Nodes "drop in" with spring physics
Frame 1: All nodes at top
    ●
    ●
    ● ● ●

Frame 2-10: Nodes spread out with bounce
    ●     ●
       ●
    ●     ●

Final: Force-directed equilibrium
    ●────●
    │  ╱
    ●─●
      │
      ●

Hover: Smooth scale up (1.0 → 1.1, 150ms ease-out)
Click: Pulse effect (scale 1.0 → 1.15 → 1.05, 300ms)
```

### Delta Indicators Animation

```
Positive Change:
Step 1: Number updates (count-up animation, 500ms)
72% → ... → 87%

Step 2: Arrow appears (slide up + fade in, 200ms)
87%
    ↗   ← Slides up from below

Step 3: Percentage shows (fade in, 200ms)
87% ↗ +15%

Color transition: neutral → green (300ms)
```

## 8. Accessibility Features

### Keyboard Navigation

```
Tab Order:
1. Time range selector
2. Each chart (focusable)
   - Enter: Open chart in detail view
   - Arrow keys: Navigate data points
   - Space: Show/hide tooltip
3. Export buttons
4. Filter controls

Focus indicators:
┌─────────────────────────────┐
│ Quality Score Trend         │ ← 2px blue outline
│ ┌─────────────────────────┐ │   #0066cc, 2px offset
│ │ [Chart focused]         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Screen Reader Support

```
Chart ARIA structure:
<figure role="img" aria-label="Quality score trend over 7 days">
  <figcaption>
    Quality score increased from 72% to 87% over the past week,
    showing a 15% improvement. The trend is consistently improving
    with no major dips.
  </figcaption>

  <!-- Canvas/SVG chart here -->

  <!-- Data table fallback (visually hidden) -->
  <table aria-hidden="false" class="sr-only">
    <caption>Quality score by date</caption>
    <thead>
      <tr><th>Date</th><th>Score</th></tr>
    </thead>
    <tbody>
      <tr><td>Jan 1</td><td>72%</td></tr>
      <tr><td>Jan 8</td><td>75%</td></tr>
      ...
    </tbody>
  </table>
</figure>
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable animations */
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Show final state immediately */
  .chart-line {
    animation: none;
    stroke-dasharray: none;
  }

  /* Graph layout: Skip physics simulation */
  .graph-node {
    transition: none;
  }
}
```

---

**Document Version**: 1.0
**Created**: 2025-01-15
**Last Updated**: 2025-12-09
**Status**: Ready for Review

---

## Git Activity

| Commit | Date | Description |
|--------|------|-------------|
| `ac6391c` | 2025-12-09 | docs(phase3): add visual mockups and layout designs |
