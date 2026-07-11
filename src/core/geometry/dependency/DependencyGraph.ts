import type { GeometryObjectRecord } from "../types";
import type {
  DependencyGraphError,
  DependencyGraphResult,
  DependencyNode,
} from "./DependencyNode";

type VisitState = "visiting" | "visited";

function invalid(
  error: DependencyGraphError,
): DependencyGraphResult<DependencyGraph> {
  return { error, valid: false };
}

function unique(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values));
}

export class DependencyGraph {
  private readonly nodes: ReadonlyMap<string, DependencyNode>;

  private constructor(nodes: ReadonlyMap<string, DependencyNode>) {
    this.nodes = nodes;
  }

  static fromObjects(
    objects: GeometryObjectRecord,
  ): DependencyGraphResult<DependencyGraph> {
    const childIdsByParent = new Map<string, string[]>();

    for (const object of Object.values(objects)) {
      childIdsByParent.set(object.id, []);
    }

    for (const object of Object.values(objects)) {
      for (const parentId of object.dependencies) {
        if (!objects[parentId]) {
          return invalid({
            code: "DEPENDENCY_MISSING_PARENT",
            message: "Geometry object references a missing dependency.",
            objectId: object.id,
          });
        }

        childIdsByParent.get(parentId)?.push(object.id);
      }
    }

    const nodes = new Map<string, DependencyNode>();

    for (const object of Object.values(objects)) {
      nodes.set(object.id, {
        children: unique(childIdsByParent.get(object.id) ?? []),
        id: object.id,
        parents: unique(object.dependencies),
      });
    }

    const graph = new DependencyGraph(nodes);
    const cycle = graph.findCycle();

    if (cycle) {
      return invalid({
        code: "DEPENDENCY_CYCLE",
        message: `Dependency cycle detected: ${cycle.join(" -> ")}.`,
        ...(cycle[0] ? { objectId: cycle[0] } : {}),
      });
    }

    return { valid: true, value: graph };
  }

  getNode(objectId: string): DependencyNode | null {
    return this.nodes.get(objectId) ?? null;
  }

  getChildren(objectId: string): readonly string[] {
    return this.nodes.get(objectId)?.children ?? [];
  }

  getParents(objectId: string): readonly string[] {
    return this.nodes.get(objectId)?.parents ?? [];
  }

  getDependentIds(rootObjectId: string): readonly string[] {
    const result: string[] = [];
    const visited = new Set<string>();

    const visit = (objectId: string) => {
      for (const childId of this.getChildren(objectId)) {
        if (visited.has(childId)) {
          continue;
        }

        visited.add(childId);
        result.push(childId);
        visit(childId);
      }
    };

    visit(rootObjectId);

    return result;
  }

  getTopologicalDependents(rootObjectId: string): readonly string[] {
    const dependents = new Set(this.getDependentIds(rootObjectId));
    const ordered = this.topologicalSort().filter((objectId) =>
      dependents.has(objectId),
    );

    return ordered;
  }

  topologicalSort(): readonly string[] {
    const visited = new Set<string>();
    const ordered: string[] = [];

    const visit = (objectId: string) => {
      if (visited.has(objectId)) {
        return;
      }

      visited.add(objectId);

      for (const childId of this.getChildren(objectId)) {
        visit(childId);
      }

      ordered.push(objectId);
    };

    for (const objectId of this.nodes.keys()) {
      visit(objectId);
    }

    return ordered.reverse();
  }

  private findCycle(): readonly string[] | null {
    const state = new Map<string, VisitState>();
    const stack: string[] = [];

    const visit = (objectId: string): readonly string[] | null => {
      const currentState = state.get(objectId);

      if (currentState === "visiting") {
        const cycleStart = stack.indexOf(objectId);

        return [...stack.slice(cycleStart), objectId];
      }

      if (currentState === "visited") {
        return null;
      }

      state.set(objectId, "visiting");
      stack.push(objectId);

      for (const childId of this.getChildren(objectId)) {
        const cycle = visit(childId);

        if (cycle) {
          return cycle;
        }
      }

      stack.pop();
      state.set(objectId, "visited");

      return null;
    };

    for (const objectId of this.nodes.keys()) {
      const cycle = visit(objectId);

      if (cycle) {
        return cycle;
      }
    }

    return null;
  }
}
