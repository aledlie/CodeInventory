import {
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { ModularityScore } from '../../types/tools';

interface ToolsFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'extraction' | 'modularity' | 'name';
  onSortChange: (sortBy: 'extraction' | 'modularity' | 'name') => void;
  modularityFilter: ModularityScore | 'all';
  onModularityFilterChange: (filter: ModularityScore | 'all') => void;
  typeFilter: 'all' | 'classes' | 'functions' | 'both';
  onTypeFilterChange: (filter: 'all' | 'classes' | 'functions' | 'both') => void;
}

export function ToolsFilterToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  modularityFilter,
  onModularityFilterChange,
  typeFilter,
  onTypeFilterChange
}: ToolsFilterToolbarProps) {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      {/* Search and Sort Row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
          >
            <MenuItem value="extraction">Extraction Potential</MenuItem>
            <MenuItem value="modularity">Modularity Score</MenuItem>
            <MenuItem value="name">File Name</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Filters Row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Modularity</InputLabel>
          <Select
            value={modularityFilter}
            label="Modularity"
            onChange={(e) => onModularityFilterChange(e.target.value as typeof modularityFilter)}
          >
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value="highly_modular">Highly Modular</MenuItem>
            <MenuItem value="modular">Modular</MenuItem>
            <MenuItem value="semi_modular">Semi-Modular</MenuItem>
            <MenuItem value="coupled">Coupled</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <ToggleButtonGroup
            value={typeFilter}
            exclusive
            onChange={(_, newValue) => {
              if (newValue !== null) {
                onTypeFilterChange(newValue);
              }
            }}
            size="small"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="classes">Classes</ToggleButton>
            <ToggleButton value="functions">Functions</ToggleButton>
            <ToggleButton value="both">Both</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Stack>
    </Stack>
  );
}
