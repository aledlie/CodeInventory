# Code Inventory Dashboard: Comprehensive UI/UX Design Plan

**Document Version:** 1.0
**Created:** December 2025
**Purpose:** Strategic design direction for the Code Inventory outputs dashboard

---

## Executive Summary

The Code Inventory Dashboard transforms complex code analysis data into an intuitive, professional interface that helps developers understand codebase health at a glance and drill into specific issues. The design prioritizes **clarity through progressive disclosure**, combining a clean dashboard landing page with deep analytical detail views.

### Design Philosophy

- **Progressive Disclosure**: Summary metrics → detailed analysis → actionable insights
- **Task-Oriented Navigation**: Users complete specific goals (find untested functions, review quality issues)
- **Data Hierarchy**: Critical issues surface first; supporting data remains accessible but secondary
- **Visual Clarity**: Severity/status communicated through color, icons, and typography—not decoration alone

---

## Part 1: Dashboard Layout & Architecture

### 1.1 Overall Structure

The dashboard follows a **responsive, composable architecture** with these key regions:

```
┌────────────────────────────────────────────────────────┐
│                      HEADER                            │
│  Logo    Title    Last Generated    Quick Actions      │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│                 NAVIGATION SIDEBAR                     │
│  Dashboard (active)                                    │
│  Code Quality                                          │
│  Test Coverage                                         │
│  Dependencies                                          │
│  Repository Overview                                   │
│  Settings                                              │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│                    MAIN CONTENT AREA                   │
│                                                        │
│  ┌─ Metrics Row 1 ────────────────────────────────┐   │
│  │ [Card] [Card] [Card] [Card] [Card] [Card]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─ Health Summary ────────────────────────────────┐   │
│  │ Status Overview & Recommendations               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─ Top Issues ────────────────────────────────────┐   │
│  │ Critical Issues Requiring Attention             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─ Analytics ─────────────────────────────────────┐   │
│  │ Charts & Visualizations                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│                      FOOTER                            │
│  Generated: 2025-12-08 | Last Updated: 2025-12-08    │
└────────────────────────────────────────────────────────┘
```

### 1.2 Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Desktop | 1440px+ | Sidebar + Full Content |
| Laptop | 1024px - 1439px | Sidebar + Content (narrower) |
| Tablet | 768px - 1023px | Collapsible Sidebar + Full Width Content |
| Mobile | 320px - 767px | Bottom Navigation + Full Width Content |

**Mobile Strategy**: Sidebar collapses to hamburger menu at 768px. Content stacks vertically. Cards display single-column. Metric values remain prominent.

### 1.3 Navigation Pattern

**Primary Navigation (Sidebar/Header)**:
- Dashboard (current view)
- Code Quality (dedicated quality analysis page)
- Test Coverage (dedicated coverage analysis page)
- Dependencies (dedicated dependency analysis page)
- Repository Overview (code structure visualization)
- Settings & Export (preferences, data export options)

**Secondary Navigation (In-Page)**:
- Filter/Sort controls for detailed tables
- Time period selectors for trend analysis
- Category filters for issues

**Breadcrumb Navigation**: Only shown in detail views to help users understand depth level (Dashboard > Code Quality > High Severity Issues)

---

## Part 2: Visual Design System

### 2.1 Color Palette

**Primary Palette** (for UI structure):
- **Primary Brand**: `#0066cc` (medium blue) - CTA buttons, primary actions
- **Primary Light**: `#e6f0ff` (light blue) - backgrounds, highlights
- **Neutral Dark**: `#1a1a1a` (near black) - primary text
- **Neutral Medium**: `#666666` - secondary text, borders
- **Neutral Light**: `#f5f5f5` - card backgrounds, section dividers

**Semantic Palette** (status communication):
- **Critical/Error**: `#dc3545` (red) - security issues, circular dependencies, critical coverage gaps
- **Warning/High**: `#ff9800` (orange) - significant code smells, test coverage < 70%
- **Success**: `#28a745` (green) - good coverage, no critical issues
- **Info**: `#17a2b8` (cyan) - informational, additional context
- **Muted**: `#999999` - low-priority items, disabled states

**Gradient Accents**:
- Status gradient (from red → orange → green) for coverage visualization
- Subtle background gradients (10° angle, low opacity 0.03-0.08) for section divisions

### 2.2 Typography

**Display Font**: `Inter` (system-installed, highly readable)
- Headlines (h1, h2, h3): 700 weight, tracking +0.5px
- h1: 32px (desktop), 24px (mobile)
- h2: 24px (desktop), 20px (mobile)
- h3: 18px (desktop), 16px (mobile)

**Body Font**: `Segoe UI` / `-apple-system` (system fallback)
- Body text: 14px, 400 weight, line-height 1.6
- Small text: 12px, 400 weight (help text, timestamps)
- Monospace (code/paths): `Monaco` / `Menlo` / `Courier New`

**Weight Strategy**:
- 400 (Regular): body text, labels
- 500 (Medium): secondary headings, table headers
- 600 (Semibold): metric labels, card titles
- 700 (Bold): primary headings, critical alerts

### 2.3 Spacing System

Use an 8px base unit for consistency:

| Size | Value | Usage |
|------|-------|-------|
| xs | 4px | micro spacing within components |
| sm | 8px | padding in buttons, gaps between small elements |
| md | 16px | card padding, vertical spacing between items |
| lg | 24px | section padding, vertical spacing between sections |
| xl | 32px | container margins, major section spacing |

**Apply consistently**: All padding, margins, gaps use multiples of 8px.

### 2.4 Shadows & Elevation

Create depth through subtle elevation:

```css
/* Card shadow (rest state) */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.04);

/* Card shadow (hover state) */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12),
            0 2px 4px rgba(0, 0, 0, 0.08);

/* Modal/overlay shadow */
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.16);

/* Inset shadow (for input focus) */
box-shadow: inset 0 0 0 2px #0066cc;
```

### 2.5 Border Radius

- Buttons & small components: 4px
- Cards: 8px
- Modals & large sections: 12px
- Fully rounded (badges, icons): 50%

### 2.6 Component States

**Buttons** (all types):
- Rest: solid color, no shadow
- Hover: 10% darker, +1px shadow
- Active: 15% darker, +2px shadow
- Disabled: 50% opacity, no cursor

**Cards**:
- Rest: neutral light background, subtle shadow
- Hover: slight translateY(-2px), enhanced shadow
- Focus: 2px border in primary color

**Badges**:
- Rest: solid background, no border
- Hover (if clickable): 10% darker background

---

## Part 3: Key Components & Specifications

### 3.1 Metric Cards

**Purpose**: Display single metric (count, percentage, status)

**Anatomy**:
```
┌─────────────────────────────┐
│ Icon (optional)  Label      │ ← 12px, uppercase, secondary text
│                             │
│ 42                          │ ← 48px bold metric value
│                             │
│ +5 this week (green arrow)  │ ← 12px trend indicator (optional)
└─────────────────────────────┘
```

**States**:
- Default: white card, subtle shadow
- Elevated (primary metrics): blue background, white text
- With trend: shows direction arrow + percentage change

**Responsive**: 4 columns (desktop), 2 columns (tablet), 1 column (mobile)

**Examples**:
- "Total Files: 42" (neutral)
- "Test Coverage: 78%" (with status color based on percentage)
- "Critical Issues: 3" (with red background if > 0)

### 3.2 Health Status Summary

**Purpose**: Quick visual overview of codebase health (traffic light system)

**Anatomy**:
```
┌─ Code Health Summary ────────────────────────────┐
│                                                  │
│ Overall Status: WARNING ●                        │ ← Status badge (red/orange/green)
│                                                  │
│ Code Quality:  ████░░░░░░ 42%                   │ ← Horizontal bar chart
│ Test Coverage: ████████░░ 78%                   │
│ Dependencies:  ██████░░░░ 58% (3 circular)      │
│                                                  │
│ Action Items:                                    │
│ • 12 critical code smells need review           │ ← Top 3-4 issues
│ • 8 untested functions in api/                  │
│ • Circular dependency in models/ detected       │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Color Logic**:
- Green (Status = "Good"): All metrics > 80%
- Orange (Status = "Warning"): Any metric 50-79%
- Red (Status = "Critical"): Any metric < 50%

### 3.3 Data Tables

**Purpose**: Display detailed issue lists, file metrics

**Anatomy** (for Code Quality Issues table):
```
┌─────────────────────────────────────────────────────────────┐
│ Filter: [Severity ▼] [Category ▼] Search [________]          │
├─────────────────────────────────────────────────────────────┤
│ Severity │ File              │ Issue            │ Line │ Fix │
├─────────────────────────────────────────────────────────────┤
│ ◆ Error  │ src/api/auth.ts   │ Hardcoded Secret │ 42   │ ⟶  │
│ ◆ Warn   │ src/utils/hash.ts │ Missing Docstring│ 15   │ ⟶  │
│ ◆ Info   │ tests/helpers.py  │ Long Function    │ 8    │ ⟶  │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Sortable columns (click header to sort)
- Filterable by severity, category, file
- Search by issue name or file path
- Inline action buttons (view details, suggest fix)
- Pagination for large result sets (50 rows/page)
- Sticky header (remains visible on scroll)

**Row States**:
- Hover: background color shift (3% darker), cursor pointer
- Selected: border-left accent in primary color
- Expandable: clicking row expands to show code snippet + suggestion

### 3.4 Charts & Visualizations

#### 3.4.1 Coverage Progress Bar

**Purpose**: Show test coverage percentage with visual urgency cues

```
Test Coverage: 78%
██████████████░░░░░ 78%
↑ Good (70-80%)

Color coding:
0-50%:   Red (#dc3545)
50-70%:  Orange (#ff9800)
70-85%:  Blue (#0066cc)
85-100%: Green (#28a745)
```

**Interactive**: Hover to show breakdown (tested vs untested functions)

#### 3.4.2 Issue Distribution Pie/Doughnut Chart

**Purpose**: Show proportion of issues by severity or category

```
         Errors: 8 (20%)
           ╱─────╲
          ╱       ╲
    12   │         │  5
   (30%) │ Center  │ (13%)
         │ "Issues"│
         ╱by Type  ╲
        ╱───────────╲
     Warnings: 15 (37%)
```

**Interaction**:
- Hover slice to highlight and show count
- Click slice to filter table below to that category
- Legend shows full details with percentages

#### 3.4.3 Dependencies Bubble Chart

**Purpose**: Visualize dependency complexity and circular dependencies

```
       External (5)
     ●●●●●

Internal (12)   Circular (2) ⚠
●●●●●●          ●●
●●●●●●

Bubble size = number of dependencies
Color = type (blue = internal, orange = external, red = circular)
```

**Interactive**: Hover to show file details, click to navigate to file details

#### 3.4.4 File Coverage Heatmap (for large codebases)

**Purpose**: Show which files have good/bad coverage at a glance

```
src/api/       src/utils/     src/models/
█████ 95%      ████░ 72%      ██░░░ 42%
████░ 82%      ███░░ 58%      ██░░░ 40%

Legend: █ 80-100% | ████ 60-79% | ███ 40-59% | ░░ <40%
```

**Interactive**: Click file to navigate to detailed view

### 3.5 Issue Cards (Detailed View)

**Purpose**: Deep inspection of individual issues with context

```
┌──────────────────────────────────────┐
│ [Type Badge] Error: Hardcoded Secret │ ← Severity + Message
│ src/api/auth.ts:42                   │ ← File location
│                                      │
│ Code Snippet:                        │
│ 40 | const secret = "abc123xyz";    │ ← Highlighted problem area
│ 41 | const token = jwt.sign(data,   │
│ 42 | > secret);                      │
│                                      │
│ Issue Details:                       │
│ Security vulnerability detected:    │
│ Hardcoded secrets should be stored  │
│ in environment variables.            │
│                                      │
│ Suggested Fix:                       │
│ const secret = process.env.JWT_...  │
│                                      │
│ [Ignore] [Mark as Fixed] [Learn More]│
└──────────────────────────────────────┘
```

### 3.6 Navigation Tabs (for detail pages)

**Purpose**: Switch between related information on same page

```
Code Quality Issues    Test Coverage    Dependencies

[Full-width divider line]

Content for active tab displays below
```

**Styling**:
- Active tab: underline accent (4px solid primary color), bold text
- Inactive tabs: normal weight, 70% opacity
- Hover: 85% opacity + slight color shift

---

## Part 4: User Flow & Interaction Patterns

### 4.1 Primary User Journeys

#### Journey 1: "What's broken in my code?" (Dashboard → Issues)
```
1. User lands on Dashboard
   ↓ Scans health summary
   ↓ Sees "Critical Issues" badge (red)
2. Clicks "Code Quality" in sidebar
   ↓ Sees all issues sorted by severity
3. Clicks [Critical] badge to filter
   ↓ Table shows only critical issues
4. Clicks issue row to expand
   ↓ Sees code snippet + suggested fix
5. Takes action: ignores/marks fixed/learns more
```

#### Journey 2: "Is my code well-tested?" (Dashboard → Coverage)
```
1. User lands on Dashboard
   ↓ Looks at "Test Coverage" metric card (78%)
2. Clicks card or "Test Coverage" sidebar link
   ↓ Sees detailed coverage breakdown
   ↓ Heatmap shows which files lack tests
3. Clicks file with low coverage
   ↓ Sees list of untested functions
4. Clicks function name
   ↓ Navigates to function in code (opens IDE or code viewer)
```

#### Journey 3: "Are dependencies a problem?" (Dashboard → Dependencies)
```
1. User lands on Dashboard
   ↓ Scans health summary
   ↓ Sees "3 circular dependencies" warning
2. Clicks "Dependencies" in sidebar
   ↓ Sees dependency graph visualization
   ↓ Red nodes highlight circular dependencies
3. Clicks circular dependency
   ↓ Sees circular chain: File A → File B → File C → File A
4. Takes action: review architecture suggestion
```

### 4.2 Drill-Down Pattern

All detail pages support this drill-down progression:

```
Dashboard Summary (1-2 metrics)
    ↓ Click metric/link
Issue Category Overview (20-100 items)
    ↓ Click item/filter
Issue Details (1 item)
    ↓ Click "view source" (optional)
Full Code Context (IDE or code viewer)
```

**Breadcrumb Example**: Dashboard > Code Quality > High Severity > Missing Docstring in auth.py

### 4.3 Filtering & Sorting

**Code Quality Issues Table**:
- Filters: Severity (error, warning, info), Category (code smell, security, etc.), File path
- Sort: by Severity (default), by File, by Message, by Line Number
- Search: text search across file paths and issue messages

**Test Coverage Table**:
- Filters: Status (tested, untested), File path, Function complexity (simple, moderate, complex)
- Sort: by Coverage %, by File, by Function Name
- Search: function name, file path

**Dependencies Table**:
- Filters: Type (internal, external), Circular (yes/no)
- Sort: by Dependency Count, by Module Name
- Search: module name, imported file

### 4.4 Micro-Interactions

#### Hover States
- Cards: subtle shadow enhancement + 2px translateY
- Buttons: 10% color darkening
- Links: underline appears
- Table rows: background color shift (2% lighter)

#### Click States
- Buttons: active state (15% darker) for 100ms
- Checkboxes: smooth animation in/out
- Tabs: instant underline shift with 150ms color transition

#### Loading States
- Skeleton screens for tables (show placeholder rows)
- Spinning icon for long-running processes (CSS animation)
- Progress bar for bulk operations

#### Success/Error States
- Toast notifications (bottom-right, 4s duration)
- Inline validation messages (red border + icon)
- Success checkmarks (green, 2s auto-dismiss)

---

## Part 5: Data Visualization Recommendations

### 5.1 Chart Type Selection by Data

| Data Type | Best Chart | Alternative | Avoid |
|-----------|-----------|-------------|-------|
| Code Quality Issues | Stacked Bar (by severity) | Pie chart | Line chart |
| Test Coverage | Progress Bar | Donut chart | Radar |
| Dependencies | Network Graph | Bubble chart | Pie chart |
| Issue Trends | Line chart | Area chart | Pie chart |
| File Metrics | Heatmap | Bar chart | Line chart |
| Severity Distribution | Pie/Doughnut | Bar chart | Scattered points |

### 5.2 Interactive Visualization Features

**All Charts Should Support**:
- Hover tooltip with detailed values
- Click to filter related data in tables
- Zoom on desktop (if graph is complex)
- Touch-friendly on mobile (tap = hover)
- Color-blind friendly palette (test with Sim Daltonism)

**Example - Coverage Chart Interactions**:
```
User Action:     Result:
─────────────    ───────────
Hover bar        → Show: "68% (34/50 functions tested)"
Click bar        → Filter table below to this file only
Right-click      → Export as PNG
```

### 5.3 Color Usage in Visualizations

**Consistency Rules**:
- Red always = critical/error severity
- Orange always = warning/medium severity
- Green always = success/good status
- Blue always = neutral/informational
- Gray always = disabled/incomplete

**Accessibility**:
- Test all charts with color-blind mode
- Never rely on color alone; use patterns/icons
- Ensure 4.5:1 contrast ratio minimum

---

## Part 6: Mobile & Responsive Design

### 6.1 Mobile Navigation (< 768px)

Replace sidebar with:
- **Hamburger Menu** (top-left, animated 3-line icon)
- **Bottom Tab Navigation** (sticky footer with 5 main sections):
  - Dashboard
  - Quality
  - Coverage
  - Dependencies
  - More (settings, help)

### 6.2 Mobile Content Optimization

**Cards**:
- Single column layout
- Metric values remain large (28px instead of 48px)
- Stack horizontally scrolling metric cards (if 6+ cards) with carousel dots

**Tables**:
- Convert to card-based layout (each row = card, columns become label+value pairs)
- Keep sort/filter buttons, move to collapsible header

**Charts**:
- Reduce complexity (pie instead of bubble, simpler legend)
- Full-width, height 300px (not 400px)
- Single-tap interactions (no hover)

**Example - Mobile Table**:
```
┌──────────────────┐
│ Search: [______] │
├──────────────────┤
│ [Error] Hardcode │ ← Badge + summary
│ src/api/auth.ts  │ ← File path
│ Line 42          │ ← Line number
│ > View           │ ← CTA
├──────────────────┤
│ [Warn] Missing.. │
│ ...              │
└──────────────────┘
```

### 6.3 Touch-Friendly Design

- **Minimum touch target size**: 44x44px
- **Button spacing**: 12px minimum between clickable elements
- **No hover states on mobile** (replace with tap states)
- **Swipe gestures**: Swipe left to collapse card details
- **Bottom sheet pattern**: For filters/modals (pull up from bottom, not centered overlay)

---

## Part 7: Accessibility Specifications

### 7.1 Color Contrast

**Text on Background**:
- Primary text (dark gray on white): 4.5:1 ratio (WCAG AA)
- Secondary text: 4.5:1 ratio minimum
- Colored text (badges, alerts): 4.5:1 against background

**Verification**: Use WebAIM Contrast Checker or browser DevTools

### 7.2 Keyboard Navigation

All interactive elements must be:
- **Focusable** (tabindex 0 or natural focus order)
- **Keyboard-operable** (Enter/Space for buttons, arrow keys for menus)
- **Focus-visible** (blue outline, 2px, visible 2px offset)
- **Logical tab order** (left-to-right, top-to-bottom)

**Skip Links**: Provide "Skip to Main Content" link (visible on Tab key)

### 7.3 Screen Reader Support

- **Semantic HTML**: Use `<button>`, `<nav>`, `<main>`, `<article>`
- **ARIA Labels**:
  - `aria-label` for icon buttons
  - `aria-labelledby` for sections
  - `aria-describedby` for tooltips
- **Live Regions**: Use `aria-live="polite"` for status updates
- **Table Headers**: Use `<th scope="col">` for column headers

**Example**:
```html
<button aria-label="Filter by severity">
  <IconFilter /> Severity
</button>

<div aria-live="polite" role="status">
  Loaded 42 issues
</div>
```

### 7.4 Motion & Animation

- **Respect prefers-reduced-motion**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- **No flash/flicker** (>3 flashes per second)
- **Animations under 3 seconds** (focus on micro-interactions, not long delays)

---

## Part 8: Performance Specifications

### 8.1 Load Time Targets

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

### 8.2 Optimization Strategies

**JavaScript**:
- Lazy-load charts (below the fold)
- Code-split detail pages
- Use React.memo for metric cards

**CSS**:
- Inline critical CSS (above fold)
- Minify and gzip
- Use CSS variables instead of preprocessor variables (smaller compiled size)

**Images**:
- Use SVG for icons
- WebP format for decorative images
- Responsive images (srcset) for banners

**Data**:
- Paginate tables (50 rows max per page)
- Lazy-load charts (intersection observer)
- Server-side render if possible

### 8.3 Caching Strategy

- **Browser Cache**: 1 week for static assets
- **API Cache**: 5 minutes for analysis results
- **Service Worker**: Cache dashboard shell for offline access (show cached data with "offline" indicator)

---

## Part 9: Detailed Wireframes

### 9.1 Desktop Dashboard (Landing Page)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Logo  Code Inventory    Last: 2025-12-08  [⚙] [📤]  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
┌─────────┬─────────────────────────────────────────────┐
│ DASH    │  Metrics Row (6 cards, 2 rows)             │
│ BOARD   │  ┌──────┐ ┌──────┐ ┌──────┐              │
│         │  │Files │ │Classes│ │Funcs │              │
│ QUALITY │  │ 42   │ │  12  │ │ 156  │              │
│         │  └──────┘ └──────┘ └──────┘              │
│ COVERAGE│  ┌──────┐ ┌──────┐ ┌──────┐              │
│         │  │Quality│ │Coverage│ │Issues│              │
│ DEPS    │  │ 42 ℹ │ │  78% ✓ │ │ 5 ⚠  │              │
│         │  └──────┘ └──────┘ └──────┘              │
│ REPO    │                                           │
│         │  Health Summary                           │
│ SETTINGS│  ┌───────────────────────────────────┐   │
│         │  │ Overall: WARNING ●                 │   │
│         │  │ Quality:    ████░░░░ 42%          │   │
│         │  │ Coverage:   ████████░░ 78% (Good) │   │
│         │  │ Dependencies: ██░░░░░░░░ 20% (4)  │   │
│         │  │ Action Items:                     │   │
│         │  │ • 5 critical issues to fix       │   │
│         │  │ • 3 untested functions in api/  │   │
│         │  │ • 2 circular dependencies        │   │
│         │  └───────────────────────────────────┘   │
│         │                                           │
│         │  Top Issues (Table)                      │
│         │  ┌─────────────────────────────────────┐ │
│         │  │ Severity │ File │ Issue │ Line │Exp│ │
│         │  │ ERROR    │ auth │ Hardcode│ 42  │→  │ │
│         │  │ WARNING  │ hash │ Missing │ 15  │→  │ │
│         │  │ INFO     │ help │ Long    │ 8   │→  │ │
│         │  └─────────────────────────────────────┘ │
│         │                                           │
│         │  Charts Row                              │
│         │  ┌──────────────┐  ┌──────────────┐     │
│         │  │ Quality By   │  │ Coverage By  │     │
│         │  │ Severity     │  │ File         │     │
│         │  │              │  │              │     │
│         │  │ 📊 Pie Chart │  │ 📊 Heatmap   │     │
│         │  └──────────────┘  └──────────────┘     │
└─────────┴─────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ Generated: 2025-12-08 | ast-grep + Schema.org MCP │
└─────────────────────────────────────────────────────┘
```

### 9.2 Desktop Code Quality Detail Page

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Logo  Code Inventory    Last: 2025-12-08  [⚙] [📤]  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
┌─────────┬─────────────────────────────────────────────┐
│ DASH    │  Dashboard > Code Quality                  │
│ BOARD   │                                             │
│         │  Summary Metrics                           │
│ QUALITY │  ┌──────┬──────┬──────┬──────┐           │
│ (active)│  │Error │Warn  │Info  │Files │           │
│         │  │ 5 🔴 │ 12 🟠 │ 8 🔵 │ 20   │           │
│ COVERAGE│  └──────┴──────┴──────┴──────┘           │
│         │                                             │
│ DEPS    │  Filters & Sort                           │
│         │  [Severity ▼] [Category ▼] [File ▼]      │
│ REPO    │  Search: [________________]               │
│         │                                             │
│ SETTINGS│  Issues Table                             │
│         │  ┌──────────────────────────────────────┐ │
│         │  │ Sev │ File      │ Issue      │L │Exp│ │
│         │  │ ERR │ auth.ts   │ Hardcode   │42│→ │ │
│         │  │     │ + Details │            │  │  │ │
│         │  │     │ Code snippet           │  │  │ │
│         │  │     │ Secret stored in code  │  │  │ │
│         │  │ WRN │ hash.ts   │ Missing    │15│→ │ │
│         │  │ INF │ api.py    │ Long func  │8 │→ │ │
│         │  │ ...                         │  │  │ │
│         │  └──────────────────────────────────────┘ │
│         │  [< Prev] 1 2 3 4 [Next >]               │
└─────────┴─────────────────────────────────────────────┘
```

### 9.3 Mobile Dashboard

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ☰  Code Inventory    ⚙  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌────────────────────────┐
│ Last: 2025-12-08       │
│ Status: WARNING ●      │
└────────────────────────┘

Metrics (Scrollable)
┌──────┐ ┌──────┐ ┌──────┐
│Files │ │Funcs │ │Classes
│ 42   │ │ 156  │ │ 12
└──────┘ └──────┘ └──────┘

Health Summary
┌────────────────────┐
│Quality   ████░░ 42%│
│Coverage  ████████░░│
│Deps      ██░░░░░░  │
│Actions (3)         │
└────────────────────┘

Issues
┌────────────────────┐
│[Error] Hardcoded   │
│src/auth.ts:42      │
│> View              │
├────────────────────┤
│[Warn] Missing Docs │
│src/utils.ts:15     │
│> View              │
└────────────────────┘

Charts (Half-width)
┌──────────┐
│ By Type  │
│ 📊       │
└──────────┘

┌─────────────────────────┐
│ 🏠 📊 ⚙ 📦 ⋯          │  ← Bottom navigation
└─────────────────────────┘
```

---

## Part 10: Component Specifications (Detailed)

### 10.1 Metric Card Component

```html
<MetricCard
  label="Test Coverage"
  value={78}
  unit="%"
  icon={<IconTest />}
  status="success"
  trend="+5%"
  onClick={() => navigate('/coverage')}
/>
```

**CSS/Styling**:
- Width: 100% (grid-based responsive)
- Padding: 20px
- Border radius: 8px
- Background: white (or status color for highlighted)
- Hover: box-shadow enhancement, translateY(-2px)

**Responsive**:
- Desktop (4 col): 25% width each
- Tablet (2 col): 50% width each
- Mobile (1 col): 100% width

### 10.2 Severity Badge Component

```html
<SeverityBadge severity="error" label="Hardcoded Secret" />
<SeverityBadge severity="warning" label="Missing Docstring" />
<SeverityBadge severity="info" label="Long Parameter List" />
```

**Colors**:
- error: #dc3545 (red)
- warning: #ff9800 (orange)
- info: #17a2b8 (cyan)

**Icon System**:
- error: ◆ (filled diamond)
- warning: ▲ (filled triangle)
- info: ● (filled circle)

### 10.3 Filter Component Group

```html
<FilterBar>
  <FilterSelect
    label="Severity"
    options={['All', 'Error', 'Warning', 'Info']}
  />
  <FilterSelect
    label="Category"
    options={[...]}
  />
  <SearchInput
    placeholder="Search issues..."
    onSearch={handleSearch}
  />
</FilterBar>
```

**Styling**:
- Display: flex, gap 12px
- Sticky on scroll (if table is tall)
- Background: white with subtle border-bottom
- Inputs: 40px height, 8px border-radius

### 10.4 Expandable Table Row

```html
<TableRow
  cells={['error', 'auth.ts', 'Hardcoded Secret', 42]}
  expanded={false}
  details={<CodeSnippet code="..." />}
/>
```

**States**:
- Collapsed: 50px height, hover shows expand icon
- Expanded: 150px+ height, shows code + suggestion + actions
- Transition: 200ms smooth height change

---

## Part 11: Interaction Patterns (Detailed)

### 11.1 Severity Filter Interaction

```
User clicks [Severity ▼]
    ↓ (Dropdown appears, 100ms slide-in animation)
User selects "Error"
    ↓ (Dropdown closes, filter applies)
Table re-sorts
    ↓ (Skeleton shows while loading, 300ms max)
Only error rows appear
    ↓ (Row cards slide in, staggered 50ms each)
Counter updates: "5 errors found"
```

### 11.2 Issue Expansion Interaction

```
User clicks issue row
    ↓ (Row highlights, border-left color changes)
Code snippet animates in
    ↓ (Opacity 0→1, max-height 0→300px, 200ms)
Suggestion text fades in
    ↓ (Staggered 50ms after code)
[Ignore] [Mark Fixed] [Learn] buttons appear
    ↓ (User clicks "Learn")
New tab opens to docs
```

### 11.3 Chart Drill-Down

```
User hovers pie chart slice "Warnings: 12"
    ↓ (Slice zooms 5%, tooltip appears)
User clicks slice
    ↓ (Pie rotates to center that slice, 300ms animation)
Table below filters to warnings only
    ↓ (Table re-renders with filtered data)
```

---

## Part 12: Error States & Edge Cases

### 12.1 Empty States

**When no data available**:

```
┌─────────────────────────────────┐
│                                 │
│          📁                     │  ← Large icon (48px)
│    No Issues Found              │  ← Heading
│                                 │
│  All code quality rules passed. │  ← Explanation
│  Great work!                    │
│                                 │
│  [Run Analysis] [View Settings] │  ← Actions
│                                 │
└─────────────────────────────────┘
```

### 12.2 Error States

**When analysis fails**:

```
┌──────────────────────────────────┐
│ ⚠ Analysis Failed                │
│                                  │
│ Unable to load coverage data.    │
│ Error: Timeout during ast-grep   │
│ analysis (30s limit exceeded)    │
│                                  │
│ [Retry] [View Logs] [Report Bug] │
└──────────────────────────────────┘
```

### 12.3 Loading States

**While fetching data**:

```
┌──────────────────────────────────┐
│ Loading Analysis Results...      │  ← Loading message
│                                  │
│ [████████░░░░░░░░░░░░░░] 35%    │  ← Progress bar
│                                  │
│ Processing: Code Quality         │  ← Current step
│ (2 of 4 analyzers)              │
└──────────────────────────────────┘
```

### 12.4 Timeout Handling

- **Analyzer timeout (30s)**: Show partial results with warning badge
- **Dashboard load timeout (10s)**: Show cached data with "stale" indicator
- **API timeout (5s)**: Show toast: "Connection slow, retrying..."

---

## Part 13: Settings & Customization

### 13.1 Dashboard Preferences

**Available Settings**:
- Theme: Light / Dark / Auto
- Chart type preference: Simple / Advanced
- Email notifications: On/Off
- Frequency: Daily / Weekly
- Data export format: JSON / CSV / YAML
- Issue grouping: By File / By Severity / By Category

### 13.2 Metric Card Customization

Allow users to:
- Drag & reorder cards on dashboard
- Show/hide specific metrics
- Set custom thresholds (e.g., "Alert when coverage < 65%")
- Bookmark important sections

---

## Part 14: Typography Pairing Examples

### 14.1 Desktop Headlines

```
h1 "Code Quality Report"
   Family: Inter
   Size: 32px
   Weight: 700
   Letter-spacing: 0.5px

h2 "Critical Issues"
   Size: 24px
   Weight: 600

h3 "Hardcoded Secrets"
   Size: 18px
   Weight: 600
```

### 14.2 Body Text

```
Paragraph (body)
  Family: Segoe UI, -apple-system, sans-serif
  Size: 14px
  Weight: 400
  Line-height: 1.6

Label (form)
  Size: 12px
  Weight: 600
  Text-transform: uppercase
  Letter-spacing: 0.5px
  Color: #666
```

---

## Part 15: Animation & Micromotion Specs

### 15.1 Timing Functions

- **Entrance (in)**: cubic-bezier(0.34, 1.56, 0.64, 1) [bounce slightly]
- **Exit (out)**: cubic-bezier(0.25, 0.46, 0.45, 0.94) [easing]
- **Quick feedback**: cubic-bezier(0.4, 0, 0.2, 1) [material design]
- **Smooth scroll**: cubic-bezier(0.25, 0.25, 0.75, 0.75)

### 15.2 Duration Guidelines

| Animation | Duration | Use Case |
|-----------|----------|----------|
| Button press | 150ms | click feedback |
| Card hover | 200ms | elevation change |
| Modal open | 300ms | entrance |
| Page transition | 250ms | route change |
| Row expand | 200ms | detail reveal |
| Chart transition | 500ms | data updates |
| Large element enter | 600ms | above-fold entrance |

### 15.3 Stagger Pattern

When revealing multiple items (rows, cards):
```css
.item:nth-child(1) { animation-delay: 0ms; }
.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 100ms; }
```

Maximum 300ms total stagger (prevents frustration).

---

## Part 16: Implementation Checklist

### Phase 1: Core Dashboard (Week 1-2)
- [ ] Design system (colors, typography, spacing)
- [ ] Layout & navigation structure
- [ ] Metric cards & health summary
- [ ] Top issues table
- [ ] Basic responsive design

### Phase 2: Detailed Pages (Week 3-4)
- [ ] Code Quality detail page
- [ ] Test Coverage detail page
- [ ] Dependencies detail page
- [ ] Filter/sort interactions
- [ ] Mobile layout refinement

### Phase 3: Visualizations (Week 5-6)
- [ ] Issue distribution pie chart
- [ ] Coverage progress bars
- [ ] Dependencies bubble chart
- [ ] File heatmap
- [ ] Chart interactions

### Phase 4: Polish & Accessibility (Week 7-8)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Mobile touch testing
- [ ] Performance optimization

### Phase 5: Advanced Features (Week 9+)
- [ ] Dark mode implementation
- [ ] Custom theming
- [ ] Export functionality
- [ ] Analytics & trending
- [ ] Real-time updates (WebSocket)

---

## Part 17: Testing Strategy

### 17.1 Visual Testing

- **Component library**: Storybook for all components in isolation
- **Responsive testing**: Mobile (320px, 375px, 414px), Tablet (768px, 1024px), Desktop (1440px)
- **Cross-browser**: Chrome, Firefox, Safari, Edge
- **Screenshot diffing**: Percy or Chromatic for regression detection

### 17.2 Interaction Testing

- **Unit tests**: Filter logic, sorting, calculations
- **E2E tests**: User journeys (Dashboard → Quality → Issue Detail)
- **Accessibility tests**: axe-core, WAVE for WCAG violations
- **Performance tests**: Lighthouse CI for Core Web Vitals

### 17.3 User Testing

- **Moderated sessions**: 5 developers reviewing dashboard
- **Task completion**: Can they find critical issues in < 2 min?
- **Navigation clarity**: Sidebar vs. tabs vs. breadcrumbs preference
- **Data interpretation**: Do metric labels communicate clearly?

---

## Part 18: Maintenance & Evolution

### 18.1 Design System Updates

When adding new features:
1. Check if design system already covers it
2. If not, add to system (document new colors, patterns, sizes)
3. Update component library
4. Run regression tests

### 18.2 Performance Monitoring

- **Track Core Web Vitals** monthly
- **Monitor font loading** (avoid blocking render)
- **Audit bundle size** quarterly
- **Test with slow networks** (throttle to Fast 3G monthly)

### 18.3 Accessibility Audits

- **Monthly scans**: axe-core automated
- **Quarterly manual testing**: Screen reader + keyboard
- **Annual WCAG 2.1 AA assessment**: With accessibility expert

---

## Part 19: Glossary & Definitions

| Term | Definition |
|------|-----------|
| **Above the fold** | Content visible without scrolling |
| **Call-to-action (CTA)** | Button/link encouraging specific user action |
| **Drill-down** | Navigation from summary view to detailed view |
| **Elevation** | Perceived depth created by shadows |
| **Heatmap** | Visual representation using color intensity |
| **Live region** | Dynamic content that screen readers announce |
| **Meta variable** | Variable from ast-grep pattern match |
| **Micro-interaction** | Small, focused animation or transition |
| **Progressive disclosure** | Revealing information gradually, as needed |
| **Skeleton screen** | Placeholder showing expected layout while loading |
| **Toast** | Temporary notification at screen edge |
| **Trackability** | Ability to trace action back to intent |

---

## Part 20: Design Decisions Rationale

### Why Progressive Disclosure?

Code analysis generates large datasets. Showing all information at once creates cognitive overload. Progressive disclosure lets users explore gradually: they see summaries first, then drill into details only when interested.

### Why Semantic Color?

Using red for errors, green for success creates instant pattern recognition. Users don't need to read labels to understand severity. This follows industry conventions (traffic lights, status indicators).

### Why Horizontal Bar Charts Over Pie Charts?

Horizontal bar charts are better for comparing values (which category has most issues). Pie charts show proportions but make comparison difficult. We use bars as default, pies only when proportion matters most.

### Why Responsive Sidebar → Bottom Nav?

Desktop users benefit from persistent sidebar (reduces context switching). Mobile users need full-width content; bottom nav provides quick access without reducing content space.

### Why Metric Cards as Primary Content?

Developers want rapid assessment: "Is my code healthy?" Card metrics enable scanning in seconds. Detailed analysis is secondary; it's for investigation, not routine checks.

---

## Appendices

### Appendix A: Sample Component Code (React)

**MetricCard Component**:
```jsx
export const MetricCard = ({ label, value, unit, icon, status, trend, onClick }) => (
  <div className={`metric-card metric-card--${status}`} onClick={onClick}>
    <div className="metric-header">
      {icon && <span className="metric-icon">{icon}</span>}
      <span className="metric-label">{label}</span>
    </div>
    <div className="metric-value">
      {value}
      {unit && <span className="metric-unit">{unit}</span>}
    </div>
    {trend && (
      <div className="metric-trend">
        <span className="trend-arrow">↑</span>
        {trend}
      </div>
    )}
  </div>
);
```

### Appendix B: Color Reference

```css
:root {
  --color-primary: #0066cc;
  --color-primary-light: #e6f0ff;
  --color-neutral-dark: #1a1a1a;
  --color-neutral-medium: #666666;
  --color-neutral-light: #f5f5f5;
  --color-success: #28a745;
  --color-warning: #ff9800;
  --color-error: #dc3545;
  --color-info: #17a2b8;
  --color-muted: #999999;
}
```

### Appendix C: Responsive Breakpoints

```css
$mobile: 320px;
$tablet: 768px;
$laptop: 1024px;
$desktop: 1440px;
$wide: 1920px;
```

### Appendix D: Accessibility Resources

- WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- axe DevTools: https://www.deque.com/axe/devtools/
- Color-blind simulation: https://www.color-blindness.com/coblis-color-blindness-simulator/

---

**Document Status**: Complete
**Last Updated**: December 2025
**Next Review**: March 2026
**Stakeholders**: Frontend Team, Product Managers, QA Engineers
