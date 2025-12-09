import { Paper, Stack, Typography, IconButton, Box } from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import type { ToolCandidate } from '../../types/tools';
import { ModularityChip } from './ModularityChip';
import { ExtractionPotentialBar } from './ExtractionPotentialBar';

interface ToolCandidateCardProps {
  candidate: ToolCandidate;
  onClick: () => void;
}

export function ToolCandidateCard({ candidate, onClick }: ToolCandidateCardProps) {
  return (
    <Paper
      sx={{
        p: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'action.hover',
          transform: 'translateX(4px)',
        },
      }}
      onClick={onClick}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" component="div">
              {candidate.name}
            </Typography>
            <ModularityChip score={candidate.modularity_score} />
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {candidate.type} • Line {candidate.line_number} • {candidate.description}
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {candidate.rationale}
          </Typography>

          <Box sx={{ maxWidth: 400 }}>
            <ExtractionPotentialBar value={candidate.extraction_potential} />
          </Box>
        </Box>

        <IconButton>
          <ChevronRightIcon />
        </IconButton>
      </Stack>
    </Paper>
  );
}
