import {
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface DependencyBreakdownProps {
  dependencies: string[];
  externalDeps: string[];
  internalDeps: string[];
}

// Common Python standard library modules
const STDLIB_MODULES = new Set([
  'json', 'os', 'sys', 're', 'time', 'datetime', 'collections',
  'itertools', 'functools', 'pathlib', 'typing', 'dataclasses',
  'abc', 'enum', 'hashlib', 'uuid', 'logging', 'argparse',
  'subprocess', 'threading', 'multiprocessing', 'asyncio',
  'unittest', 'pytest', 'math', 'random', 'string'
]);

function categorizeDepencies(deps: string[]) {
  const stdlib: string[] = [];
  const thirdParty: string[] = [];

  deps.forEach(dep => {
    if (STDLIB_MODULES.has(dep.split('.')[0])) {
      stdlib.push(dep);
    } else {
      thirdParty.push(dep);
    }
  });

  return { stdlib, thirdParty };
}

export function DependencyBreakdown({
  dependencies,
  externalDeps,
  internalDeps
}: DependencyBreakdownProps) {
  const { stdlib, thirdParty } = categorizeDepencies(externalDeps);

  const hasLowImpact = thirdParty.length === 0 && internalDeps.length <= 3;
  const hasMediumImpact = thirdParty.length <= 2 || internalDeps.length <= 7;
  const impactLevel = hasLowImpact ? 'Low' : hasMediumImpact ? 'Medium' : 'High';
  const impactColor = hasLowImpact ? 'success' : hasMediumImpact ? 'info' : 'warning';

  return (
    <Stack spacing={3}>
      {/* External Dependencies */}
      {stdlib.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            External (Standard Library)
          </Typography>
          <List dense>
            {stdlib.map((dep) => (
              <ListItem key={dep} sx={{ py: 0.5 }}>
                <CheckIcon fontSize="small" sx={{ color: 'success.main', mr: 1 }} />
                <ListItemText
                  primary={dep}
                  secondary="Standard library - no installation needed"
                  primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {thirdParty.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            External (Third-Party)
          </Typography>
          <List dense>
            {thirdParty.map((dep) => (
              <ListItem key={dep} sx={{ py: 0.5 }}>
                <WarningIcon fontSize="small" sx={{ color: 'warning.main', mr: 1 }} />
                <ListItemText
                  primary={dep}
                  secondary="Requires package installation"
                  primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Internal Dependencies */}
      {internalDeps.length > 0 && (
        <Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Internal (Project-Specific)
          </Typography>
          <List dense>
            {internalDeps.map((dep) => (
              <ListItem key={dep} sx={{ py: 0.5 }}>
                <WarningIcon fontSize="small" sx={{ color: 'warning.main', mr: 1 }} />
                <ListItemText
                  primary={dep}
                  secondary="Can be abstracted or parameterized"
                  primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Impact Summary */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Extraction Impact
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`Impact: ${impactLevel}`}
            color={impactColor}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            {hasLowImpact
              ? 'Dependencies can easily be managed or abstracted'
              : hasMediumImpact
              ? 'Some refactoring needed to reduce coupling'
              : 'Significant refactoring required to extract'}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}
