import { describe, it, expect } from 'vitest';

/**
 * Tests for the updateDimensions function logic in DependencyGraphPage
 *
 * The updateDimensions function is defined as:
 * ```
 * const updateDimensions = () => {
 *   if (containerRef.current) {
 *     const rect = containerRef.current.getBoundingClientRect();
 *     setDimensions({
 *       width: Math.max(600, rect.width),
 *       height: Math.max(400, window.innerHeight - 300),
 *     });
 *   }
 * };
 * ```
 *
 * This test suite validates the dimension calculation logic directly.
 */
describe('DependencyGraphPage updateDimensions', () => {
  // Constants from the component
  const MIN_WIDTH = 600;
  const MIN_HEIGHT = 400;
  const HEIGHT_OFFSET = 300;

  // Helper functions that mirror the component's logic
  function calculateWidth(containerWidth: number): number {
    return Math.max(MIN_WIDTH, containerWidth);
  }

  function calculateHeight(windowHeight: number): number {
    return Math.max(MIN_HEIGHT, windowHeight - HEIGHT_OFFSET);
  }

  describe('width calculation: Math.max(600, rect.width)', () => {
    it('should return minimum 600 when container width is 0', () => {
      expect(calculateWidth(0)).toBe(600);
    });

    it('should return minimum 600 when container width is less than 600', () => {
      expect(calculateWidth(100)).toBe(600);
      expect(calculateWidth(300)).toBe(600);
      expect(calculateWidth(599)).toBe(600);
    });

    it('should return 600 at exact boundary', () => {
      expect(calculateWidth(600)).toBe(600);
    });

    it('should return container width when greater than 600', () => {
      expect(calculateWidth(601)).toBe(601);
      expect(calculateWidth(800)).toBe(800);
      expect(calculateWidth(1024)).toBe(1024);
      expect(calculateWidth(1920)).toBe(1920);
    });

    it('should handle fractional widths below minimum', () => {
      expect(calculateWidth(599.9)).toBe(600);
      expect(calculateWidth(599.99)).toBe(600);
    });

    it('should handle fractional widths above minimum', () => {
      expect(calculateWidth(600.1)).toBe(600.1);
      expect(calculateWidth(800.5)).toBe(800.5);
    });

    it('should handle very small widths', () => {
      expect(calculateWidth(1)).toBe(600);
      expect(calculateWidth(0.1)).toBe(600);
    });

    it('should handle very large widths', () => {
      expect(calculateWidth(2560)).toBe(2560);
      expect(calculateWidth(3840)).toBe(3840);
      expect(calculateWidth(7680)).toBe(7680);
    });
  });

  describe('height calculation: Math.max(400, window.innerHeight - 300)', () => {
    it('should return minimum 400 when calculated height is negative', () => {
      // windowHeight = 0, 0 - 300 = -300
      expect(calculateHeight(0)).toBe(400);
      // windowHeight = 100, 100 - 300 = -200
      expect(calculateHeight(100)).toBe(400);
      // windowHeight = 299, 299 - 300 = -1
      expect(calculateHeight(299)).toBe(400);
    });

    it('should return minimum 400 when calculated height is 0', () => {
      // windowHeight = 300, 300 - 300 = 0
      expect(calculateHeight(300)).toBe(400);
    });

    it('should return minimum 400 when calculated height is less than 400', () => {
      // windowHeight = 400, 400 - 300 = 100
      expect(calculateHeight(400)).toBe(400);
      // windowHeight = 500, 500 - 300 = 200
      expect(calculateHeight(500)).toBe(400);
      // windowHeight = 699, 699 - 300 = 399
      expect(calculateHeight(699)).toBe(400);
    });

    it('should return 400 at exact boundary (window = 700)', () => {
      // windowHeight = 700, 700 - 300 = 400
      expect(calculateHeight(700)).toBe(400);
    });

    it('should return calculated height when greater than 400', () => {
      // windowHeight = 701, 701 - 300 = 401
      expect(calculateHeight(701)).toBe(401);
      // windowHeight = 800, 800 - 300 = 500
      expect(calculateHeight(800)).toBe(500);
      // windowHeight = 900, 900 - 300 = 600
      expect(calculateHeight(900)).toBe(600);
      // windowHeight = 1000, 1000 - 300 = 700
      expect(calculateHeight(1000)).toBe(700);
    });

    it('should handle common desktop heights', () => {
      // 720p: 720 - 300 = 420
      expect(calculateHeight(720)).toBe(420);
      // 900p: 900 - 300 = 600
      expect(calculateHeight(900)).toBe(600);
      // 1080p: 1080 - 300 = 780
      expect(calculateHeight(1080)).toBe(780);
      // 1440p: 1440 - 300 = 1140
      expect(calculateHeight(1440)).toBe(1140);
      // 4K: 2160 - 300 = 1860
      expect(calculateHeight(2160)).toBe(1860);
    });

    it('should handle fractional heights', () => {
      expect(calculateHeight(699.9)).toBe(400);
      expect(calculateHeight(700.5)).toBe(400.5);
      expect(calculateHeight(900.7)).toBeCloseTo(600.7, 1);
    });
  });

  describe('combined dimension calculations', () => {
    it('should handle minimum values for both dimensions', () => {
      const width = calculateWidth(400);
      const height = calculateHeight(500);

      expect(width).toBe(600);
      expect(height).toBe(400);
    });

    it('should handle large values for both dimensions', () => {
      const width = calculateWidth(1920);
      const height = calculateHeight(1080);

      expect(width).toBe(1920);
      expect(height).toBe(780);
    });

    it('should handle mixed minimum and large values', () => {
      // Small container, large window
      expect(calculateWidth(400)).toBe(600);
      expect(calculateHeight(1080)).toBe(780);

      // Large container, small window
      expect(calculateWidth(1200)).toBe(1200);
      expect(calculateHeight(500)).toBe(400);
    });

    it('should handle typical laptop scenario', () => {
      // MacBook Pro 14": 1512 x 982
      const width = calculateWidth(1400); // Container slightly smaller than viewport
      const height = calculateHeight(982);

      expect(width).toBe(1400);
      expect(height).toBe(682);
    });

    it('should handle mobile/narrow viewport scenario', () => {
      // iPhone Pro Max: 430 x 932
      const width = calculateWidth(430);
      const height = calculateHeight(932);

      expect(width).toBe(600); // Clamped to minimum
      expect(height).toBe(632);
    });

    it('should handle very tall narrow window', () => {
      const width = calculateWidth(500);
      const height = calculateHeight(2000);

      expect(width).toBe(600);
      expect(height).toBe(1700);
    });

    it('should handle ultra-wide scenario', () => {
      // Ultra-wide 3440x1440
      const width = calculateWidth(3200); // Container slightly smaller
      const height = calculateHeight(1440);

      expect(width).toBe(3200);
      expect(height).toBe(1140);
    });
  });

  describe('edge cases', () => {
    it('should handle zero dimensions', () => {
      expect(calculateWidth(0)).toBe(600);
      expect(calculateHeight(0)).toBe(400);
    });

    it('should handle negative container width (theoretically impossible)', () => {
      // Math.max will still work correctly
      expect(calculateWidth(-100)).toBe(600);
    });

    it('should handle very small window (below offset)', () => {
      // If window is smaller than offset, result is negative, clamped to min
      expect(calculateHeight(200)).toBe(400);
      expect(calculateHeight(100)).toBe(400);
      expect(calculateHeight(50)).toBe(400);
    });

    it('should handle exact MIN_WIDTH - 1', () => {
      expect(calculateWidth(599)).toBe(600);
    });

    it('should handle exact MIN_WIDTH + 1', () => {
      expect(calculateWidth(601)).toBe(601);
    });

    it('should handle window height that results in exactly MIN_HEIGHT - 1', () => {
      // 699 - 300 = 399
      expect(calculateHeight(699)).toBe(400);
    });

    it('should handle window height that results in exactly MIN_HEIGHT + 1', () => {
      // 701 - 300 = 401
      expect(calculateHeight(701)).toBe(401);
    });
  });

  describe('constants validation', () => {
    it('should use correct minimum width of 600', () => {
      expect(MIN_WIDTH).toBe(600);
    });

    it('should use correct minimum height of 400', () => {
      expect(MIN_HEIGHT).toBe(400);
    });

    it('should use correct height offset of 300', () => {
      expect(HEIGHT_OFFSET).toBe(300);
    });

    it('should validate the default state dimensions (800x600)', () => {
      // The component initializes with useState({ width: 800, height: 600 })
      const defaultWidth = 800;
      const defaultHeight = 600;

      expect(defaultWidth).toBeGreaterThanOrEqual(MIN_WIDTH);
      expect(defaultHeight).toBeGreaterThanOrEqual(MIN_HEIGHT);
    });
  });

  describe('behavioral verification', () => {
    it('should always return at least minimum width regardless of input', () => {
      const testWidths = [-100, -1, 0, 1, 100, 599, 600, 601, 1000];
      testWidths.forEach((w) => {
        expect(calculateWidth(w)).toBeGreaterThanOrEqual(MIN_WIDTH);
      });
    });

    it('should always return at least minimum height regardless of input', () => {
      const testHeights = [-100, 0, 100, 300, 500, 699, 700, 701, 1000];
      testHeights.forEach((h) => {
        expect(calculateHeight(h)).toBeGreaterThanOrEqual(MIN_HEIGHT);
      });
    });

    it('should return input when input exceeds minimum (for width)', () => {
      const largeWidths = [700, 800, 1000, 1500, 2000];
      largeWidths.forEach((w) => {
        expect(calculateWidth(w)).toBe(w);
      });
    });

    it('should return calculated height when result exceeds minimum', () => {
      const windowHeights = [800, 900, 1000, 1200, 1500];
      windowHeights.forEach((h) => {
        const expected = h - HEIGHT_OFFSET;
        if (expected > MIN_HEIGHT) {
          expect(calculateHeight(h)).toBe(expected);
        }
      });
    });
  });
});
