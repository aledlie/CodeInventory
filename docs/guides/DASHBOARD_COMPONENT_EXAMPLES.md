# Code Inventory Dashboard: Component Examples & Code Snippets

This document provides production-ready HTML/CSS/JavaScript code for implementing the dashboard design outlined in DASHBOARD_UI_UX_DESIGN.md.

---

## Table of Contents

1. [Design System Setup](#design-system-setup)
2. [Metric Cards](#metric-cards)
3. [Health Summary](#health-summary)
4. [Data Tables](#data-tables)
5. [Charts & Visualizations](#charts--visualizations)
6. [Filter Components](#filter-components)
7. [Responsive Layouts](#responsive-layouts)
8. [Accessibility Implementation](#accessibility-implementation)

---

## Design System Setup

### CSS Variables (Design Tokens)

Create a `design-tokens.css` file:

```css
:root {
  /* Colors */
  --color-primary: #0066cc;
  --color-primary-light: #e6f0ff;
  --color-primary-dark: #0052a3;

  --color-neutral-dark: #1a1a1a;
  --color-neutral-medium: #666666;
  --color-neutral-light: #f5f5f5;
  --color-neutral-white: #ffffff;

  --color-success: #28a745;
  --color-success-light: #d4edda;
  --color-warning: #ff9800;
  --color-warning-light: #ffe0b2;
  --color-error: #dc3545;
  --color-error-light: #f8d7da;
  --color-info: #17a2b8;
  --color-info-light: #d1ecf1;

  --color-muted: #999999;
  --color-border: #e0e0e0;

  /* Typography */
  --font-family-base: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  --font-family-display: 'Inter', 'Segoe UI', -apple-system, sans-serif;
  --font-family-mono: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

  --font-size-h1: 32px;
  --font-size-h2: 24px;
  --font-size-h3: 18px;
  --font-size-body: 14px;
  --font-size-small: 12px;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.4;
  --line-height-normal: 1.6;
  --line-height-relaxed: 1.8;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.16);
  --shadow-focus: inset 0 0 0 2px #0066cc;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 50%;

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-index Scale */
  --z-dropdown: 1000;
  --z-modal: 1100;
  --z-tooltip: 1200;
  --z-navigation: 999;
}

/* Dark Mode (optional) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-neutral-dark: #f5f5f7;
    --color-neutral-medium: #999999;
    --color-neutral-light: #2d2d2d;
    --color-neutral-white: #1a1a1a;
    --color-border: #333333;
  }
}

/* Responsive Font Sizes */
@media (max-width: 768px) {
  :root {
    --font-size-h1: 24px;
    --font-size-h2: 20px;
    --font-size-h3: 16px;
  }
}
```

### Global Styles

```css
/* Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  line-height: var(--line-height-normal);
  color: var(--color-neutral-dark);
  background: var(--color-neutral-light);
}

/* Typography */
h1 {
  font-family: var(--font-family-display);
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: 0.5px;
}

h2 {
  font-family: var(--font-family-display);
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

h3 {
  font-family: var(--font-family-display);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

p {
  margin-bottom: var(--spacing-md);
}

code {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  background: var(--color-neutral-light);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

/* Accessibility */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Metric Cards

### HTML Structure

```html
<div class="metrics-grid">
  <div class="metric-card metric-card--primary">
    <div class="metric-header">
      <span class="metric-icon" aria-hidden="true">📄</span>
      <span class="metric-label">Code Files</span>
    </div>
    <div class="metric-value">42</div>
    <div class="metric-trend metric-trend--up">
      <span aria-hidden="true">↑</span>
      <span>5 this week</span>
    </div>
  </div>

  <div class="metric-card metric-card--success">
    <div class="metric-header">
      <span class="metric-icon" aria-hidden="true">✓</span>
      <span class="metric-label">Test Coverage</span>
    </div>
    <div class="metric-value">78<span class="metric-unit">%</span></div>
    <div class="metric-trend metric-trend--stable">
      <span aria-hidden="true">→</span>
      <span>Good (70-85%)</span>
    </div>
  </div>

  <div class="metric-card metric-card--error">
    <div class="metric-header">
      <span class="metric-icon" aria-hidden="true">⚠</span>
      <span class="metric-label">Critical Issues</span>
    </div>
    <div class="metric-value">5</div>
    <div class="metric-trend metric-trend--down">
      <span aria-hidden="true">↑</span>
      <span>Requires attention</span>
    </div>
  </div>
</div>
```

### CSS

```css
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.metric-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  background: var(--color-neutral-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-base);
  cursor: pointer;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.metric-card:focus-within {
  box-shadow: var(--shadow-md), var(--shadow-focus);
}

/* Primary Variant */
.metric-card--primary {
  background: var(--color-primary);
  color: var(--color-neutral-white);
}

.metric-card--primary .metric-label {
  color: rgba(255, 255, 255, 0.9);
}

/* Success Variant */
.metric-card--success {
  border-left: 4px solid var(--color-success);
}

/* Error Variant */
.metric-card--error {
  border-left: 4px solid var(--color-error);
  background: rgba(220, 53, 69, 0.02);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.metric-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.metric-label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-neutral-medium);
}

.metric-value {
  font-size: 48px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: var(--spacing-md);
}

.metric-card--primary .metric-value {
  color: var(--color-neutral-white);
}

.metric-unit {
  font-size: 24px;
  margin-left: var(--spacing-xs);
}

.metric-trend {
  font-size: var(--font-size-small);
  color: var(--color-neutral-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.metric-trend--up {
  color: var(--color-success);
}

.metric-trend--down {
  color: var(--color-error);
}

.metric-trend--stable {
  color: var(--color-neutral-medium);
}

/* Responsive */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }

  .metric-value {
    font-size: 32px;
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .metric-card {
    padding: var(--spacing-md);
  }
}
```

---

## Health Summary

### HTML Structure

```html
<div class="health-summary">
  <div class="health-header">
    <h2>Code Health Overview</h2>
    <div class="health-status" aria-label="Overall status: Warning">
      <span class="health-badge health-badge--warning">
        <span class="health-dot" aria-hidden="true">●</span>
        WARNING
      </span>
    </div>
  </div>

  <div class="health-metrics">
    <div class="health-metric">
      <label class="health-label">Code Quality</label>
      <div class="health-bar-container">
        <div class="health-bar" style="width: 42%;" aria-valuenow="42" role="progressbar">
          <span class="health-bar-text">42%</span>
        </div>
      </div>
    </div>

    <div class="health-metric">
      <label class="health-label">Test Coverage</label>
      <div class="health-bar-container">
        <div class="health-bar health-bar--success" style="width: 78%;" aria-valuenow="78" role="progressbar">
          <span class="health-bar-text">78%</span>
        </div>
      </div>
    </div>

    <div class="health-metric">
      <label class="health-label">Dependency Health</label>
      <div class="health-bar-container">
        <div class="health-bar health-bar--warning" style="width: 58%;" aria-valuenow="58" role="progressbar">
          <span class="health-bar-text">58% (4 circular)</span>
        </div>
      </div>
    </div>
  </div>

  <div class="health-actions">
    <h3>Action Items</h3>
    <ul class="action-list" role="list">
      <li class="action-item action-item--critical">
        <span class="action-icon" aria-hidden="true">◆</span>
        <span>5 critical code smells need review</span>
      </li>
      <li class="action-item action-item--warning">
        <span class="action-icon" aria-hidden="true">▲</span>
        <span>8 untested functions in api/ module</span>
      </li>
      <li class="action-item action-item--error">
        <span class="action-icon" aria-hidden="true">!</span>
        <span>Circular dependency detected: models/ ↔ utils/</span>
      </li>
    </ul>
  </div>
</div>
```

### CSS

```css
.health-summary {
  background: var(--color-neutral-white);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-xl);
}

.health-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.health-header h2 {
  margin: 0;
}

.health-status {
  flex-shrink: 0;
}

.health-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.health-badge--warning {
  background: rgba(255, 152, 0, 0.1);
  color: var(--color-warning);
}

.health-badge--error {
  background: rgba(220, 53, 69, 0.1);
  color: var(--color-error);
}

.health-badge--success {
  background: rgba(40, 167, 69, 0.1);
  color: var(--color-success);
}

.health-dot {
  font-size: 8px;
  display: inline-block;
}

.health-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.health-metric {
  display: flex;
  flex-direction: column;
}

.health-label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-neutral-medium);
  margin-bottom: var(--spacing-sm);
}

.health-bar-container {
  position: relative;
  height: 32px;
  background: var(--color-neutral-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.health-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-warning), var(--color-error));
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: var(--spacing-sm);
  transition: width var(--transition-slow);
  position: relative;
}

.health-bar--success {
  background: linear-gradient(90deg, var(--color-success), var(--color-success));
}

.health-bar--warning {
  background: linear-gradient(90deg, var(--color-warning), var(--color-warning));
}

.health-bar-text {
  color: var(--color-neutral-white);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  z-index: 1;
}

.health-actions {
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.health-actions h3 {
  margin-bottom: var(--spacing-md);
}

.action-list {
  list-style: none;
  display: grid;
  gap: var(--spacing-md);
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-neutral-light);
  border-left: 4px solid var(--color-neutral-medium);
  border-radius: var(--radius-sm);
}

.action-item--critical {
  border-left-color: var(--color-error);
  background: rgba(220, 53, 69, 0.02);
}

.action-item--warning {
  border-left-color: var(--color-warning);
  background: rgba(255, 152, 0, 0.02);
}

.action-item--error {
  border-left-color: var(--color-error);
  background: rgba(220, 53, 69, 0.02);
}

.action-icon {
  font-size: 18px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}
```

---

## Data Tables

### HTML Structure

```html
<div class="table-container">
  <div class="table-controls">
    <div class="filter-group">
      <select class="filter-select" aria-label="Filter by severity">
        <option value="all">All Severities</option>
        <option value="error">Error</option>
        <option value="warning">Warning</option>
        <option value="info">Info</option>
      </select>

      <select class="filter-select" aria-label="Filter by category">
        <option value="all">All Categories</option>
        <option value="code_smell">Code Smell</option>
        <option value="security">Security</option>
        <option value="documentation">Documentation</option>
      </select>
    </div>

    <div class="search-group">
      <input
        type="text"
        class="search-input"
        placeholder="Search by file or issue..."
        aria-label="Search issues"
      />
      <span class="search-icon" aria-hidden="true">🔍</span>
    </div>
  </div>

  <table class="issue-table" role="table">
    <thead>
      <tr role="row">
        <th role="columnheader" aria-sort="ascending">Severity</th>
        <th role="columnheader">File</th>
        <th role="columnheader">Issue</th>
        <th role="columnheader">Line</th>
        <th role="columnheader">Action</th>
      </tr>
    </thead>
    <tbody>
      <tr class="table-row table-row--error" role="row">
        <td class="severity-cell">
          <span class="severity-badge severity-badge--error">
            <span aria-hidden="true">◆</span> Error
          </span>
        </td>
        <td>src/api/auth.ts</td>
        <td class="issue-title">Hardcoded Secret</td>
        <td>42</td>
        <td>
          <button class="action-button" aria-label="Expand issue details">→</button>
        </td>
      </tr>

      <tr class="table-row table-row--expanded" role="row">
        <td colspan="5" class="expanded-details">
          <div class="code-snippet">
            <pre><code>40: const secret = "abc123xyz";
41: const token = jwt.sign(data,
42: > secret);  &lt;-- Hardcoded secret</code></pre>
          </div>
          <p class="issue-description">
            <strong>Issue:</strong> Hardcoded secrets should be stored in environment variables.
          </p>
          <p class="issue-suggestion">
            <strong>Suggestion:</strong> Use <code>process.env.JWT_SECRET</code> instead.
          </p>
          <div class="action-buttons">
            <button class="btn btn--secondary">Ignore</button>
            <button class="btn btn--secondary">Mark as Fixed</button>
            <button class="btn btn--primary">View Details</button>
          </div>
        </td>
      </tr>

      <tr class="table-row table-row--warning" role="row">
        <td class="severity-cell">
          <span class="severity-badge severity-badge--warning">
            <span aria-hidden="true">▲</span> Warning
          </span>
        </td>
        <td>src/utils/hash.ts</td>
        <td class="issue-title">Missing Docstring</td>
        <td>15</td>
        <td>
          <button class="action-button" aria-label="Expand issue details">→</button>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="table-pagination">
    <button class="btn btn--secondary" aria-label="Previous page">← Previous</button>
    <span aria-label="Current page">Page 1 of 3</span>
    <button class="btn btn--secondary" aria-label="Next page">Next →</button>
  </div>
</div>
```

### CSS

```css
.table-container {
  background: var(--color-neutral-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);
}

.table-controls {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  cursor: pointer;
  transition: var(--transition-fast);
}

.filter-select:hover,
.filter-select:focus {
  border-color: var(--color-primary);
  outline: none;
}

.search-group {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  padding-right: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  transition: var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 16px;
}

/* Table */
.issue-table {
  width: 100%;
  border-collapse: collapse;
}

.issue-table thead {
  background: var(--color-neutral-light);
  sticky top 0;
  z-index: 10;
}

.issue-table th {
  padding: var(--spacing-md);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-neutral-medium);
  border-bottom: 2px solid var(--color-border);
  cursor: pointer;
}

.issue-table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.table-row {
  transition: background-color var(--transition-fast);
}

.table-row:hover {
  background-color: var(--color-neutral-light);
}

.severity-cell {
  font-weight: var(--font-weight-semibold);
}

.severity-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  white-space: nowrap;
}

.severity-badge--error {
  background: rgba(220, 53, 69, 0.1);
  color: var(--color-error);
}

.severity-badge--warning {
  background: rgba(255, 152, 0, 0.1);
  color: var(--color-warning);
}

.severity-badge--info {
  background: rgba(23, 162, 184, 0.1);
  color: var(--color-info);
}

.issue-title {
  font-weight: var(--font-weight-semibold);
}

.action-button {
  background: transparent;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 18px;
  padding: var(--spacing-xs);
  transition: var(--transition-fast);
}

.action-button:hover {
  transform: scale(1.2);
}

/* Expanded Row */
.table-row--expanded {
  background: var(--color-neutral-light);
}

.expanded-details {
  padding: var(--spacing-lg) !important;
  background: rgba(0, 102, 204, 0.02) !important;
  border-top: 2px solid var(--color-primary);
}

.code-snippet {
  background: var(--color-neutral-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  overflow-x: auto;
}

.code-snippet code {
  font-family: var(--font-family-mono);
  font-size: 12px;
  background: transparent;
  padding: 0;
}

.code-snippet pre {
  margin: 0;
  line-height: 1.6;
}

.issue-description,
.issue-suggestion {
  font-size: var(--font-size-small);
  margin-bottom: var(--spacing-md);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.action-buttons .btn {
  flex: 1;
}

/* Pagination */
.table-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  font-size: var(--font-size-small);
}

/* Buttons */
.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn--primary {
  background: var(--color-primary);
  color: var(--color-neutral-white);
}

.btn--primary:hover {
  background: var(--color-primary-dark);
}

.btn--secondary {
  background: var(--color-neutral-light);
  color: var(--color-neutral-dark);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover {
  background: var(--color-border);
}

/* Mobile */
@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
  }

  .filter-group {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }

  .search-group {
    min-width: auto;
  }

  /* Card-based layout for small screens */
  .issue-table {
    border-collapse: visible;
  }

  .issue-table thead {
    display: none;
  }

  .table-row {
    display: block;
    margin-bottom: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--color-neutral-white);
  }

  .issue-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  .issue-table td::before {
    content: attr(data-label);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-small);
    text-transform: uppercase;
    color: var(--color-neutral-medium);
  }

  .expanded-details {
    display: block !important;
  }
}
```

---

## Charts & Visualizations

### HTML Structure (Pie Chart Example)

```html
<div class="chart-container">
  <div class="chart-header">
    <h3>Issues by Severity</h3>
  </div>

  <div class="chart-wrapper">
    <canvas id="severity-chart" width="300" height="300" role="img" aria-label="Issues by severity distribution"></canvas>
  </div>

  <div class="chart-legend">
    <div class="legend-item">
      <span class="legend-color" style="background: var(--color-error);" aria-hidden="true"></span>
      <span class="legend-label">Errors</span>
      <span class="legend-value">8 (20%)</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background: var(--color-warning);" aria-hidden="true"></span>
      <span class="legend-label">Warnings</span>
      <span class="legend-value">15 (37%)</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background: var(--color-info);" aria-hidden="true"></span>
      <span class="legend-label">Info</span>
      <span class="legend-value">18 (43%)</span>
    </div>
  </div>
</div>
```

### JavaScript (Chart.js Implementation)

```javascript
// Severity Chart
const severityCtx = document.getElementById('severity-chart').getContext('2d');
const severityChart = new Chart(severityCtx, {
  type: 'doughnut',
  data: {
    labels: ['Errors', 'Warnings', 'Info'],
    datasets: [{
      data: [8, 15, 18],
      backgroundColor: [
        'var(--color-error)',
        'var(--color-warning)',
        'var(--color-info)'
      ],
      borderColor: 'var(--color-neutral-white)',
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'none' // We use custom legend
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ': ' + context.parsed + ' items';
          }
        }
      }
    }
  }
});
```

### CSS for Charts

```css
.chart-container {
  background: var(--color-neutral-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.chart-header {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.chart-header h3 {
  margin: 0;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
  max-height: 400px;
}

.chart-wrapper canvas {
  width: 100% !important;
  height: auto !important;
}

.chart-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-neutral-light);
  border-radius: var(--radius-sm);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-small);
}

.legend-value {
  font-size: var(--font-size-small);
  color: var(--color-neutral-medium);
  font-weight: var(--font-weight-semibold);
}
```

---

## Filter Components

### HTML Structure

```html
<div class="filter-bar">
  <div class="filter-control">
    <label for="severity-filter" class="filter-label">Severity</label>
    <select id="severity-filter" class="filter-select" aria-label="Filter by severity">
      <option value="">All</option>
      <option value="error">Error</option>
      <option value="warning">Warning</option>
      <option value="info">Info</option>
    </select>
  </div>

  <div class="filter-control">
    <label for="category-filter" class="filter-label">Category</label>
    <select id="category-filter" class="filter-select" aria-label="Filter by category">
      <option value="">All Categories</option>
      <option value="code_smell">Code Smell</option>
      <option value="security">Security</option>
      <option value="documentation">Documentation</option>
      <option value="best_practice">Best Practice</option>
    </select>
  </div>

  <div class="filter-control filter-control--search">
    <label for="search-input" class="filter-label">Search</label>
    <div class="search-wrapper">
      <input
        type="text"
        id="search-input"
        class="filter-input"
        placeholder="Search files or issues..."
        aria-label="Search"
      />
      <span class="search-icon" aria-hidden="true">🔍</span>
    </div>
  </div>

  <div class="filter-actions">
    <button class="btn btn--secondary" aria-label="Clear all filters">Clear</button>
  </div>
</div>
```

### CSS

```css
.filter-bar {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-neutral-white);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
  align-items: flex-end;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.filter-control {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.filter-label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-neutral-medium);
}

.filter-select,
.filter-input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  transition: var(--transition-fast);
}

.filter-select:hover,
.filter-input:hover {
  border-color: var(--color-primary);
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.filter-control--search {
  flex: 1;
  min-width: 200px;
}

.search-wrapper {
  position: relative;
}

.filter-input {
  width: 100%;
  padding-right: 32px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 16px;
}

.filter-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Mobile */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-control {
    width: 100%;
  }

  .filter-control--search {
    min-width: auto;
  }

  .filter-select,
  .filter-input {
    width: 100%;
  }

  .filter-actions {
    width: 100%;
  }

  .btn {
    flex: 1;
  }
}
```

---

## Responsive Layouts

### Header Layout

```html
<header class="dashboard-header">
  <div class="header-content">
    <div class="header-left">
      <div class="logo">Code Inventory</div>
      <h1>Code Analysis Dashboard</h1>
    </div>

    <div class="header-right">
      <div class="header-info">
        <span class="info-label">Last Generated:</span>
        <span class="info-value">2025-12-08 14:32:15</span>
      </div>
      <button class="icon-button" aria-label="Settings">⚙</button>
      <button class="icon-button" aria-label="Export">📤</button>
    </div>
  </div>
</header>
```

### CSS

```css
.dashboard-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, #0052a3 100%);
  color: var(--color-neutral-white);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}

.header-left {
  flex: 1;
}

.logo {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--spacing-sm);
  opacity: 0.9;
}

.header-left h1 {
  margin: 0;
  color: var(--color-neutral-white);
  font-size: var(--font-size-h1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
  font-size: var(--font-size-small);
}

.info-label {
  opacity: 0.8;
}

.info-value {
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-mono);
}

.icon-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: var(--color-neutral-white);
  font-size: 20px;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.icon-button:focus {
  outline: 2px solid var(--color-neutral-white);
  outline-offset: 2px;
}

/* Mobile */
@media (max-width: 768px) {
  .dashboard-header {
    padding: var(--spacing-lg);
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .header-info {
    align-items: flex-start;
  }

  .header-left h1 {
    font-size: var(--font-size-h2);
  }
}
```

---

## Accessibility Implementation

### ARIA Attributes

```html
<!-- Status regions -->
<div aria-live="polite" aria-atomic="true" role="status">
  Loaded 42 issues
</div>

<!-- Table headers -->
<table role="table">
  <thead>
    <tr role="row">
      <th role="columnheader" aria-sort="ascending">Severity</th>
      <th role="columnheader" aria-sort="none">File</th>
    </tr>
  </thead>
</table>

<!-- Progress bars -->
<div class="progress-bar" role="progressbar" aria-valuenow="78" aria-valuemin="0" aria-valuemax="100" aria-label="Test coverage">
  <div style="width: 78%"></div>
</div>

<!-- Buttons with labels -->
<button aria-label="Filter by severity">Severity ▼</button>

<!-- Expanded sections -->
<details>
  <summary aria-expanded="false">Show Details</summary>
  Content here
</details>
```

### Keyboard Navigation

```javascript
// Tab through all interactive elements
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close open menus
    closeAllMenus();
  }

  if (e.key === 'Enter' && e.target.classList.contains('table-row')) {
    // Expand/collapse table row
    toggleRowExpansion(e.target);
  }
});

// Arrow keys for select menus
selectElements.forEach(select => {
  select.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Navigate menu items
    }
  });
});
```

### Focus Management

```css
/* Visible focus indicators */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  z-index: var(--z-tooltip);
}

.skip-link:focus {
  top: 0;
}
```

---

## Implementation Notes

1. **Design System**: Start with CSS variables for theming consistency
2. **Responsive**: Mobile-first approach, enhance for larger screens
3. **Accessibility**: All interactive elements must be keyboard-navigable and properly labeled
4. **Performance**: Lazy-load charts, paginate large tables, cache data
5. **Testing**: Use Storybook for component isolation, Cypress for E2E tests

---

**Document Status**: Complete
**Last Updated**: December 2025
**Next Steps**: Integrate with existing dashboard.py generator, add Chart.js library
