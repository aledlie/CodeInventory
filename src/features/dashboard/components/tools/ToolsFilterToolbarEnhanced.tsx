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
  InputAdornment,
  Chip,
  Autocomplete,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useAvailablePatterns } from '../../hooks/useToolsData';
import type { ModularityScore } from '../../types/tools';

interface ToolsFilterToolbarEnhancedProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'extraction' | 'modularity' | 'name' | 'patterns';
  onSortChange: (sortBy: 'extraction' | 'modularity' | 'name' | 'patterns') => void;
  modularityFilter: ModularityScore | 'all';
  onModularityFilterChange: (filter: ModularityScore | 'all') => void;
  typeFilter: 'all' | 'class' | 'function' | 'module';
  onTypeFilterChange: (filter: 'all' | 'class' | 'function' | 'module') => void;
  patternFilter: string[];
  onPatternFilterChange: (patterns: string[]) => void;
  abstractionFilter?: 'all' | 'low' | 'medium' | 'high';
  onAbstractionFilterChange?: (filter: 'all' | 'low' | 'medium' | 'high') => void;
}

export function ToolsFilterToolbarEnhanced({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  modularityFilter,
  onModularityFilterChange,
  typeFilter,
  onTypeFilterChange,
  patternFilter,
  onPatternFilterChange,
  abstractionFilter = 'all',
  onAbstractionFilterChange,
}: ToolsFilterToolbarEnhancedProps) {
  const { data: availablePatterns = [] } = useAvailablePatterns();

  const activeFilterCount = [
    modularityFilter !== 'all' ? 1 : 0,
    typeFilter !== 'all' ? 1 : 0,
    patternFilter.length,
    abstractionFilter !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      {/* Search and Sort Row */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField
          placeholder="Search tools by name, type, or file..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
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
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="patterns">Pattern Count</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title={`${activeFilterCount} filters active`}>
          <Badge badgeContent={activeFilterCount} color="primary">
            <Chip
              icon={<FilterIcon />}
              label="Filters"
              variant={activeFilterCount > 0 ? 'filled' : 'outlined'}
              color={activeFilterCount > 0 ? 'primary' : 'default'}
            />
          </Badge>
        </Tooltip>
      </Stack>

      {/* Filters Row */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 160 }}>
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
            <ToggleButton value="class">Classes</ToggleButton>
            <ToggleButton value="function">Functions</ToggleButton>
            <ToggleButton value="module">Modules</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {onAbstractionFilterChange && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Abstraction</InputLabel>
            <Select
              value={abstractionFilter}
              label="Abstraction"
              onChange={(e) => onAbstractionFilterChange(e.target.value as typeof abstractionFilter)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        )}
      </Stack>

      {/* Pattern Filter Row */}
      {availablePatterns.length > 0 && (
        <Autocomplete
          multiple
          size="small"
          options={availablePatterns}
          value={patternFilter}
          onChange={(_, newValue) => onPatternFilterChange(newValue)}
          getOptionLabel={(option) =>
            option.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Pattern"
              placeholder={patternFilter.length === 0 ? 'Select patterns...' : ''}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...props } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option.replace(/_/g, ' ')}
                  size="small"
                  {...props}
                />
              );
            })
          }
          sx={{ maxWidth: 500 }}
        />
      )}
    </Stack>
  );
}
