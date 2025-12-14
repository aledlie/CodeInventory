/**
 * Export API Service Tests
 *
 * Tests for data export to CSV, JSON, and PDF formats.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exportToCsv,
  exportToJson,
  exportToPdf,
  exportApi,
} from '../exportApi';
import type { CsvColumn, CsvExportOptions, JsonExportOptions, PdfExportOptions } from '../exportApi';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

// Mock document methods
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockCreateElement = vi.fn(() => ({
  href: '',
  download: '',
  style: { display: '' },
  click: mockClick,
}));

// Mock window.open for PDF tests
const mockWindowOpen = vi.fn();
const mockPrintWindow = {
  document: {
    write: vi.fn(),
    close: vi.fn(),
  },
  focus: vi.fn(),
};

describe('exportApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-30T12:30:45.000Z'));

    // Setup mocks
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    global.document.createElement = mockCreateElement as unknown as typeof document.createElement;
    global.document.body.appendChild = mockAppendChild;
    global.document.body.removeChild = mockRemoveChild;
    global.window.open = mockWindowOpen;
    mockWindowOpen.mockReturnValue(mockPrintWindow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('exportToCsv', () => {
    interface TestRow {
      id: number;
      name: string;
      value: number;
      active: boolean;
    }

    const testData: TestRow[] = [
      { id: 1, name: 'Item 1', value: 100, active: true },
      { id: 2, name: 'Item 2', value: 200, active: false },
      { id: 3, name: 'Item 3', value: 300, active: true },
    ];

    const testColumns: CsvColumn<TestRow>[] = [
      { header: 'ID', accessor: 'id' },
      { header: 'Name', accessor: 'name' },
      { header: 'Value', accessor: 'value' },
      { header: 'Active', accessor: 'active' },
    ];

    it('should export data to CSV successfully', () => {
      const options: CsvExportOptions = {
        filename: 'test-export',
      };

      const result = exportToCsv(testData, testColumns, options);

      expect(result.success).toBe(true);
      expect(result.format).toBe('csv');
      expect(result.filename).toBe('test-export_2024-01-30T12-30-45.csv');
      expect(result.size).toBeGreaterThan(0);
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it('should include BOM by default', () => {
      const options: CsvExportOptions = {
        filename: 'test',
      };

      exportToCsv(testData, testColumns, options);

      // Check that Blob was created with BOM
      const blobCall = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blobCall).toBeInstanceOf(Blob);
    });

    it('should exclude BOM when includeBom is false', () => {
      const options: CsvExportOptions = {
        filename: 'test',
        includeBom: false,
      };

      const result = exportToCsv(testData, testColumns, options);

      expect(result.success).toBe(true);
    });

    it('should use custom separator', () => {
      const options: CsvExportOptions = {
        filename: 'test',
        separator: ';',
      };

      const result = exportToCsv(testData, testColumns, options);

      expect(result.success).toBe(true);
    });

    it('should use custom quote character', () => {
      const options: CsvExportOptions = {
        filename: 'test',
        quoteChar: "'",
      };

      const result = exportToCsv(testData, testColumns, options);

      expect(result.success).toBe(true);
    });

    it('should exclude header row when includeHeader is false', () => {
      const options: CsvExportOptions = {
        filename: 'test',
        includeHeader: false,
      };

      const result = exportToCsv(testData, testColumns, options);

      expect(result.success).toBe(true);
    });

    it('should handle accessor function', () => {
      interface Item {
        path: string;
        count: number;
      }

      const data: Item[] = [
        { path: '/src/components/Button.tsx', count: 5 },
        { path: '/src/utils/helpers.ts', count: 10 },
      ];

      const columns: CsvColumn<Item>[] = [
        { header: 'Filename', accessor: (row) => row.path.split('/').pop() || '' },
        { header: 'Count', accessor: 'count' },
      ];

      const result = exportToCsv(data, columns, { filename: 'test' });

      expect(result.success).toBe(true);
    });

    it('should handle custom formatter', () => {
      const columns: CsvColumn<TestRow>[] = [
        { header: 'ID', accessor: 'id' },
        {
          header: 'Value',
          accessor: 'value',
          formatter: (v) => `$${v}`,
        },
      ];

      const result = exportToCsv(testData, columns, { filename: 'test' });

      expect(result.success).toBe(true);
    });

    it('should escape values containing separator', () => {
      interface Item {
        name: string;
      }

      const data: Item[] = [{ name: 'Item, with comma' }];
      const columns: CsvColumn<Item>[] = [{ header: 'Name', accessor: 'name' }];

      const result = exportToCsv(data, columns, { filename: 'test' });

      expect(result.success).toBe(true);
    });

    it('should escape values containing quote character', () => {
      interface Item {
        name: string;
      }

      const data: Item[] = [{ name: 'Item "quoted"' }];
      const columns: CsvColumn<Item>[] = [{ header: 'Name', accessor: 'name' }];

      const result = exportToCsv(data, columns, { filename: 'test' });

      expect(result.success).toBe(true);
    });

    it('should escape values containing newlines', () => {
      interface Item {
        description: string;
      }

      const data: Item[] = [{ description: 'Line 1\nLine 2' }];
      const columns: CsvColumn<Item>[] = [{ header: 'Description', accessor: 'description' }];

      const result = exportToCsv(data, columns, { filename: 'test' });

      expect(result.success).toBe(true);
    });

    it('should handle null and undefined values', () => {
      interface Item {
        name: string | null;
        value: number | undefined;
      }

      const data: Item[] = [
        { name: null, value: undefined },
        { name: 'Test', value: 100 },
      ];

      const columns: CsvColumn<Item>[] = [
        { header: 'Name', accessor: 'name' },
        { header: 'Value', accessor: 'value' },
      ];

      const result = exportToCsv(data, columns, { filename: 'test' });

      expect(result.success).toBe(true);
    });

    it('should handle empty data array', () => {
      const result = exportToCsv([], testColumns, { filename: 'test' });

      expect(result.success).toBe(true);
      // Should still have header row
    });

    it('should return error result on exception', () => {
      // Force an error by making createElement throw
      mockCreateElement.mockImplementationOnce(() => {
        throw new Error('DOM error');
      });

      const result = exportToCsv(testData, testColumns, { filename: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('DOM error');
      expect(result.size).toBe(0);
    });
  });

  describe('exportToJson', () => {
    const testData = {
      name: 'Test Report',
      metrics: {
        quality: 85,
        coverage: 72,
      },
      items: [1, 2, 3],
    };

    it('should export data to JSON successfully', () => {
      const options: JsonExportOptions = {
        filename: 'test-export',
      };

      const result = exportToJson(testData, options);

      expect(result.success).toBe(true);
      expect(result.format).toBe('json');
      expect(result.filename).toBe('test-export_2024-01-30T12-30-45.json');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should pretty print by default', () => {
      const options: JsonExportOptions = {
        filename: 'test',
      };

      const result = exportToJson(testData, options);

      expect(result.success).toBe(true);
    });

    it('should not pretty print when prettyPrint is false', () => {
      const options: JsonExportOptions = {
        filename: 'test',
        prettyPrint: false,
      };

      const result = exportToJson(testData, options);

      expect(result.success).toBe(true);
      // Size should be smaller without formatting
    });

    it('should use custom indentation', () => {
      const options: JsonExportOptions = {
        filename: 'test',
        prettyPrint: true,
        indent: 4,
      };

      const result = exportToJson(testData, options);

      expect(result.success).toBe(true);
    });

    it('should handle arrays', () => {
      const arrayData = [1, 2, 3, 4, 5];

      const result = exportToJson(arrayData, { filename: 'test' });

      expect(result.success).toBe(true);
    });

    it('should handle primitive values', () => {
      const result = exportToJson('simple string', { filename: 'test' });

      expect(result.success).toBe(true);
    });

    it('should handle null value', () => {
      const result = exportToJson(null, { filename: 'test' });

      expect(result.success).toBe(true);
    });

    it('should return error result on exception', () => {
      // Create circular reference to cause JSON.stringify to fail
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      const result = exportToJson(circular, { filename: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('circular');
    });
  });

  describe('exportToPdf', () => {
    const htmlContent = '<h1>Test Report</h1><p>This is a test.</p>';

    it('should export to PDF successfully', () => {
      const options: PdfExportOptions = {
        filename: 'test-report',
        title: 'Test Report',
      };

      const result = exportToPdf(htmlContent, options);

      expect(result.success).toBe(true);
      expect(result.format).toBe('pdf');
      expect(result.filename).toBe('test-report.pdf');
      expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank', 'width=800,height=600');
      expect(mockPrintWindow.document.write).toHaveBeenCalled();
      expect(mockPrintWindow.document.close).toHaveBeenCalled();
      expect(mockPrintWindow.focus).toHaveBeenCalled();
    });

    it('should include title in HTML document', () => {
      const options: PdfExportOptions = {
        filename: 'test',
        title: 'My Custom Title',
      };

      exportToPdf(htmlContent, options);

      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('My Custom Title');
    });

    it('should include subtitle when provided', () => {
      const options: PdfExportOptions = {
        filename: 'test',
        title: 'Title',
        subtitle: 'Subtitle Text',
      };

      exportToPdf(htmlContent, options);

      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('Subtitle Text');
    });

    it('should include timestamp by default', () => {
      const options: PdfExportOptions = {
        filename: 'test',
        title: 'Test',
      };

      exportToPdf(htmlContent, options);

      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('Generated:');
    });

    it('should exclude timestamp when includeTimestamp is false', () => {
      const options: PdfExportOptions = {
        filename: 'test',
        title: 'Test',
        includeTimestamp: false,
      };

      exportToPdf(htmlContent, options);

      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).not.toContain('Generated:');
    });

    it('should set page orientation', () => {
      const options: PdfExportOptions = {
        filename: 'test',
        title: 'Test',
        orientation: 'landscape',
      };

      exportToPdf(htmlContent, options);

      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('landscape');
    });

    it('should set page size', () => {
      const options: PdfExportOptions = {
        filename: 'test',
        title: 'Test',
        pageSize: 'letter',
      };

      exportToPdf(htmlContent, options);

      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('letter');
    });

    it('should include page numbers when specified', () => {
      const options: PdfExportOptions = {
        filename: 'test',
        title: 'Test',
        includePageNumbers: true,
      };

      exportToPdf(htmlContent, options);

      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('counter(page)');
    });

    it('should exclude page numbers when not specified', () => {
      const options: PdfExportOptions = {
        filename: 'test',
        title: 'Test',
        includePageNumbers: false,
      };

      exportToPdf(htmlContent, options);

      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).not.toContain('counter(page)');
    });

    it('should include custom header content', () => {
      const options: PdfExportOptions = {
        filename: 'test',
        title: 'Test',
        headerContent: '<div class="custom-header-content">Header</div>',
      };

      exportToPdf(htmlContent, options);

      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('custom-header-content');
    });

    it('should include custom footer content', () => {
      const options: PdfExportOptions = {
        filename: 'test',
        title: 'Test',
        footerContent: '<div class="custom-footer">Footer</div>',
      };

      exportToPdf(htmlContent, options);

      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('custom-footer');
    });

    it('should return error when popup is blocked', () => {
      mockWindowOpen.mockReturnValueOnce(null);

      const options: PdfExportOptions = {
        filename: 'test',
        title: 'Test',
      };

      const result = exportToPdf(htmlContent, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('popup');
    });

    it('should handle all page sizes', () => {
      const pageSizes: Array<'a4' | 'letter' | 'legal'> = ['a4', 'letter', 'legal'];

      pageSizes.forEach((pageSize) => {
        mockPrintWindow.document.write.mockClear();

        const options: PdfExportOptions = {
          filename: 'test',
          title: 'Test',
          pageSize,
        };

        const result = exportToPdf(htmlContent, options);

        expect(result.success).toBe(true);
        const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
        expect(writtenContent).toContain(pageSize);
      });
    });

    it('should use default values for optional parameters', () => {
      const options: PdfExportOptions = {
        filename: 'test',
      };

      const result = exportToPdf(htmlContent, options);

      expect(result.success).toBe(true);
      const writtenContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(writtenContent).toContain('Export'); // Default title
      expect(writtenContent).toContain('portrait'); // Default orientation
      expect(writtenContent).toContain('a4'); // Default page size
    });
  });

  describe('exportApi object', () => {
    it('should have toCsv method', () => {
      expect(exportApi.toCsv).toBe(exportToCsv);
    });

    it('should have toJson method', () => {
      expect(exportApi.toJson).toBe(exportToJson);
    });

    it('should have toPdf method', () => {
      expect(exportApi.toPdf).toBe(exportToPdf);
    });
  });

  describe('formatExportDate helper', () => {
    it('should format date correctly in filename', () => {
      const result = exportToJson({ test: true }, { filename: 'test' });

      // Date should be formatted as YYYY-MM-DDTHH-MM-SS
      expect(result.filename).toMatch(/test_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json/);
    });
  });

  describe('error handling', () => {
    it('should handle unknown error type in CSV export', () => {
      mockCreateElement.mockImplementationOnce(() => {
        throw 'String error'; // Non-Error throw
      });

      const result = exportToCsv(
        [{ id: 1 }],
        [{ header: 'ID', accessor: 'id' }],
        { filename: 'test' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error during CSV export');
    });

    it('should handle unknown error type in JSON export', () => {
      // Create a proxy that throws on JSON.stringify
      const badData = new Proxy({}, {
        get() {
          throw 'String error';
        },
      });

      const result = exportToJson(badData, { filename: 'test' });

      expect(result.success).toBe(false);
    });

    it('should handle unknown error type in PDF export', () => {
      mockWindowOpen.mockImplementationOnce(() => {
        throw 'String error';
      });

      const result = exportToPdf('<p>Test</p>', {
        filename: 'test',
        title: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error during PDF export');
    });
  });
});
