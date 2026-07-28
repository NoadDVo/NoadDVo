import type { GeometryObject, GeometryObjectRecord } from "../../core/geometry";

export type ObjectTreeFilter =
  | "all"
  | "points"
  | "lines"
  | "circles"
  | "construction"
  | "measurements"
  | "hidden"
  | "locked";

export type ObjectTreeSection = {
  readonly id: string;
  readonly label: string;
  readonly objects: readonly GeometryObject[];
};

export const objectTreeFilters: readonly {
  readonly id: ObjectTreeFilter;
  readonly labelKey: string;
}[] = [
  { id: "all", labelKey: "tree.filterAll" },
  { id: "points", labelKey: "tree.filterPoints" },
  { id: "lines", labelKey: "tree.filterLines" },
  { id: "circles", labelKey: "tree.filterCircles" },
  { id: "construction", labelKey: "tree.filterConstruction" },
  { id: "measurements", labelKey: "tree.filterMeasurements" },
  { id: "hidden", labelKey: "tree.filterHidden" },
  { id: "locked", labelKey: "tree.filterLocked" },
];

const sectionLabels: readonly {
  readonly id: string;
  readonly labelKey: string;
  readonly accepts: (object: GeometryObject) => boolean;
}[] = [
  { accepts: (object) => object.type === "point", id: "points", labelKey: "tree.sectionPoints" },
  { accepts: (object) => object.type === "segment", id: "segments", labelKey: "tree.sectionSegments" },
  { accepts: (object) => object.type === "line", id: "lines", labelKey: "tree.sectionLines" },
  { accepts: (object) => object.type === "ray", id: "rays", labelKey: "tree.sectionRays" },
  { accepts: (object) => object.type === "vector", id: "vectors", labelKey: "tree.sectionVectors" },
  { accepts: (object) => object.type === "circle", id: "circles", labelKey: "tree.sectionCircles" },
  { accepts: (object) => object.type === "arc", id: "arcs", labelKey: "tree.sectionArcs" },
  { accepts: (object) => object.type === "polygon", id: "polygons", labelKey: "tree.sectionPolygons" },
  { accepts: (object) => object.type === "region", id: "regions", labelKey: "tree.sectionRegions" },
  { accepts: (object) => object.type === "angle", id: "angles", labelKey: "tree.sectionAngles" },
  { accepts: (object) => object.type === "text", id: "text", labelKey: "tree.sectionText" },
  { accepts: (object) => object.type === "slider", id: "sliders", labelKey: "tree.sectionSliders" },
  {
    accepts: (object) => object.dependencies.length > 0,
    id: "construction",
    labelKey: "tree.sectionConstruction",
  },
];

function isLineLike(object: GeometryObject): boolean {
  return ["segment", "line", "ray", "vector"].includes(object.type);
}

export function matchesFilter(object: GeometryObject, filter: ObjectTreeFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "points") {
    return object.type === "point";
  }

  if (filter === "lines") {
    return isLineLike(object);
  }

  if (filter === "circles") {
    return object.type === "circle";
  }

  if (filter === "construction") {
    return object.dependencies.length > 0;
  }

  if (filter === "measurements") {
    return false;
  }

  if (filter === "hidden") {
    return !object.visible;
  }

  return object.locked;
}

export function countObjectsPerFilter(
  objects: GeometryObjectRecord,
): Readonly<Record<ObjectTreeFilter, number>> {
  const allObjects = Object.values(objects);
  const visibleObjects = allObjects.filter((o) => o.visible);

  return {
    all: visibleObjects.length,
    circles: visibleObjects.filter((o) => o.type === "circle").length,
    construction: visibleObjects.filter((o) => o.dependencies.length > 0).length,
    hidden: allObjects.filter((o) => !o.visible).length,
    lines: visibleObjects.filter((o) => isLineLike(o)).length,
    locked: allObjects.filter((o) => o.locked).length,
    measurements: 0,
    points: visibleObjects.filter((o) => o.type === "point").length,
  };
}

function matchesSearch(object: GeometryObject, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [object.name, object.type, object.id]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function getObjectDisplayName(object: GeometryObject): string {
  return object.name?.trim() || object.id;
}

export function createObjectTreeSections(
  objects: GeometryObjectRecord,
  filter: ObjectTreeFilter,
  query: string,
): readonly (Omit<ObjectTreeSection, 'label'> & { labelKey: string })[] {
  const orderedObjects = Object.values(objects)
    .filter((object) => {
      // Always hide internal/ghost derived points (visible === false) unless user explicitly browsing hidden items
      if (filter !== "hidden" && object.visible === false) return false;
      return matchesFilter(object, filter);
    })
    .filter((object) => matchesSearch(object, query))
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

  return sectionLabels
    .map((section) => ({
      id: section.id,
      labelKey: section.labelKey,
      objects: orderedObjects.filter(section.accepts),
    }))
    .filter((section) => section.objects.length > 0);
}
