import type { ReactNode } from 'react';
import {
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip
} from '@mui/material';

interface DependencyCardProps {
  title: string;
  count: number;
  items: string[];
  icon?: ReactNode;
  severity?: 'info' | 'warning' | 'error' | 'success';
  maxDisplay?: number;
}

export function DependencyCard({
  title,
  count,
  items,
  icon,
  severity = 'info',
  maxDisplay = 5
}: DependencyCardProps) {
  const displayItems = items.slice(0, maxDisplay);
  const remaining = items.length - displayItems.length;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        {icon && <Box sx={{ color: `${severity}.main` }}>{icon}</Box>}
        <Typography variant="h6" color={`${severity}.main`}>
          {count}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title.toLowerCase()}
        </Typography>
      </Stack>

      {items.length > 0 ? (
        <List dense disablePadding>
          {displayItems.map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.5 }}>
              <ListItemText
                primary={item}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontFamily: 'monospace',
                }}
              />
            </ListItem>
          ))}
          {remaining > 0 && (
            <ListItem disablePadding sx={{ py: 0.5 }}>
              <Chip
                label={`+${remaining} more`}
                size="small"
                variant="outlined"
              />
            </ListItem>
          )}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          None
        </Typography>
      )}
    </Stack>
  );
}
