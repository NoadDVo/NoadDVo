import type { GeometryObject, GeometryObjectRecord, PointObject } from "../geometry";
import type { TikzScene } from "./TikzTypes";

const objectOrder = {
  polygon: 10,
  circle: 20,
  line: 30,
  segment: 40,
  point: 50,
  ray: 60,
  vector: 70,
  angle: 80,
} satisfies Record<GeometryObject["type"], number>;

export function buildTikzScene(objects: GeometryObjectRecord): TikzScene {
  const orderedObjects = Object.values(objects)
    .filter((object) => object.visible)
    .sort((a, b) => {
      const orderDelta = objectOrder[a.type] - objectOrder[b.type];

      return orderDelta === 0 ? a.id.localeCompare(b.id) : orderDelta;
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
      labels: [],
      points: [],
      shapes: [],
    },
  };
}
