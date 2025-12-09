import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Stack,
  Typography,
  Box,
} from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';
import type { UtilityModule } from '../../types/tools';
import { ModularityChip } from './ModularityChip';
import { ExtractionPotentialBar } from './ExtractionPotentialBar';

interface UtilityModulesTableProps {
  modules: UtilityModule[];
}

export function UtilityModulesTable({ modules }: UtilityModulesTableProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (module: UtilityModule) => {
    navigate({
      to: '/dashboard/tools/$moduleId',
      params: { moduleId: encodeURIComponent(module.file_path) }
    });
  };

  const paginatedModules = modules.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Path</TableCell>
              <TableCell>Modularity</TableCell>
              <TableCell>Components</TableCell>
              <TableCell>Dependencies</TableCell>
              <TableCell>Extraction Potential</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedModules.map((module) => (
              <TableRow
                key={module.file_path}
                hover
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
                onClick={() => handleRowClick(module)}
              >
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" fontWeight={500}>
                      {module.file_path.split('/').pop()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {module.file_path}
                    </Typography>
                  </Stack>
                </TableCell>

                <TableCell>
                  <ModularityChip score={module.modularity_score} />
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {module.function_count > 0 && (
                      <Chip
                        label={`${module.function_count} functions`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {module.class_count > 0 && (
                      <Chip
                        label={`${module.class_count} classes`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </TableCell>

                <TableCell>
                  <Stack spacing={0.5}>
                    {module.external_dependencies.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {module.external_dependencies.length} external
                      </Typography>
                    )}
                    {module.internal_dependencies.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {module.internal_dependencies.length} internal
                      </Typography>
                    )}
                    {module.external_dependencies.length === 0 &&
                      module.internal_dependencies.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          No dependencies
                        </Typography>
                      )}
                  </Stack>
                </TableCell>

                <TableCell sx={{ minWidth: 200 }}>
                  <ExtractionPotentialBar value={module.extraction_potential} />
                </TableCell>

                <TableCell align="right">
                  <IconButton size="small">
                    <ChevronRightIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={modules.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}
