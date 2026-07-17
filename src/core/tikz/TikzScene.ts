import type { GeometryObject, GeometryObjectRecord, PointObject } from "../geometry";
import type { TikzOptions } from "./TikzOptions";
import type { TikzScene } from "./TikzTypes";

const objectOrder = {
  region: 10,
  line: 20,
  segment: 30,
  ray: 40,
  vector: 50,
  circle: 60,
  arc: 70,
  "elliptical-arc": 75,
  polygon: 80,
  angle: 90,
  point: 100,
  text: 110,
  image: 115,
  ellipse: 120,
  hyperbola: 121,
  polynomial: 122,
  slider: 123,
  distance: 124,
  area: 125,
} satisfies Record<GeometryObject["type"], number>;

export function buildTikzScene(
  objects: GeometryObjectRecord,
  options: Pick<TikzOptions, "showHiddenObjects">,
): TikzScene {
  const orderedObjects = Object.values(objects)
    .filter((object) => options.showHiddenObjects || object.visible)
    .sort((a, b) => {
      const orderDelta = objectOrder[a.type] - objectOrder[b.type];

      if (orderDelta !== 0) {
        return orderDelta;
      }

      const createdDelta = a.createdAt - b.createdAt;

      return createdDelta === 0 ? a.id.localeCompare(b.id) : createdDelta;
    });
  const requiredPointIds = new Set<string>();
  orderedObjects.forEach(obj => {
    if (obj.type === "point") {
      requiredPointIds.add(obj.id);
    }
    obj.dependencies.forEach(depId => {
      const depObj = objects[depId];
      if (depObj?.type === "point") {
        requiredPointIds.add(depId);
      }
    });
  });

  const points = Object.values(objects)
    .filter((object): object is PointObject => object.type === "point" && requiredPointIds.has(object.id))
    .sort((a, b) => {
      const createdDelta = a.createdAt - b.createdAt;
      return createdDelta === 0 ? a.id.localeCompare(b.id) : createdDelta;
    });

  return {
    objects,
    orderedObjects,
    points,
    sections: {
      coordinates: [],
      fills: [],
      labels: [],
      measurements: [],
      points: [],
      shapes: [],
    },
  };
}
