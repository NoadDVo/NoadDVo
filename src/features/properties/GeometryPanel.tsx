import {
  EPSILON,
  angleDegrees,
  distance,
  getArcGeometry,
  getRegionArea,
  isRightAngle,
  polygonArea,
  getEllipticalArcGeometry,
  type GeometryObject,
} from "../../core/geometry";
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
  ToggleRow,
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

  if (object.type === "arc") {
    const arc = getArcGeometry(object, objects);

    return (
      <Section title="Geometry">
        <Readout label="Center" value={object.centerPointId} />
        <Readout label="Start" value={object.startPointId} />
        <Readout label="End" value={object.endPointId} />
        <Readout label="Direction" value={object.direction} />
        <Readout label="Radius" value={arc ? formatNumber(arc.radius) : "Unavailable"} />
      </Section>
    );
  }

  if (object.type === "elliptical-arc") {
    const ellipticalArc = getEllipticalArcGeometry(object, objects);

    return (
      <Section title="Geometry">
        <Readout label="Center" value={object.centerPointId} />
        <Readout label="Start" value={object.startPointId} />
        <Readout label="End" value={object.endPointId} />
        <Readout label="Direction" value={object.direction} />
        <Readout label="x radius" value={ellipticalArc ? formatNumber(ellipticalArc.rx) : "Unavailable"} />
        <Field label="y radius">
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "elliptical-arc"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      ry: parseNumber(event.target.value, current.ry),
                    }
                  : current,
              )
            }
            step={0.1}
            type="number"
            value={object.ry}
          />
        </Field>
      </Section>
    );
  }

  if (object.type === "region") {
    const area = getRegionArea(object, objects);

    return (
      <Section title="Geometry">
        <Readout label="Boundary Points" value={String(object.boundaryPointIds.length)} />
        <Readout label="Area" value={area === null ? "Unavailable" : formatNumber(area)} />
      </Section>
    );
  }

  if (object.type === "text") {
    return (
      <TextAnnotationPanel
        object={object}
        objects={objects}
        updateSelected={updateSelected}
      />
    );
  }

  if (object.type === "image") {
    return <ImageGeometry object={object} updateSelected={updateSelected} />;
  }

  return (
    <Section title="Geometry">
      <Readout label="Details" value="No editable geometry fields" />
    </Section>
  );
}

function ImageGeometry({
  object,
  updateSelected,
}: Pick<GeometryPanelProps, "updateSelected"> & {
  readonly object: Extract<GeometryObject, { readonly type: "image" }>;
}) {
  return (
    <Section title="Geometry">
      <div className="grid grid-cols-2 gap-2">
        <Field label="X">
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "image"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      x: parseNumber(event.target.value, current.x),
                    }
                  : current,
              )
            }
            step={0.1}
            type="number"
            value={object.x}
          />
        </Field>
        <Field label="Y">
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "image"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      y: parseNumber(event.target.value, current.y),
                    }
                  : current,
              )
            }
            step={0.1}
            type="number"
            value={object.y}
          />
        </Field>
        <Field label="Width">
          <TextInput
            min={EPSILON}
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "image"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      width: Math.max(EPSILON, parseNumber(event.target.value, current.width)),
                    }
                  : current,
              )
            }
            step={0.1}
            type="number"
            value={object.width}
          />
        </Field>
        <Field label="Height">
          <TextInput
            min={EPSILON}
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "image"
                  ? {
                      ...current,
                      height: Math.max(EPSILON, parseNumber(event.target.value, current.height)),
                      updatedAt: Date.now(),
                    }
                  : current,
              )
            }
            step={0.1}
            type="number"
            value={object.height}
          />
        </Field>
      </div>
      <Field label="Opacity">
        <TextInput
          max={1}
          min={0}
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "image"
                ? {
                    ...current,
                    opacity: Math.min(1, Math.max(0, parseNumber(event.target.value, current.opacity))),
                    updatedAt: Date.now(),
                  }
                : current,
            )
          }
          step={0.05}
          type="number"
          value={object.opacity}
        />
      </Field>
      <Readout label="Source Type" value={object.mimeType} />
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
      <ToggleRow
        checked={object.showLabel ?? true}
        label="Show Angle Measure"
        onChange={(checked) =>
          updateSelected((current) =>
            current.type === "angle"
              ? {
                  ...current,
                  showLabel: checked,
                  updatedAt: Date.now(),
                }
              : current,
          )
        }
      />
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
