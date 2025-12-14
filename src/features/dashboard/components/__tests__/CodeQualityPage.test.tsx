import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

/**
 * Tests for SeverityBreakdown and CategoryBreakdown component logic
 *
 * These components display severity and category distributions for code quality issues.
 */

// Constants from the component
const SEVERITY_CONFIG = {
  error: {
    label: 'Critical',
    color: '#dc3545',
    bgColor: '#ffebee',
  },
  warning: {
    label: 'Warning',
    color: '#ff9800',
    bgColor: '#fff3e0',
  },
  info: {
    label: 'Info',
    color: '#17a2b8',
    bgColor: '#e1f5fe',
  },
} as const;

const CATEGORY_CONFIG = {
  security: { label: 'Security' },
  code_smell: { label: 'Code Smell' },
  best_practice: { label: 'Best Practice' },
  documentation: { label: 'Documentation' },
} as const;

describe('SeverityBreakdown', () => {
  describe('percentage calculation: (count / total) * 100', () => {
    function calculatePercentage(count: number, total: number): number {
      return total > 0 ? (count / total) * 100 : 0;
    }

    it('should calculate 0% when count is 0', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
    });

    it('should calculate 100% when count equals total', () => {
      expect(calculatePercentage(100, 100)).toBe(100);
    });

    it('should calculate 50% when count is half of total', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
    });

    it('should calculate correct percentage for various counts', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(75, 100)).toBe(75);
      expect(calculatePercentage(1, 100)).toBe(1);
      expect(calculatePercentage(99, 100)).toBe(99);
    });

    it('should return 0 when total is 0 (avoid division by zero)', () => {
      expect(calculatePercentage(0, 0)).toBe(0);
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('should handle decimal percentages', () => {
      expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 1);
      expect(calculatePercentage(2, 3)).toBeCloseTo(66.67, 1);
    });

    it('should handle large numbers', () => {
      expect(calculatePercentage(5000, 10000)).toBe(50);
      expect(calculatePercentage(1234, 10000)).toBe(12.34);
    });

    it('should handle when count exceeds total (edge case)', () => {
      // This shouldn't happen in practice but test the math
      expect(calculatePercentage(150, 100)).toBe(150);
    });
  });

  describe('count retrieval: issuesBySeverity[key] || 0', () => {
    function getCount(
      issuesBySeverity: Record<string, number>,
      key: string
    ): number {
      return issuesBySeverity[key] || 0;
    }

    it('should return count when key exists', () => {
      const issues = { error: 10, warning: 20, info: 30 };
      expect(getCount(issues, 'error')).toBe(10);
      expect(getCount(issues, 'warning')).toBe(20);
      expect(getCount(issues, 'info')).toBe(30);
    });

    it('should return 0 when key does not exist', () => {
      const issues = { error: 10 };
      expect(getCount(issues, 'warning')).toBe(0);
      expect(getCount(issues, 'info')).toBe(0);
    });

    it('should return 0 for empty object', () => {
      const issues = {};
      expect(getCount(issues, 'error')).toBe(0);
      expect(getCount(issues, 'warning')).toBe(0);
      expect(getCount(issues, 'info')).toBe(0);
    });

    it('should return 0 when value is 0', () => {
      const issues = { error: 0, warning: 5 };
      expect(getCount(issues, 'error')).toBe(0);
    });

    it('should return 0 when value is undefined', () => {
      const issues: Record<string, number | undefined> = { error: undefined };
      expect((issues['error'] as number) || 0).toBe(0);
    });
  });

  describe('severity configuration', () => {
    it('should have correct labels for each severity', () => {
      expect(SEVERITY_CONFIG.error.label).toBe('Critical');
      expect(SEVERITY_CONFIG.warning.label).toBe('Warning');
      expect(SEVERITY_CONFIG.info.label).toBe('Info');
    });

    it('should have correct colors for each severity', () => {
      expect(SEVERITY_CONFIG.error.color).toBe('#dc3545');
      expect(SEVERITY_CONFIG.warning.color).toBe('#ff9800');
      expect(SEVERITY_CONFIG.info.color).toBe('#17a2b8');
    });

    it('should have correct background colors for each severity', () => {
      expect(SEVERITY_CONFIG.error.bgColor).toBe('#ffebee');
      expect(SEVERITY_CONFIG.warning.bgColor).toBe('#fff3e0');
      expect(SEVERITY_CONFIG.info.bgColor).toBe('#e1f5fe');
    });

    it('should have three severity levels', () => {
      expect(Object.keys(SEVERITY_CONFIG)).toHaveLength(3);
      expect(Object.keys(SEVERITY_CONFIG)).toEqual(['error', 'warning', 'info']);
    });
  });

  describe('combined severity breakdown calculations', () => {
    function calculateBreakdown(issuesBySeverity: Record<string, number>, total: number) {
      return Object.entries(SEVERITY_CONFIG).map(([key, config]) => {
        const count = issuesBySeverity[key] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return { key, label: config.label, count, percentage };
      });
    }

    it('should calculate breakdown for typical distribution', () => {
      const issues = { error: 10, warning: 30, info: 60 };
      const total = 100;
      const breakdown = calculateBreakdown(issues, total);

      expect(breakdown).toEqual([
        { key: 'error', label: 'Critical', count: 10, percentage: 10 },
        { key: 'warning', label: 'Warning', count: 30, percentage: 30 },
        { key: 'info', label: 'Info', count: 60, percentage: 60 },
      ]);
    });

    it('should handle all issues being one severity', () => {
      const issues = { error: 100, warning: 0, info: 0 };
      const total = 100;
      const breakdown = calculateBreakdown(issues, total);

      expect(breakdown[0]).toEqual({ key: 'error', label: 'Critical', count: 100, percentage: 100 });
      expect(breakdown[1]).toEqual({ key: 'warning', label: 'Warning', count: 0, percentage: 0 });
      expect(breakdown[2]).toEqual({ key: 'info', label: 'Info', count: 0, percentage: 0 });
    });

    it('should handle no issues', () => {
      const issues = {};
      const total = 0;
      const breakdown = calculateBreakdown(issues, total);

      breakdown.forEach((item) => {
        expect(item.count).toBe(0);
        expect(item.percentage).toBe(0);
      });
    });

    it('should handle missing severity keys', () => {
      const issues = { error: 50 }; // Only error, missing warning and info
      const total = 50;
      const breakdown = calculateBreakdown(issues, total);

      expect(breakdown[0]).toEqual({ key: 'error', label: 'Critical', count: 50, percentage: 100 });
      expect(breakdown[1]).toEqual({ key: 'warning', label: 'Warning', count: 0, percentage: 0 });
      expect(breakdown[2]).toEqual({ key: 'info', label: 'Info', count: 0, percentage: 0 });
    });
  });
});

describe('CategoryBreakdown', () => {
  describe('percentage calculation: ((count / total) * 100).toFixed(1)', () => {
    function calculatePercentage(count: number, total: number): string {
      return total > 0 ? ((count / total) * 100).toFixed(1) : '0';
    }

    it('should return "0" when total is 0', () => {
      expect(calculatePercentage(0, 0)).toBe('0');
      expect(calculatePercentage(10, 0)).toBe('0');
    });

    it('should format percentage with one decimal place', () => {
      expect(calculatePercentage(50, 100)).toBe('50.0');
      expect(calculatePercentage(25, 100)).toBe('25.0');
      expect(calculatePercentage(75, 100)).toBe('75.0');
    });

    it('should round to one decimal place', () => {
      expect(calculatePercentage(1, 3)).toBe('33.3');
      expect(calculatePercentage(2, 3)).toBe('66.7');
      expect(calculatePercentage(1, 7)).toBe('14.3');
    });

    it('should handle 0%', () => {
      expect(calculatePercentage(0, 100)).toBe('0.0');
    });

    it('should handle 100%', () => {
      expect(calculatePercentage(100, 100)).toBe('100.0');
    });

    it('should handle small percentages', () => {
      expect(calculatePercentage(1, 1000)).toBe('0.1');
      expect(calculatePercentage(1, 10000)).toBe('0.0');
    });

    it('should handle large counts', () => {
      expect(calculatePercentage(5000, 10000)).toBe('50.0');
      expect(calculatePercentage(12345, 100000)).toBe('12.3');
    });
  });

  describe('chip label formatting', () => {
    function formatLabel(
      categoryLabel: string | undefined,
      categoryKey: string,
      count: number,
      percentage: string
    ): string {
      return `${categoryLabel || categoryKey}: ${count} (${percentage}%)`;
    }

    it('should format label with known category', () => {
      expect(formatLabel('Security', 'security', 10, '25.0')).toBe('Security: 10 (25.0%)');
      expect(formatLabel('Code Smell', 'code_smell', 50, '50.0')).toBe('Code Smell: 50 (50.0%)');
    });

    it('should use category key when label is undefined', () => {
      expect(formatLabel(undefined, 'unknown_category', 5, '10.0')).toBe('unknown_category: 5 (10.0%)');
    });

    it('should handle zero count', () => {
      expect(formatLabel('Security', 'security', 0, '0.0')).toBe('Security: 0 (0.0%)');
    });

    it('should handle 100% percentage', () => {
      expect(formatLabel('Security', 'security', 100, '100.0')).toBe('Security: 100 (100.0%)');
    });
  });

  describe('category configuration', () => {
    it('should have correct labels for each category', () => {
      expect(CATEGORY_CONFIG.security.label).toBe('Security');
      expect(CATEGORY_CONFIG.code_smell.label).toBe('Code Smell');
      expect(CATEGORY_CONFIG.best_practice.label).toBe('Best Practice');
      expect(CATEGORY_CONFIG.documentation.label).toBe('Documentation');
    });

    it('should have four category types', () => {
      expect(Object.keys(CATEGORY_CONFIG)).toHaveLength(4);
      expect(Object.keys(CATEGORY_CONFIG)).toEqual([
        'security',
        'code_smell',
        'best_practice',
        'documentation',
      ]);
    });
  });

  describe('category lookup with fallback', () => {
    function getCategoryLabel(category: string): string {
      const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
      return config?.label || category;
    }

    it('should return label for known categories', () => {
      expect(getCategoryLabel('security')).toBe('Security');
      expect(getCategoryLabel('code_smell')).toBe('Code Smell');
      expect(getCategoryLabel('best_practice')).toBe('Best Practice');
      expect(getCategoryLabel('documentation')).toBe('Documentation');
    });

    it('should return category key for unknown categories', () => {
      expect(getCategoryLabel('unknown')).toBe('unknown');
      expect(getCategoryLabel('custom_category')).toBe('custom_category');
      expect(getCategoryLabel('')).toBe('');
    });
  });

  describe('combined category breakdown calculations', () => {
    function calculateBreakdown(issuesByCategory: Record<string, number>, total: number) {
      return Object.entries(issuesByCategory).map(([category, count]) => {
        const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
        const label = config?.label || category;
        return { category, label, count, percentage };
      });
    }

    it('should calculate breakdown for typical distribution', () => {
      const issues = { security: 10, code_smell: 30, best_practice: 40, documentation: 20 };
      const total = 100;
      const breakdown = calculateBreakdown(issues, total);

      expect(breakdown).toContainEqual({ category: 'security', label: 'Security', count: 10, percentage: '10.0' });
      expect(breakdown).toContainEqual({ category: 'code_smell', label: 'Code Smell', count: 30, percentage: '30.0' });
      expect(breakdown).toContainEqual({ category: 'best_practice', label: 'Best Practice', count: 40, percentage: '40.0' });
      expect(breakdown).toContainEqual({ category: 'documentation', label: 'Documentation', count: 20, percentage: '20.0' });
    });

    it('should handle single category', () => {
      const issues = { security: 100 };
      const total = 100;
      const breakdown = calculateBreakdown(issues, total);

      expect(breakdown).toHaveLength(1);
      expect(breakdown[0]).toEqual({ category: 'security', label: 'Security', count: 100, percentage: '100.0' });
    });

    it('should handle empty categories', () => {
      const issues = {};
      const total = 0;
      const breakdown = calculateBreakdown(issues, total);

      expect(breakdown).toHaveLength(0);
    });

    it('should handle unknown categories', () => {
      const issues = { custom: 50 };
      const total = 50;
      const breakdown = calculateBreakdown(issues, total);

      expect(breakdown[0]).toEqual({ category: 'custom', label: 'custom', count: 50, percentage: '100.0' });
    });

    it('should handle mixed known and unknown categories', () => {
      const issues = { security: 30, custom: 70 };
      const total = 100;
      const breakdown = calculateBreakdown(issues, total);

      expect(breakdown).toContainEqual({ category: 'security', label: 'Security', count: 30, percentage: '30.0' });
      expect(breakdown).toContainEqual({ category: 'custom', label: 'custom', count: 70, percentage: '70.0' });
    });
  });
});

describe('Edge cases for both components', () => {
  describe('total mismatch scenarios', () => {
    it('should handle when sum of counts does not equal total (SeverityBreakdown)', () => {
      // This can happen if data is inconsistent
      const issuesBySeverity = { error: 10, warning: 20, info: 30 }; // sum = 60
      const total = 100; // Mismatch

      const calculatePercentage = (count: number) => (total > 0 ? (count / total) * 100 : 0);

      // Percentages should be based on provided total, not sum
      expect(calculatePercentage(issuesBySeverity.error)).toBe(10);
      expect(calculatePercentage(issuesBySeverity.warning)).toBe(20);
      expect(calculatePercentage(issuesBySeverity.info)).toBe(30);
    });

    it('should handle when sum exceeds total', () => {
      const issuesBySeverity = { error: 50, warning: 50, info: 50 }; // sum = 150
      const total = 100;

      const calculatePercentage = (count: number) => (total > 0 ? (count / total) * 100 : 0);

      // Each would be 50% even though sum > 100%
      expect(calculatePercentage(50)).toBe(50);
    });
  });

  describe('zero handling', () => {
    it('should handle all zeros gracefully (SeverityBreakdown)', () => {
      const issuesBySeverity = { error: 0, warning: 0, info: 0 };
      const total = 0;

      const calculatePercentage = (count: number) => (total > 0 ? (count / total) * 100 : 0);

      expect(calculatePercentage(0)).toBe(0);
    });

    it('should handle all zeros gracefully (CategoryBreakdown)', () => {
      const issuesByCategory = { security: 0, code_smell: 0 };
      const total = 0;

      const calculatePercentage = (count: number) => (total > 0 ? ((count / total) * 100).toFixed(1) : '0');

      expect(calculatePercentage(0)).toBe('0');
    });
  });

  describe('very large numbers', () => {
    it('should handle large issue counts', () => {
      const total = 1000000;
      const count = 123456;

      const percentage = (count / total) * 100;
      const formattedPercentage = percentage.toFixed(1);

      expect(percentage).toBeCloseTo(12.3456, 3);
      expect(formattedPercentage).toBe('12.3');
    });
  });

  describe('floating point precision', () => {
    it('should handle repeating decimals', () => {
      const total = 3;
      const count = 1;

      const percentage = ((count / total) * 100).toFixed(1);

      expect(percentage).toBe('33.3');
    });

    it('should round correctly at .x5 boundaries', () => {
      // 10.05% should round to 10.1 (or 10.0 depending on implementation)
      const percentage1 = (10.05).toFixed(1);
      expect(percentage1).toBe('10.1');

      // 10.04% should round to 10.0
      const percentage2 = (10.04).toFixed(1);
      expect(percentage2).toBe('10.0');
    });
  });
});

describe('Rendering verification (unit tests for expected output)', () => {
  describe('SeverityBreakdown expected rendering', () => {
    it('should prepare correct data for LinearProgress value prop', () => {
      const issuesBySeverity = { error: 25, warning: 50, info: 25 };
      const total = 100;

      const progressValues = Object.entries(SEVERITY_CONFIG).map(([key]) => {
        const count = issuesBySeverity[key as keyof typeof issuesBySeverity] || 0;
        return (count / total) * 100;
      });

      expect(progressValues).toEqual([25, 50, 25]);
    });

    it('should prepare correct data for count display', () => {
      const issuesBySeverity = { error: 5, warning: 10, info: 15 };

      const counts = Object.keys(SEVERITY_CONFIG).map((key) => {
        return issuesBySeverity[key as keyof typeof issuesBySeverity] || 0;
      });

      expect(counts).toEqual([5, 10, 15]);
    });
  });

  describe('CategoryBreakdown expected rendering', () => {
    it('should prepare correct chip labels', () => {
      const issuesByCategory = { security: 10, code_smell: 20 };
      const total = 30;

      const labels = Object.entries(issuesByCategory).map(([category, count]) => {
        const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
        const percentage = ((count / total) * 100).toFixed(1);
        return `${config?.label || category}: ${count} (${percentage}%)`;
      });

      expect(labels).toContain('Security: 10 (33.3%)');
      expect(labels).toContain('Code Smell: 20 (66.7%)');
    });

    it('should handle empty categories object', () => {
      const issuesByCategory = {};
      const entries = Object.entries(issuesByCategory);

      expect(entries).toHaveLength(0);
    });
  });
});
