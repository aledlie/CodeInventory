/**
 * Comparison API
 *
 * Handles fetching and comparing historical snapshots.
 */

import type { Snapshot, SimpleComparisonResult, MetricDiff } from '../types/comparison';

const DATA_PATH = '/data';

/**
 * Load a specific snapshot by date
 */
async function loadSnapshot(basePath: string, date: string): Promise<Snapshot | null> {
  try {
    const response = await fetch(`${basePath}/history/${date}/snapshot.json`);
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType?.includes('application/json')) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Generate mock snapshot for development
 */
function generateMockSnapshot(date: string, seedOffset: number = 0): Snapshot {
  const seed = date.split('-').reduce((acc, n) => acc + parseInt(n, 10), seedOffset);
  const random = (base: number, variance: number) =>
    Math.max(0, base + Math.floor((Math.sin(seed * variance) * variance)));

  return {
    date,
    timestamp: new Date(date).toISOString(),
    metrics: {
      quality: {
        score: random(85, 10),
        issues: {
          critical: random(2, 3),
          major: random(8, 5),
          minor: random(25, 10),
        },
        maintainabilityIndex: random(75, 15),
        technicalDebt: random(120, 40),
      },
      coverage: {
        overall: random(78, 12),
        unit: random(82, 10),
        integration: random(65, 15),
        e2e: random(45, 20),
        untestedFiles: random(15, 8),
      },
      dependencies: {
        total: random(45, 10),
        outdated: random(8, 5),
        vulnerable: random(1, 2),
        circular: random(3, 3),
      },
    },
  };
}

/**
 * Calculate the difference between two metric values
 */
function calculateDiff(current: number, previous: number): MetricDiff {
  const change = current - previous;
  const percentChange = previous !== 0 ? ((change / previous) * 100) : (current !== 0 ? 100 : 0);

  return {
    current,
    previous,
    change,
    percentChange: Math.round(percentChange * 10) / 10,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
  };
}

/**
 * Compare two snapshots and generate a comparison result
 */
export function compareSnapshots(current: Snapshot, previous: Snapshot): SimpleComparisonResult {
  const { metrics: curr } = current;
  const { metrics: prev } = previous;

  return {
    currentDate: current.date,
    previousDate: previous.date,
    quality: {
      score: calculateDiff(curr.quality.score, prev.quality.score),
      criticalIssues: calculateDiff(curr.quality.issues.critical, prev.quality.issues.critical),
      majorIssues: calculateDiff(curr.quality.issues.major, prev.quality.issues.major),
      minorIssues: calculateDiff(curr.quality.issues.minor, prev.quality.issues.minor),
      maintainabilityIndex: calculateDiff(curr.quality.maintainabilityIndex, prev.quality.maintainabilityIndex),
      technicalDebt: calculateDiff(curr.quality.technicalDebt, prev.quality.technicalDebt),
    },
    coverage: {
      overall: calculateDiff(curr.coverage.overall, prev.coverage.overall),
      unit: calculateDiff(curr.coverage.unit, prev.coverage.unit),
      integration: calculateDiff(curr.coverage.integration, prev.coverage.integration),
      e2e: calculateDiff(curr.coverage.e2e, prev.coverage.e2e),
      untestedFiles: calculateDiff(curr.coverage.untestedFiles, prev.coverage.untestedFiles),
    },
    dependencies: {
      total: calculateDiff(curr.dependencies.total, prev.dependencies.total),
      outdated: calculateDiff(curr.dependencies.outdated, prev.dependencies.outdated),
      vulnerable: calculateDiff(curr.dependencies.vulnerable, prev.dependencies.vulnerable),
      circular: calculateDiff(curr.dependencies.circular, prev.dependencies.circular),
    },
  };
}

/**
 * Get available snapshot dates
 */
async function getAvailableSnapshots(basePath: string): Promise<string[]> {
  try {
    const response = await fetch(`${basePath}/history/manifest.json`);
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType?.includes('application/json')) {
      throw new Error('Manifest not found');
    }
    const manifest = await response.json();
    return manifest.snapshots || [];
  } catch {
    // Generate mock dates for development
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }
}

/**
 * Comparison API
 */
export const comparisonApi = {
  /**
   * Get list of available snapshot dates
   */
  async getSnapshots(): Promise<string[]> {
    return getAvailableSnapshots(DATA_PATH);
  },

  /**
   * Load a snapshot by date
   */
  async loadSnapshot(date: string): Promise<Snapshot> {
    const snapshot = await loadSnapshot(DATA_PATH, date);
    if (snapshot) {
      return snapshot;
    }
    // Return mock data for development
    return generateMockSnapshot(date);
  },

  /**
   * Compare two dates and return the result
   */
  async compare(currentDate: string, previousDate: string): Promise<SimpleComparisonResult> {
    const [current, previous] = await Promise.all([
      this.loadSnapshot(currentDate),
      this.loadSnapshot(previousDate),
    ]);

    return compareSnapshots(current, previous);
  },

  /**
   * Quick compare: today vs N days ago
   */
  async quickCompare(daysAgo: number = 7): Promise<SimpleComparisonResult> {
    const today = new Date();
    const previousDate = new Date(today);
    previousDate.setDate(previousDate.getDate() - daysAgo);

    return this.compare(
      today.toISOString().split('T')[0],
      previousDate.toISOString().split('T')[0]
    );
  },
};
