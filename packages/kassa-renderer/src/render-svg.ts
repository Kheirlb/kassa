// TODO: Use kassa-layout.

import { CompilerResult } from "../../kassa-core/src/index.js";
import { directedLayout } from "./directed-layout.js";
import { symbols } from "./symbols.js";

export function renderSvg(input: CompilerResult): string {
  // TODO: Handle multiple projects?
  const project0 = input.workspace.projects[0];
  if (!project0) return "";
  const { nodes, edges } = directedLayout(project0);
  const edgeGroups = [];
  for (const edge of edges) {
    const edgeGroup = `<g>
        <line
          x1="${edge.fromPosition?.x ?? 0}"
          y1="${edge.fromPosition?.y ?? 0}"
          x2="${edge.toPosition?.x ?? 0}"
          y2="${edge.toPosition?.y ?? 0}"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          pointer-events="none"
        />
        <line
          x1="${edge.fromPosition?.x ?? 0}"
          y1="${edge.fromPosition?.y ?? 0}"
          x2="${edge.toPosition?.x ?? 0}"
          y2="${edge.toPosition?.y ?? 0}"
          stroke="transparent"
          stroke-width="8"
          pointer-events="stroke"
          style="cursor: pointer;" 
        />
      </g>
      `;
    edgeGroups.push(edgeGroup);
  }
  const nodeGroups = [];
  for (const node of nodes) {
    const nodeGroup = `<g transform="translate(${node.x}, ${node.y}) rotate(${node.deg ?? 0}, 0, 0)">
        ${symbols[node.schematicSymbolId ?? ""]}
      </g>
      `;
    nodeGroups.push(nodeGroup)
  }
  const svgText = `
    <svg xmlns="http://www.w3.org/2000/svg">
      ${edgeGroups.join("")}
      ${nodeGroups.join("")}
    </svg>`;
  return svgText;
}
