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
import { useTranslation } from "../../lib/useTranslation";
import { TextAnnotationPanel } from "./TextAnnotationPanel";
import {
  Field,
  formatNumber,
  getCircleRadius,
  getPoint,
  parseNumber,
  Readout,
  SelectInput,
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
    return <PointGeometry object={object} objects={objects} updateSelected={updateSelected} />;
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

    return <PolygonGeometryPanel vertices={vertices} perimeter={perimeter} object={object} />;
  }

  if (object.type === "line") {
    return <LineGeometryPanel object={object} updateSelected={updateSelected} />;
  }

  if (object.type === "ray") {
    return <RayGeometryPanel object={object} />;
  }

  if (object.type === "vector") {
    return <VectorGeometryPanel object={object} />;
  }

  if (object.type === "segment") {
    return <SegmentGeometryPanel object={object} updateSelected={updateSelected} />;
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
    return <ArcGeometryPanel object={object} objects={objects} />;
  }

  if (object.type === "elliptical-arc") {
    return <EllipticalArcGeometryPanel object={object} objects={objects} updateSelected={updateSelected} />;
  }

  if (object.type === "region") {
    return <RegionGeometryPanel object={object} objects={objects} />;
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

  if (object.type === "slider") {
    return <SliderGeometry object={object as import("../../core/geometry").SliderObject} updateSelected={updateSelected} />;
  }

  return <DefaultGeometryPanel />;
}

function DefaultGeometryPanel() {
  const { t } = useTranslation();
  return (
    <Section title={t("geom.geometry")}>
      <Readout label={t("geom.details")} value={t("geom.noEditable")} />
    </Section>
  );
}

function PolygonGeometryPanel({
  vertices,
  perimeter,
  object,
}: {
  readonly vertices: { x: number; y: number }[];
  readonly perimeter: number;
  readonly object: Extract<GeometryObject, { readonly type: "polygon" }>;
}) {
  const { t } = useTranslation();
  return (
    <Section title={t("geom.geometry")}>
      <Readout label={t("geom.vertices")} value={String(object.pointIds.length)} />
      <Readout label={t("geom.perimeter")} value={formatNumber(perimeter)} />
      <Readout label={t("geom.area")} value={formatNumber(Math.abs(polygonArea(vertices)))} />
    </Section>
  );
}

function LineGeometryPanel({
  object,
  updateSelected,
}: {
  readonly object: Extract<GeometryObject, { readonly type: "line" }>;
  readonly updateSelected: GeometryPanelProps["updateSelected"];
}) {
  const { t } = useTranslation();
  const showEqualityTicks = (object.lineKind === "perpendicular" ||
        object.lineKind === "perpendicular-bisector" ||
        object.lineKind === "angle-bisector" ||
        object.lineKind === "angle-bisector-4step" ||
        object.specialLineKind === "perpendicular-bisector-3step" ||
        object.specialLineKind === "angle-bisector" ||
        object.specialLineKind === "altitude");
        
  if (!showEqualityTicks) return null;
  
  return (
    <Section title={t("geom.geometry")}>
      <ToggleRow
        checked={object.showEqualityTicks ?? false}
        label={t("geom.showEqualityTicks")}
        onChange={(checked) =>
          updateSelected((current) =>
            current.type === "line"
              ? { ...current, showEqualityTicks: checked }
              : current
          )
        }
      />
    </Section>
  );
}

function RayGeometryPanel({
  object,
}: {
  readonly object: Extract<GeometryObject, { readonly type: "ray" }>;
}) {
  return null;
}

function VectorGeometryPanel({
  object,
}: {
  readonly object: Extract<GeometryObject, { readonly type: "vector" }>;
}) {
  return null;
}

function SegmentGeometryPanel({
  object,
  updateSelected,
}: {
  readonly object: Extract<GeometryObject, { readonly type: "segment" }>;
  readonly updateSelected: GeometryPanelProps["updateSelected"];
}) {
  const { t } = useTranslation();
  const showEqualityTicks = (object.specialLineKind === "perpendicular-bisector-3step" ||
        object.specialLineKind === "angle-bisector" ||
        object.specialLineKind === "altitude");
        
  if (!showEqualityTicks) return null;
  
  return (
    <Section title={t("geom.geometry")}>
      <ToggleRow
        checked={object.showEqualityTicks ?? false}
        label={t("geom.showEqualityTicks")}
        onChange={(checked) =>
          updateSelected((current) =>
            current.type === "segment"
              ? { ...current, showEqualityTicks: checked }
              : current
          )
        }
      />
    </Section>
  );
}

function ArcGeometryPanel({
  object,
  objects,
}: {
  readonly object: Extract<GeometryObject, { readonly type: "arc" }>;
  readonly objects: Record<string, GeometryObject>;
}) {
  const { t } = useTranslation();
  const arc = getArcGeometry(object, objects);
  return (
    <Section title={t("geom.geometry")}>
      <Readout label={t("geom.radius")} value={arc ? formatNumber(arc.radius) : t("geom.unavailable")} />
    </Section>
  );
}

function EllipticalArcGeometryPanel({
  object,
  objects,
  updateSelected,
}: {
  readonly object: Extract<GeometryObject, { readonly type: "elliptical-arc" }>;
  readonly objects: Record<string, GeometryObject>;
  readonly updateSelected: GeometryPanelProps["updateSelected"];
}) {
  const { t } = useTranslation();
  const ellipticalArc = getEllipticalArcGeometry(object, objects);
  return (
    <Section title={t("geom.geometry")}>
      <Readout label={t("geom.xRadius")} value={ellipticalArc ? formatNumber(ellipticalArc.rx) : t("geom.unavailable")} />
      <Field label={t("geom.yRadius")}>
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

function RegionGeometryPanel({
  object,
  objects,
}: {
  readonly object: Extract<GeometryObject, { readonly type: "region" }>;
  readonly objects: Record<string, GeometryObject>;
}) {
  const { t } = useTranslation();
  const area = getRegionArea(object, objects);
  return (
    <Section title={t("geom.geometry")}>
      <Readout label={t("geom.area")} value={area === null ? t("geom.unavailable") : formatNumber(area)} />
    </Section>
  );
}

function ImageGeometry({
  object,
  updateSelected,
}: Pick<GeometryPanelProps, "updateSelected"> & {
  readonly object: Extract<GeometryObject, { readonly type: "image" }>;
}) {
  const { t } = useTranslation();
  return (
    <Section title={t("geom.geometry")}>
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
        <Field label={t("geom.width")}>
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
        <Field label={t("geom.height")}>
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
      <Field label={t("geom.opacity")}>
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
      <Readout label={t("geom.sourceType")} value={object.mimeType} />
    </Section>
  );
}

function SliderGeometry({
  object,
  updateSelected,
}: Pick<GeometryPanelProps, "updateSelected"> & {
  readonly object: Extract<GeometryObject, { readonly type: "slider" }>;
}) {
  const { t } = useTranslation();
  return (
    <Section title={t("geom.sliderSettings")}>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label={t("geom.min")}>
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "slider"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      min: parseNumber(event.target.value, current.min),
                    }
                  : current,
              )
            }
            step={0.1}
            type="number"
            value={object.min}
          />
        </Field>
        <Field label={t("geom.max")}>
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "slider"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      max: parseNumber(event.target.value, current.max),
                    }
                  : current,
              )
            }
            step={0.1}
            type="number"
            value={object.max}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label={t("geom.step")}>
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "slider"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      step: parseNumber(event.target.value, current.step),
                    }
                  : current,
              )
            }
            step={0.01}
            type="number"
            value={object.step}
          />
        </Field>
        <Field label={t("geom.value")}>
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "slider"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      value: parseNumber(event.target.value, current.value),
                    }
                  : current,
              )
            }
            step={0.1}
            type="number"
            value={object.value}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label={t("geom.autoPlay")}>
          <button
            onClick={() =>
              updateSelected((current) =>
                current.type === "slider"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      isAnimating: !current.isAnimating,
                    }
                  : current,
              )
            }
            className={`w-full py-1 rounded text-sm font-medium transition-colors ${
              object.isAnimating 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {object.isAnimating ? t("geom.pause") : t("geom.play")}
          </button>
        </Field>
        <Field label={t("geom.speed")}>
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "slider"
                  ? {
                      ...current,
                      updatedAt: Date.now(),
                      animationSpeed: parseNumber(event.target.value, current.animationSpeed ?? 1),
                    }
                  : current,
              )
            }
            step={0.1}
            type="number"
            value={object.animationSpeed ?? 1}
          />
        </Field>
      </div>
      <Field label={t("geom.variableName")}>
        <TextInput
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "slider"
                ? {
                    ...current,
                    updatedAt: Date.now(),
                    variableName: event.target.value,
                  }
                : current,
            )
          }
          type="text"
          value={object.variableName}
        />
      </Field>
    </Section>
  );
}

function PointGeometry({
  object,
  objects,
  updateSelected,
}: Pick<GeometryPanelProps, "objects" | "updateSelected"> & {
  readonly object: Extract<GeometryObject, { readonly type: "point" }>;
}) {
  const { t } = useTranslation();
  const sliders = Object.values(objects).filter((obj) => obj.type === "slider");
  const isPointOnObject = object.construction?.type === "point-on-object";
  const boundSliderId = isPointOnObject ? (object.construction as any).bindSliderId : undefined;
  return (
    <Section title={t("geom.geometry")}>
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
      {object.construction?.type === "midpoint" && (
        <ToggleRow
          checked={object.showEqualityTicks ?? false}
          label={t("geom.showEqualityTicks")}
          onChange={(checked) =>
            updateSelected((current) =>
              current.type === "point"
                ? { ...current, showEqualityTicks: checked }
                : current
            )
          }
        />
      )}
      {isPointOnObject && sliders.length > 0 && (
        <Field label={t("geom.bindSlider")}>
          <SelectInput
            value={boundSliderId || ""}
            onChange={(event) =>
              updateSelected((current) => {
                if (current.type === "point" && current.construction?.type === "point-on-object") {
                  const newConstruction: any = { ...current.construction };
                  const oldSliderId = current.construction.bindSliderId;
                  const newSliderId = event.target.value;
                  
                  let newDependencies = [...current.dependencies];
                  
                  if (oldSliderId) {
                    newDependencies = newDependencies.filter(id => id !== oldSliderId);
                  }
                  
                  if (newSliderId) {
                    newConstruction.bindSliderId = newSliderId;
                    if (!newDependencies.includes(newSliderId)) {
                      newDependencies.push(newSliderId);
                    }
                  } else {
                    delete newConstruction.bindSliderId;
                  }
                  
                  return {
                    ...current,
                    dependencies: newDependencies,
                    construction: newConstruction,
                    updatedAt: Date.now(),
                  };
                }
                return current;
              })
            }
          >
            <option value="">{t("geom.noneOption")}</option>
            {sliders.map((s) => (
              <option key={s.id} value={s.id}>
                {(s as any).variableName || s.id}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}
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
  const { t } = useTranslation();
  const radius = getCircleRadius(object, objects);

  return (
    <Section title={t("geom.geometry")}>
      <Field label={t("geom.radius")}>
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
  const { t } = useTranslation();
  const pointA = getPoint(objects, object.pointAId);
  const vertex = getPoint(objects, object.vertexPointId);
  const pointC = getPoint(objects, object.pointCId);
  const angleValue =
    pointA && vertex && pointC
      ? `${formatNumber(angleDegrees(pointA, vertex, pointC))} deg`
      : t("geom.unavailable");

  return (
    <Section title={t("geom.geometry")}>
      <Readout label={t("geom.pointA")} value={object.pointAId} />
      <Readout label={t("geom.vertex")} value={object.vertexPointId} />
      <Readout label={t("geom.pointC")} value={object.pointCId} />
      <Readout
        label={t("geom.rightAngle")}
        value={pointA && vertex && pointC && isRightAngle(pointA, vertex, pointC) ? t("geom.yes") : t("geom.no")}
      />
      <Readout label={t("geom.currentAngle")} value={angleValue} />
      <Field label={t("geom.radius")}>
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
        label={t("geom.showAngleMeasure")}
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
      <Field label={t("geom.label")}>
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
