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
  polygon: 80,
  angle: 90,
  point: 100,
  text: 110,
  image: 115,
  measurement: 120,
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
  const points = orderedObjects.filter(
    (object): object is PointObject => object.type === "point",
  );

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
