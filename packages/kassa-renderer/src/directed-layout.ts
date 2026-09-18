import type { LayoutEdge, LayoutNode, NodeEdgeLayout } from './types.js';
import type { ComponentPlacement, ConnectionRoute, Port, Project } from "../../kassa-core/src/index.js";
import { getPointTransform, getPointTransformCentered, getPointTransformFromMat4, type Point } from "./math-helpers.js";
import { vec3, quat, mat4 } from "gl-matrix";

// TODO: Someday don't render lines if they are 0 in length?
// TODO: Allow override via parser.
export const DefaultConnectionLength = 60;

const defaultFromPort: Port = {
  id: "from",
  x: 120,
  y: 60,
  rot: 0,
}

const defaultToPort: Port = {
  id: "to",
  x: 0,
  y: 60,
  rot: 0,
}

// Primary function to get the next location for a component in the layout.
export function getNextLocation(
  Origin_To_CurrentSymbol: mat4,
  currentSymbolOutlet: Point,
  nextSymbolInlet: Point,
  ConnectionRoute?: ConnectionRoute,
  toComponentPosition?: ComponentPlacement,
  Origin_To_NextSymbolExisting?: mat4,
  isDirectConnection?: boolean
) {
  // Get origin to the current symbol's outlet.
  const CurrentSymbol_To_CurrentSymbolOulet = getPointTransform(currentSymbolOutlet.x, currentSymbolOutlet.y, currentSymbolOutlet.rot);
  const Origin_To_CurrentSymbolOutlet = mat4.create();
  mat4.multiply(Origin_To_CurrentSymbolOutlet, Origin_To_CurrentSymbol, CurrentSymbol_To_CurrentSymbolOulet);

  // Get the next symbol's inlet transform (but inverted so we can back out symbol position).
  const NextSymbol_To_NextSymbolInlet = getPointTransform(nextSymbolInlet.x, nextSymbolInlet.y, nextSymbolInlet.rot);
  const NextSymbolInlet_To_NextSymbol = mat4.create();
  mat4.invert(NextSymbolInlet_To_NextSymbol, NextSymbol_To_NextSymbolInlet);

  // From the current symbol's outlet, get the transform to the next symbol's inlet.
  // There are several cases to handle with increasing complexity:
  // Single edge cases:
    // 1.0 A --> newB.
    // 1.1 A --> existingB.
    // 2.1 A --> ComponentPlacement(newB).

  // Multi-edge cases:
    // 3.0 A --> (ConnectionRoute) --> newB.
    // 3.1 A --> (ConnectionRoute) --> existingB.
    // 3.2 A --> (ConnectionRoute) --> ComponentPlacement(newB).

  // Track each section of the edge as a transform.
  const edgeTransforms: mat4[] = [];

  // If we have a connection layout, generate the relative transform and save it.
  if (ConnectionRoute && ConnectionRoute.segments.length != 0) {
    for (const section of ConnectionRoute.segments) {
      // Separately apply rotation and translation to the section because
      // we want to apply the rotation first, then the translation.
      const length = section.length ?? DefaultConnectionLength;
      const degrees = section.deg ?? 0;
      let sectionRotation = mat4.create();
      let sectionTranslation = mat4.create();
      mat4.fromRotationTranslation(sectionRotation, quat.fromEuler(quat.create(), 0, 0, degrees), vec3.fromValues(0, 0, 0));
      mat4.fromRotationTranslation(sectionTranslation, quat.create(), vec3.fromValues(length, 0, 0));
      let sectionTransform = mat4.create();
      mat4.multiply(sectionTransform, sectionRotation, sectionTranslation);
      edgeTransforms.push(sectionTransform);
    }
  } else if (Origin_To_NextSymbolExisting) {
    // If the to position, already exists, just finish the transform from the current edge position out.
    // We need this for loops, and will finish handling this case later since
    // it requires knowing the complete chained transform of all edges to create the final connecting edge.
  } else if (toComponentPosition) {
    // Apply the user provided component transform if it exists.
    // Currently this is assumed relative to itself (starting position).
    // TODO: Support global/absolute positioning of components and relative to other components.
    const UserComponentPositionTransform = getPointTransform(toComponentPosition.x, toComponentPosition.y, toComponentPosition.rot);
    edgeTransforms.push(UserComponentPositionTransform);
  } else {
    // If we don't have a connection layout or component layout, just use the default connection length,
    // unless it is a direct connection.
    const DefaultCurrentSymbolOulet_To_NextSymbolInlet = mat4.create();
    mat4.fromTranslation(DefaultCurrentSymbolOulet_To_NextSymbolInlet, vec3.fromValues(isDirectConnection ? 0 : DefaultConnectionLength, 0, 0));
    edgeTransforms.push(DefaultCurrentSymbolOulet_To_NextSymbolInlet);
  }

  // Actually map over all the transforms, generating the total transform, and the "baked" edges.
  const edges: LayoutEdge[] = [];
  let CurrentSymbolOulet_To_LatestConnectionSectionEnd = mat4.create();
  for (const edgeTransform of edgeTransforms) {
    // Determine/save the beginning position of the edge.
    const Origin_To_SectionFrom = mat4.create();
    mat4.multiply(Origin_To_SectionFrom, Origin_To_CurrentSymbolOutlet, CurrentSymbolOulet_To_LatestConnectionSectionEnd);

    // Apply the edge transform to continue a chain.
    mat4.multiply(CurrentSymbolOulet_To_LatestConnectionSectionEnd, CurrentSymbolOulet_To_LatestConnectionSectionEnd, edgeTransform);

    // Now determine the end position of the edge.
    const Origin_To_SectionTo = mat4.create();
    mat4.multiply(Origin_To_SectionTo, Origin_To_CurrentSymbolOutlet, CurrentSymbolOulet_To_LatestConnectionSectionEnd);

    // Create an edge for this section.
    const sectionFromPoint = getPointTransformFromMat4(Origin_To_SectionFrom);
    const sectionToPoint = getPointTransformFromMat4(Origin_To_SectionTo);
    edges.push({
      fromPosition: {
        x: sectionFromPoint.x,
        y: sectionFromPoint.y,
      },
      toPosition: {
        x: sectionToPoint.x,
        y: sectionToPoint.y,
      }
    });
  }

  // Combine the transforms to get the origin to the next symbol.
  let Origin_To_MaybeNextSymbolInlet = mat4.create();
  mat4.multiply(Origin_To_MaybeNextSymbolInlet, Origin_To_CurrentSymbolOutlet, CurrentSymbolOulet_To_LatestConnectionSectionEnd);
  
  // Connect the final edge to the existing next symbol if it exists.
  if (Origin_To_NextSymbolExisting) {
    const sectionFromPoint = getPointTransformFromMat4(Origin_To_MaybeNextSymbolInlet);
    // If we have an existing transform, figure out the actualy inlet position.
    mat4.multiply(Origin_To_MaybeNextSymbolInlet, Origin_To_NextSymbolExisting, NextSymbol_To_NextSymbolInlet);
    const sectionToPoint = getPointTransformFromMat4(Origin_To_MaybeNextSymbolInlet);
    edges.push({
      fromPosition: {
        x: sectionFromPoint.x,
        y: sectionFromPoint.y,
      },
      toPosition: {
        x: sectionToPoint.x,
        y: sectionToPoint.y,
      }
    });
  }

  // Save the next symbols transform.
  const Origin_To_NextSymbol = mat4.create();
  mat4.multiply(Origin_To_NextSymbol, Origin_To_MaybeNextSymbolInlet, NextSymbolInlet_To_NextSymbol);

  // And pre-generate the node for the symbol (useful for debugging, see test() below).
  const NextSymbolNode = getPointTransformFromMat4(Origin_To_NextSymbol);

  return {
    transform: Origin_To_NextSymbol,
    node: NextSymbolNode,
    edges: edges
  };
}


// Get "base" definition.
// TODO: Handle inherited stuff and maybe add recursion limit.
export function getBaseComponentDefinition(project: Project, definitionId: string) {
  const definition = project.componentDefinitions[definitionId];
  if (definition?.extendsId) {
    return getBaseComponentDefinition(project, definition.extendsId)
  }
  return definition;
}


// Build a layout piece by piece as if building in real life.
export function directedLayout(
  schematic: Project,
): NodeEdgeLayout {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  // Assuming left to right (0 degrees).
  // TODO: Make it easier to handle top to bottom?
  const Origin_To_FirstComponent = getPointTransform(0, 0, 0);

  let componentTransforms = new Map<string, mat4>();

  for (const connection of schematic.connectionInstances ?? []) {
    // Skip connections that are not defined.
    const fromComponent = schematic.componentInstances.find((component) => component.id === connection.from.componentId);
    const toComponent = schematic.componentInstances.find((component) => component.id === connection.to.componentId);
    if (!fromComponent || !toComponent) {
      console.warn("Connection references non-existent component: ", connection);
      continue;
    };

    // Extract from connection point.
    // TODO: Fix. This will not "inherit" ports like you want... FYI.
    const fromComponentConfig = schematic.componentDefinitions[fromComponent.definitionId]
    const fromConnectionPoints = fromComponentConfig?.ports ?? [];
    const fromPointIndex = fromConnectionPoints.findIndex(point => point.id === connection.from.portId);
    let fromPoint = fromConnectionPoints[fromPointIndex] ?? fromConnectionPoints[fromConnectionPoints.length - 1];

    // Grab the to component position.
    // TODO: Somehow choose the correct layout?
    const layout0 = schematic.layouts[0];
    const toComponentPosition = layout0?.placements?.find(pos => pos.componentId === toComponent.id);
    const fromComponentPosition = layout0?.placements?.find(pos => pos.componentId === fromComponent.id);

    // Extract to connection point.
    const toComponentConfig = schematic.componentDefinitions[toComponent.definitionId]
    const toConnectionPoints = toComponentConfig?.ports ?? [];
    const toPointIndex = toConnectionPoints.findIndex(point => point.id === connection.to.portId);
    let toPoint = toConnectionPoints[toPointIndex] ?? toConnectionPoints[0];
    // Flip the "outlet" to be an "inlet".
    // console.log("Flipping outlet to inlet for the toPoint connection: ", connection);
    if (toPoint) {
      toPoint = {
        ...toPoint,
        rot: (toPoint?.rot ?? 0) + 180,
      }
    }
    // Flip (mirror) about x?
    if (toComponentPosition?.mirror && toPoint) {
      toPoint = {
        ...toPoint,
        x: 60 - (toPoint.x - 60),
        rot: 360 - ((toPoint.rot ?? 0) - 180)
      }
    }
    if (fromComponentPosition?.mirror && fromPoint) {
      fromPoint = {
        ...fromPoint,
        x: 60 - (fromPoint.x - 60),
        rot: 360 - ((fromPoint.rot ?? 0) - 180)
      }
    }

    // Determing the best starting location for the first node vs already placed nodes.
    let startingComponentPosition = Origin_To_FirstComponent;
    if (fromComponentPosition) {
      startingComponentPosition = getPointTransformCentered(fromComponentPosition.x, fromComponentPosition.y, fromComponentPosition.rot ?? 0);
    }
    const Origin_To_CurrentSymbol = componentTransforms.get(fromComponent.id) ?? startingComponentPosition;

    // Handle the cases where the edges require unique transforms from a layout definition or an existing placement.
    const connectionLayout = layout0?.routes?.find(layout => layout.connectionId === connection.id);
    const maybeExistingToComponentTransform = componentTransforms.get(toComponent.id)

    // Actually determine the next location (and the edges required).
    const nextLocation = getNextLocation(
      Origin_To_CurrentSymbol,
      fromPoint ?? defaultFromPort,
      toPoint ?? defaultToPort,
      connectionLayout,
      toComponentPosition,
      maybeExistingToComponentTransform,
      connection.isDirectConnection
    );

    // Don't overwrite existing transforms for components.
    if (!componentTransforms.has(fromComponent.id)) {
      componentTransforms.set(fromComponent.id, Origin_To_CurrentSymbol);
    }
    if (!componentTransforms.has(toComponent.id)) {
      componentTransforms.set(toComponent.id, nextLocation.transform);
    }

    // Create an edge (or "edges") between the two components.
    for (const [index, edge] of nextLocation.edges.entries()) {
      edges.push({
        id: `${fromComponent.id}.${connection.from.portId} --> ${connection.to.portId}.${toComponent.id}-${index}`,
        fromNodeId: fromComponent.id,
        fromNodeSubId: connection.from.portId,
        toNodeId: toComponent.id,
        toNodeSubId: connection.to.portId,
        ...edge,
      }); 
    }
  }

  // Edge case if there are no connections, we still need to place the components (likely just the first one).
  if (!schematic.connectionInstances && schematic.componentInstances.length === 1) {
    const firstComponent = schematic.componentInstances[0];
    if (firstComponent) { // appease compiler!
      componentTransforms.set(firstComponent.id, Origin_To_FirstComponent);
    }
  }

  // Generate available tag colors.
  const tagIdToColor = new Map<string, string>();
  // Fix tag search.
  // for (const [tagGroupId, tagGroup] of Object.entries(schematic.tags ?? {})) {
  //   for (const tag of tagGroup.tags) {
  //     if (tag.color) {
  //       tagIdToColor.set(`${tagGroupId}.${tag.id}`, tag.color);
  //     }
  //   }
  // }


  // Create nodes based on the component positions.
  for (const [componentId, transform] of componentTransforms.entries()) {
    const component = schematic.componentInstances.find((comp) => comp.id === componentId);
    // Use the tag ids to figure out color.
    const maybeColor = component?.tagIds?.map(tagId => tagIdToColor.get(tagId)).find(color => color !== undefined);
    // TODO: Fix base definition lookup.
    const baseDefinition = getBaseComponentDefinition(schematic, component?.definitionId  ?? "");

    if (component) {
      const node = getPointTransformFromMat4(transform);
      nodes.push({
        id: component.id,
        schematicSymbolId: baseDefinition?.svg ?? "",
        name: component.name,
        x: node.x,
        y: node.y,
        deg: node.rot ?? 0,
        width: 120,
        height: 120,
        color: maybeColor ?? "",
      });
    }
  }

  return {
    nodes,
    edges,
  };
}
