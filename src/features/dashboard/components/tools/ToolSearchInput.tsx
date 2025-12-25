import { useState, useMemo, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Typography,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Code as FunctionIcon,
  Class as ClassIcon,
  Folder as ModuleIcon,
} from '@mui/icons-material';
import { useSearchCandidates } from '../../hooks/useToolsData';
import type { PreprocessedToolCandidate } from '../../types/tools';
import { ModularityChip } from './ModularityChip';

interface ToolSearchInputProps {
  onSelect?: (candidate: PreprocessedToolCandidate) => void;
  placeholder?: string;
}

export function ToolSearchInput({
  onSelect,
  placeholder = 'Search tools by name, type, or file...',
}: ToolSearchInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: results, isLoading, isFetching } = useSearchCandidates(query);

  const handleClear = useCallback(() => {
    setQuery('');
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (candidate: PreprocessedToolCandidate) => {
      onSelect?.(candidate);
      setQuery('');
      setIsOpen(false);
    },
    [onSelect]
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'function':
        return <FunctionIcon fontSize="small" color="primary" />;
      case 'class':
        return <ClassIcon fontSize="small" color="secondary" />;
      case 'module':
        return <ModuleIcon fontSize="small" color="action" />;
      default:
        return <FunctionIcon fontSize="small" />;
    }
  };

  const displayResults = useMemo(() => {
    if (!results) return [];
    return results.slice(0, 10); // Limit to 10 results
  }, [results]);

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 500 }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(e.target.value.length > 0);
        }}
        onFocus={() => query.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {(isLoading || isFetching) && (
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                )}
                {query && (
                  <IconButton size="small" onClick={handleClear}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          },
        }}
      />

      {isOpen && displayResults.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300,
          }}
        >
          <List dense>
            {displayResults.map((candidate, index) => (
              <ListItem
                key={`${candidate.name}-${candidate.file_path}-${index}`}
                component="div"
                onClick={() => handleSelect(candidate)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getIcon(candidate.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={500}>
                        {candidate.name}
                      </Typography>
                      <Chip
                        label={candidate.type}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.7rem' }}
                      />
                    </Stack>
                  }
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {candidate.file_path}
                      </Typography>
                      <ModularityChip
                        score={candidate.modularity_score}
                        size="small"
                      />
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>

          {results && results.length > 10 && (
            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Showing 10 of {results.length} results
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {isOpen && query.length > 0 && displayResults.length === 0 && !isLoading && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            p: 2,
            zIndex: 1300,
          }}
        >
          <Typography color="text.secondary" align="center">
            No results found for "{query}"
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
