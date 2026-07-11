"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyGraph = void 0;
function invalid(error) {
    return { error, valid: false };
}
function unique(values) {
    return Array.from(new Set(values));
}
class DependencyGraph {
    nodes;
    constructor(nodes) {
        this.nodes = nodes;
    }
    static fromObjects(objects) {
        const childIdsByParent = new Map();
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
        const nodes = new Map();
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
    getNode(objectId) {
        return this.nodes.get(objectId) ?? null;
    }
    getChildren(objectId) {
        return this.nodes.get(objectId)?.children ?? [];
    }
    getParents(objectId) {
        return this.nodes.get(objectId)?.parents ?? [];
    }
    getDependentIds(rootObjectId) {
        const result = [];
        const visited = new Set();
        const visit = (objectId) => {
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
    getTopologicalDependents(rootObjectId) {
        const dependents = new Set(this.getDependentIds(rootObjectId));
        const ordered = this.topologicalSort().filter((objectId) => dependents.has(objectId));
        return ordered;
    }
    topologicalSort() {
        const visited = new Set();
        const ordered = [];
        const visit = (objectId) => {
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
    findCycle() {
        const state = new Map();
        const stack = [];
        const visit = (objectId) => {
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
exports.DependencyGraph = DependencyGraph;
