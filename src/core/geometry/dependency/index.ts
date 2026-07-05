export { DependencyGraph } from "./DependencyGraph";
export type {
  DependencyGraphError,
  DependencyGraphResult,
  DependencyNode,
} from "./DependencyNode";
export {
  normalizeDependencyMetadata,
  propagateGeometryUpdates,
  validateDependencyGraph,
} from "./GeometryUpdateEngine";
