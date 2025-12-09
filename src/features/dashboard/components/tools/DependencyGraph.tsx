import { Box, useTheme } from '@mui/material';
import type { UtilityModule } from '../../types/tools';

interface DependencyGraphProps {
  module: UtilityModule;
  external: string[];
  internal: string[];
}

export function DependencyGraph({ module, external, internal }: DependencyGraphProps) {
  const theme = useTheme();

  const maxDeps = Math.max(external.length, internal.length);
  const height = Math.max(300, maxDeps * 60 + 100);

  const externalColor = theme.palette.info.main;
  const internalColor = theme.palette.warning.main;
  const moduleColor = theme.palette.primary.main;

  // Calculate positions
  const externalX = 50;
  const moduleX = 250;
  const internalX = 450;
  const startY = 50;
  const depSpacing = 50;

  return (
    <Box
      sx={{
        width: '100%',
        height,
        overflow: 'auto',
      }}
    >
      <svg width="600" height={height} style={{ display: 'block' }}>
        {/* Column Labels */}
        <text
          x={externalX}
          y={startY - 20}
          fontSize="14"
          fontWeight="600"
          fill={theme.palette.text.primary}
        >
          External Deps
        </text>
        <text
          x={moduleX}
          y={startY - 20}
          fontSize="14"
          fontWeight="600"
          fill={theme.palette.text.primary}
        >
          This Module
        </text>
        <text
          x={internalX}
          y={startY - 20}
          fontSize="14"
          fontWeight="600"
          fill={theme.palette.text.primary}
        >
          Internal Deps
        </text>

        {/* External Dependencies */}
        {external.map((dep, i) => (
          <g key={`ext-${dep}`} transform={`translate(${externalX}, ${startY + i * depSpacing})`}>
            <rect
              width="100"
              height="40"
              rx="4"
              fill={theme.palette.info.light}
              stroke={externalColor}
              strokeWidth="2"
            />
            <text
              x="50"
              y="25"
              textAnchor="middle"
              fontSize="12"
              fill={theme.palette.text.primary}
            >
              {dep.length > 12 ? `${dep.slice(0, 12)}...` : dep}
            </text>
          </g>
        ))}

        {/* Center Module */}
        <g transform={`translate(${moduleX}, ${startY + maxDeps * depSpacing / 2 - 20})`}>
          <rect
            width="140"
            height="80"
            rx="8"
            fill={theme.palette.primary.light}
            stroke={moduleColor}
            strokeWidth="3"
          />
          <text
            x="70"
            y="30"
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fill={theme.palette.text.primary}
          >
            {module.file_path.split('/').pop()?.slice(0, 15)}
          </text>
          <text
            x="70"
            y="50"
            textAnchor="middle"
            fontSize="11"
            fill={theme.palette.text.secondary}
          >
            {module.function_count}f • {module.class_count}c
          </text>
        </g>

        {/* Internal Dependencies */}
        {internal.map((dep, i) => (
          <g key={`int-${dep}`} transform={`translate(${internalX}, ${startY + i * depSpacing})`}>
            <rect
              width="100"
              height="40"
              rx="4"
              fill={theme.palette.warning.light}
              stroke={internalColor}
              strokeWidth="2"
            />
            <text
              x="50"
              y="25"
              textAnchor="middle"
              fontSize="12"
              fill={theme.palette.text.primary}
            >
              {dep.length > 12 ? `${dep.slice(0, 12)}...` : dep}
            </text>
          </g>
        ))}

        {/* Connecting Lines - External to Module */}
        {external.map((_, i) => (
          <line
            key={`line-ext-${i}`}
            x1={externalX + 100}
            y1={startY + i * depSpacing + 20}
            x2={moduleX}
            y2={startY + maxDeps * depSpacing / 2 + 20}
            stroke={externalColor}
            strokeWidth="2"
            opacity="0.5"
          />
        ))}

        {/* Connecting Lines - Module to Internal */}
        {internal.map((_, i) => (
          <line
            key={`line-int-${i}`}
            x1={moduleX + 140}
            y1={startY + maxDeps * depSpacing / 2 + 20}
            x2={internalX}
            y2={startY + i * depSpacing + 20}
            stroke={internalColor}
            strokeWidth="2"
            opacity="0.5"
          />
        ))}
      </svg>
    </Box>
  );
}
