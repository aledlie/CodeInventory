/**
 * ExportButton Component
 *
 * Phase 5C: Advanced Features
 * A button with dropdown menu for exporting data in various formats.
 */

import { useState, useCallback, type MouseEvent } from 'react';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  type ButtonProps,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { useExport, formatBytes, type UseExportReturn } from '../../hooks/useExport';
import type { CsvColumn, CsvExportOptions, PdfExportOptions } from '../../api/exportApi';

// ============================================================================
// Types
// ============================================================================

export interface ExportOption {
  /** Export format */
  format: 'csv' | 'pdf' | 'json';
  /** Label for the menu item */
  label: string;
  /** Callback to execute when selected */
  onExport: (exportFn: UseExportReturn) => Promise<void>;
  /** Optional icon override */
  icon?: React.ReactNode;
  /** Optional disabled state */
  disabled?: boolean;
  /** Optional tooltip */
  tooltip?: string;
}

export interface ExportButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Export options to show in dropdown */
  options: ExportOption[];
  /** Button variant style */
  buttonVariant?: 'icon' | 'button' | 'contained';
  /** Custom button text (for non-icon variant) */
  buttonText?: string;
  /** Show success notification */
  showNotification?: boolean;
  /** Notification duration in ms */
  notificationDuration?: number;
}

// ============================================================================
// Icon Map
// ============================================================================

const formatIcons: Record<string, React.ReactNode> = {
  csv: <TableChartIcon fontSize="small" />,
  pdf: <PictureAsPdfIcon fontSize="small" />,
  json: <DataObjectIcon fontSize="small" />,
};

// ============================================================================
// Component
// ============================================================================

/**
 * Export Button Component
 *
 * Provides a dropdown menu for exporting data in various formats.
 *
 * @example
 * ```tsx
 * <ExportButton
 *   options={[
 *     {
 *       format: 'csv',
 *       label: 'Export as CSV',
 *       onExport: async (exportFn) => {
 *         await exportFn.exportCsv(data, columns, { filename: 'report' });
 *       },
 *     },
 *     {
 *       format: 'pdf',
 *       label: 'Export as PDF',
 *       onExport: async (exportFn) => {
 *         await exportFn.exportPdf(htmlContent, { filename: 'report', title: 'Report' });
 *       },
 *     },
 *   ]}
 * />
 * ```
 */
export function ExportButton({
  options,
  buttonVariant = 'button',
  buttonText = 'Export',
  showNotification = true,
  notificationDuration = 4000,
  disabled,
  ...buttonProps
}: ExportButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const exportHook = useExport();
  const { isExporting } = exportHook;

  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = useCallback(
    async (option: ExportOption) => {
      handleClose();

      try {
        await option.onExport(exportHook);

        if (showNotification && exportHook.lastExport) {
          const result = exportHook.lastExport;
          if (result.success) {
            setNotification({
              open: true,
              message: `Exported ${result.filename} (${formatBytes(result.size)})`,
              severity: 'success',
            });
          } else {
            setNotification({
              open: true,
              message: result.error ?? 'Export failed',
              severity: 'error',
            });
          }
        }
      } catch (error) {
        if (showNotification) {
          setNotification({
            open: true,
            message: error instanceof Error ? error.message : 'Export failed',
            severity: 'error',
          });
        }
      }
    },
    [exportHook, showNotification]
  );

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Render button based on variant
  const renderButton = () => {
    const commonProps = {
      'aria-controls': open ? 'export-menu' : undefined,
      'aria-haspopup': 'true' as const,
      'aria-expanded': open ? 'true' as const : undefined,
      onClick: handleClick,
      disabled: disabled || isExporting,
    };

    if (buttonVariant === 'icon') {
      return (
        <Tooltip title={buttonText}>
          <span>
            <IconButton {...commonProps} size="small">
              {isExporting ? (
                <CircularProgress size={20} />
              ) : (
                <FileDownloadIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      );
    }

    if (buttonVariant === 'contained') {
      return (
        <Button
          variant="contained"
          startIcon={
            isExporting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <FileDownloadIcon />
            )
          }
          {...commonProps}
          {...buttonProps}
        >
          {buttonText}
        </Button>
      );
    }

    return (
      <Button
        variant="outlined"
        startIcon={
          isExporting ? (
            <CircularProgress size={16} />
          ) : (
            <FileDownloadIcon />
          )
        }
        {...commonProps}
        {...buttonProps}
      >
        {buttonText}
      </Button>
    );
  };

  return (
    <>
      {renderButton()}

      <Menu
        id="export-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'export-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {options.map((option, index) => (
          <span key={`${option.format}-${index}`}>
            {index > 0 && option.format !== options[index - 1].format && (
              <Divider />
            )}
            <Tooltip title={option.tooltip ?? ''} placement="left">
              <span>
                <MenuItem
                  onClick={() => handleExport(option)}
                  disabled={option.disabled}
                >
                  <ListItemIcon>
                    {option.icon ?? formatIcons[option.format]}
                  </ListItemIcon>
                  <ListItemText primary={option.label} />
                </MenuItem>
              </span>
            </Tooltip>
          </span>
        ))}
      </Menu>

      {showNotification && (
        <Snackbar
          open={notification.open}
          autoHideDuration={notificationDuration}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}

// ============================================================================
// Quick Export Buttons
// ============================================================================

export interface QuickCsvExportButtonProps<T> {
  /** Data to export */
  data: T[];
  /** Column definitions */
  columns: CsvColumn<T>[];
  /** Export options */
  options?: Partial<CsvExportOptions>;
  /** Button text */
  buttonText?: string;
  /** Button variant */
  variant?: 'icon' | 'button' | 'contained';
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Quick CSV Export Button
 *
 * A simpler button for quick CSV exports without dropdown menu.
 */
export function QuickCsvExportButton<T>({
  data,
  columns,
  options = {},
  buttonText = 'Export CSV',
  variant = 'button',
  disabled = false,
}: QuickCsvExportButtonProps<T>) {
  const exportOptions: ExportOption[] = [
    {
      format: 'csv',
      label: buttonText,
      onExport: async (exportFn) => {
        await exportFn.exportCsv(data, columns, {
          filename: options.filename ?? 'export',
          ...options,
        });
      },
      disabled,
    },
  ];

  return (
    <ExportButton
      options={exportOptions}
      buttonVariant={variant}
      buttonText={buttonText}
      disabled={disabled || data.length === 0}
    />
  );
}

export interface QuickPdfExportButtonProps {
  /** HTML content to export */
  content: string;
  /** Export options */
  options?: Partial<PdfExportOptions>;
  /** Button text */
  buttonText?: string;
  /** Button variant */
  variant?: 'icon' | 'button' | 'contained';
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Quick PDF Export Button
 *
 * A simpler button for quick PDF exports without dropdown menu.
 */
export function QuickPdfExportButton({
  content,
  options = {},
  buttonText = 'Export PDF',
  variant = 'button',
  disabled = false,
}: QuickPdfExportButtonProps) {
  const exportOptions: ExportOption[] = [
    {
      format: 'pdf',
      label: buttonText,
      onExport: async (exportFn) => {
        await exportFn.exportPdf(content, {
          filename: options.filename ?? 'export',
          title: options.title ?? 'Export',
          ...options,
        });
      },
      disabled,
    },
  ];

  return (
    <ExportButton
      options={exportOptions}
      buttonVariant={variant}
      buttonText={buttonText}
      disabled={disabled}
    />
  );
}

export default ExportButton;
