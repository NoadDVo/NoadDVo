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
  readonly label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "points", label: "Points" },
  { id: "lines", label: "Lines" },
  { id: "circles", label: "Circles" },
  { id: "construction", label: "Construction" },
  { id: "measurements", label: "Measurements" },
  { id: "hidden", label: "Hidden" },
  { id: "locked", label: "Locked" },
];

const sectionLabels: readonly {
  readonly id: string;
  readonly label: string;
  readonly accepts: (object: GeometryObject) => boolean;
}[] = [
  { accepts: (object) => object.type === "point", id: "points", label: "Points" },
  { accepts: (object) => object.type === "segment", id: "segments", label: "Segments" },
  { accepts: (object) => object.type === "line", id: "lines", label: "Lines" },
  { accepts: (object) => object.type === "ray", id: "rays", label: "Rays" },
  { accepts: (object) => object.type === "vector", id: "vectors", label: "Vectors" },
  { accepts: (object) => object.type === "circle", id: "circles", label: "Circles" },
  { accepts: (object) => object.type === "arc", id: "arcs", label: "Arcs" },
  { accepts: (object) => object.type === "polygon", id: "polygons", label: "Polygons" },
  { accepts: (object) => object.type === "region", id: "regions", label: "Regions" },
  { accepts: (object) => object.type === "angle", id: "angles", label: "Angles" },
  { accepts: (object) => object.type === "text", id: "text", label: "Text" },
  {
    accepts: (object) => object.type === "measurement",
    id: "measurements",
    label: "Measurements",
  },
  {
    accepts: (object) => object.dependencies.length > 0,
    id: "construction",
    label: "Construction",
  },
];

function isLineLike(object: GeometryObject): boolean {
  return ["segment", "line", "ray", "vector"].includes(object.type);
}

function matchesFilter(object: GeometryObject, filter: ObjectTreeFilter): boolean {
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
    return object.type === "measurement";
  }

  if (filter === "hidden") {
    return !object.visible;
  }

  return object.locked;
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
): readonly ObjectTreeSection[] {
  const orderedObjects = Object.values(objects)
    .filter((object) => matchesFilter(object, filter))
    .filter((object) => matchesSearch(object, query))
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

  return sectionLabels
    .map((section) => ({
      id: section.id,
      label: section.label,
      objects: orderedObjects.filter(section.accepts),
    }))
    .filter((section) => section.objects.length > 0);
}
