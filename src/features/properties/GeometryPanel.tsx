import {
  EPSILON,
  angleDegrees,
  distance,
  isRightAngle,
  polygonArea,
  type GeometryObject,
} from "../../core/geometry";
import { MeasurementPanel } from "./MeasurementPanel";
import { TextAnnotationPanel } from "./TextAnnotationPanel";
import {
  Field,
  formatNumber,
  getCircleRadius,
  getPoint,
  parseNumber,
  Readout,
  Section,
  TextInput,
} from "./PropertyInspectorFields";

type GeometryPanelProps = {
  readonly object: GeometryObject;
  readonly objects: Record<string, GeometryObject>;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
};

export function GeometryPanel({
  object,
  objects,
  updateSelected,
}: GeometryPanelProps) {
  if (object.type === "point") {
    return <PointGeometry object={object} updateSelected={updateSelected} />;
  }

  if (object.type === "circle") {
    return (
      <CircleGeometry
        object={object}
        objects={objects}
        updateSelected={updateSelected}
      />
    );
  }

  if (object.type === "polygon") {
    const vertices = object.pointIds
      .map((pointId) => getPoint(objects, pointId))
      .filter((point): point is NonNullable<ReturnType<typeof getPoint>> => Boolean(point));
    const perimeter = vertices.reduce((sum, point, index) => {
      const next = vertices[(index + 1) % vertices.length];

      return next ? sum + distance(point, next) : sum;
    }, 0);

    return (
      <Section title="Geometry">
        <Readout label="Vertices" value={String(object.pointIds.length)} />
        <Readout label="Perimeter" value={formatNumber(perimeter)} />
        <Readout label="Area" value={formatNumber(Math.abs(polygonArea(vertices)))} />
      </Section>
    );
  }

  if (object.type === "line") {
    return (
      <Section title="Geometry">
        <Readout label="Point A" value={object.pointAId} />
        <Readout label="Point B" value={object.pointBId} />
      </Section>
    );
  }

  if (object.type === "ray") {
    return (
      <Section title="Geometry">
        <Readout label="Start" value={object.startPointId} />
        <Readout label="Through" value={object.throughPointId} />
      </Section>
    );
  }

  if (object.type === "vector") {
    return (
      <Section title="Geometry">
        <Readout label="Start" value={object.startPointId} />
        <Readout label="End" value={object.endPointId} />
      </Section>
    );
  }

  if (object.type === "segment") {
    return (
      <Section title="Geometry">
        <Readout label="Start" value={object.startPointId} />
        <Readout label="End" value={object.endPointId} />
      </Section>
    );
  }

  if (object.type === "angle") {
    return (
      <AngleGeometry
        object={object}
        objects={objects}
        updateSelected={updateSelected}
      />
    );
  }

  if (object.type === "text") {
    return <TextAnnotationPanel object={object} updateSelected={updateSelected} />;
  }

  if (object.type === "measurement") {
    return (
      <MeasurementPanel
        object={object}
        objects={objects}
        updateSelected={updateSelected}
      />
    );
  }

  return (
    <Section title="Geometry">
      <Readout label="Details" value="No editable geometry fields" />
    </Section>
  );
}

function PointGeometry({
  object,
  updateSelected,
}: Pick<GeometryPanelProps, "updateSelected"> & {
  readonly object: Extract<GeometryObject, { readonly type: "point" }>;
}) {
  return (
    <Section title="Geometry">
      <div className="grid grid-cols-2 gap-2">
        <Field label="X">
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "point"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      x: parseNumber(event.target.value, current.x),
                    }
                  : current,
              )
            }
            type="number"
            value={object.x}
          />
        </Field>
        <Field label="Y">
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "point"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      y: parseNumber(event.target.value, current.y),
                    }
                  : current,
              )
            }
            type="number"
            value={object.y}
          />
        </Field>
      </div>
    </Section>
  );
}

function CircleGeometry({
  object,
  objects,
  updateSelected,
}: Pick<GeometryPanelProps, "objects" | "updateSelected"> & {
  readonly object: Extract<GeometryObject, { readonly type: "circle" }>;
}) {
  const radius = getCircleRadius(object, objects);

  return (
    <Section title="Geometry">
      <Field label="Radius">
        <TextInput
          disabled={radius === null}
          min={EPSILON}
          onChange={(event) =>
            updateSelected((current) => {
              if (current.type !== "circle") {
                return current;
              }

              const nextRadius = Math.max(
                EPSILON,
                parseNumber(event.target.value, radius ?? EPSILON),
              );

              if (current.circleKind === "three-points") {
                return current;
              }

              return {
                centerPointId: current.centerPointId,
                circleKind: "center-radius",
                createdAt: current.createdAt,
                dependencies: [current.centerPointId],
                dependents: current.dependents,
                id: current.id,
                locked: current.locked,
                ...(current.metadata ? { metadata: current.metadata } : {}),
                ...(current.name ? { name: current.name } : {}),
                radius: nextRadius,
                style: current.style,
                type: "circle",
                updatedAt: Date.now(),
                visible: current.visible,
              };
            })
          }
          step={0.1}
          type="number"
          value={radius === null ? "" : formatNumber(Math.max(EPSILON, radius))}
        />
      </Field>
    </Section>
  );
}

function AngleGeometry({
  object,
  objects,
  updateSelected,
}: Pick<GeometryPanelProps, "objects" | "updateSelected"> & {
  readonly object: Extract<GeometryObject, { readonly type: "angle" }>;
}) {
  const pointA = getPoint(objects, object.pointAId);
  const vertex = getPoint(objects, object.vertexPointId);
  const pointC = getPoint(objects, object.pointCId);
  const angleValue =
    pointA && vertex && pointC
      ? `${formatNumber(angleDegrees(pointA, vertex, pointC))} deg`
      : "Unavailable";

  return (
    <Section title="Geometry">
      <Readout label="Point A" value={object.pointAId} />
      <Readout label="Vertex" value={object.vertexPointId} />
      <Readout label="Point C" value={object.pointCId} />
      <Readout
        label="Right Angle"
        value={pointA && vertex && pointC && isRightAngle(pointA, vertex, pointC) ? "Yes" : "No"}
      />
      <Readout label="Current Angle" value={angleValue} />
      <Field label="Radius">
        <TextInput
          min={EPSILON}
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "angle"
                ? {
                    ...current,
                    radius: Math.max(EPSILON, parseNumber(event.target.value, current.radius)),
                    updatedAt: Date.now(),
                  }
                : current,
            )
          }
          step={0.05}
          type="number"
          value={object.radius}
        />
      </Field>
      <Field label="Label">
        <TextInput
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "angle"
                ? {
                    ...current,
                    label: event.target.value,
                    name: event.target.value,
                    updatedAt: Date.now(),
                  }
                : current,
            )
          }
          value={object.label ?? object.name ?? ""}
        />
      </Field>
    </Section>
  );
}
