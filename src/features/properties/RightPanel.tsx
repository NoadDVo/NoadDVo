import { Lock, SlidersHorizontal } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import {
  EPSILON,
  angleDegrees,
  distance,
  isRightAngle,
  polygonArea,
  type CircleObject,
  type DashStyle,
  type GeometryObject,
  type GeometryStyle,
  type LabelPosition,
} from "../../core/geometry";
import { Divider, IconButton, Panel } from "../../ui/primitives";

const dashOptions = ["solid", "dashed", "dotted"] satisfies readonly DashStyle[];
const labelPositions = [
  "above",
  "below",
  "left",
  "right",
  "above-left",
  "above-right",
  "below-left",
  "below-right",
] satisfies readonly LabelPosition[];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(4));

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function getPoint(objects: Record<string, GeometryObject>, pointId: string) {
  const object = objects[pointId];

  return object?.type === "point" ? object : null;
}

function getCircleRadius(
  object: CircleObject,
  objects: Record<string, GeometryObject>,
): number | null {
  if (object.circleKind === "center-radius") {
    return object.radius;
  }

  if (object.circleKind === "center-point") {
    const center = getPoint(objects, object.centerPointId);
    const radiusPoint = getPoint(objects, object.radiusPointId);

    return center && radiusPoint ? distance(center, radiusPoint) : null;
  }

  return null;
}

type FieldProps = {
  readonly label: string;
  readonly children: React.ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <label className="grid gap-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-arctic-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-8 w-full rounded-[9px] border border-white/10 bg-white/[0.045] px-2.5 font-mono text-[11px] text-arctic-text outline-none transition focus:border-arctic-ice/45 disabled:opacity-45"
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-8 w-full rounded-[9px] border border-white/10 bg-[#101b24] px-2.5 text-[11px] font-semibold text-arctic-text outline-none transition focus:border-arctic-ice/45 disabled:opacity-45"
    />
  );
}

function ToggleRow({
  checked,
  disabled,
  label,
  onChange,
}: {
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-8 items-center justify-between rounded-[10px] border border-white/8 bg-white/[0.035] px-2.5">
      <span className="text-[11px] font-semibold text-arctic-muted">{label}</span>
      <input
        checked={checked}
        className="size-4 accent-arctic-ice"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function Readout({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-[10px] border border-white/8 bg-white/[0.035] px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-arctic-muted">
        {label}
      </p>
      <p className="mt-0.5 break-all font-mono text-[11px] text-arctic-text">{value}</p>
    </div>
  );
}

function Section({
  children,
  title,
}: {
  readonly children: React.ReactNode;
  readonly title: string;
}) {
  return (
    <section>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-arctic-text">
        {title}
      </h3>
      <div className="mt-3 space-y-2.5">{children}</div>
    </section>
  );
}

export function RightPanel() {
  const objects = useGeometryStore((state) => state.objects);
  const selectedObjectIds = useGeometryStore((state) => state.selectedObjectIds);
  const updateObject = useGeometryStore((state) => state.updateObject);
  const selectedObject = selectedObjectIds[0] ? objects[selectedObjectIds[0]] : null;
  const multipleSelected = selectedObjectIds.length > 1;

  const updateSelected = (updater: (object: GeometryObject) => GeometryObject) => {
    if (!selectedObject) {
      return;
    }

    updateObject(selectedObject.id, updater);
  };

  const updateStyle = (patch: Partial<GeometryStyle>) => {
    updateSelected((object) => ({
      ...object,
      style: {
        ...object.style,
        ...patch,
      },
      updatedAt: Date.now(),
    }));
  };

  return (
    <Panel
      actions={
        <>
          <IconButton label="Inspector Options" size="sm">
            <SlidersHorizontal size={16} strokeWidth={2} />
          </IconButton>
          <IconButton label="Lock Panel" size="sm">
            <Lock size={16} strokeWidth={2} />
          </IconButton>
        </>
      }
      className="min-h-0 overflow-hidden max-lg:hidden"
      eyebrow="Inspector"
      title="Properties"
    >
      <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 py-3">
        {!selectedObject ? (
          <div className="rounded-[14px] border border-white/8 bg-white/[0.035] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-arctic-muted">
              Selection
            </p>
            <p className="mt-2 text-sm font-semibold text-arctic-text">
              Select an object to edit its properties.
            </p>
          </div>
        ) : (
          <>
            {multipleSelected && (
              <div className="mb-3 rounded-[12px] border border-arctic-ice/20 bg-arctic-ice/10 px-3 py-2 text-[11px] font-semibold text-arctic-text">
                Editing first of {selectedObjectIds.length} selected objects.
              </div>
            )}

            <Section title="General">
              <div className="grid grid-cols-2 gap-2">
                <Readout label="Type" value={selectedObject.type} />
                <Readout label="ID" value={selectedObject.id} />
              </div>
              <Field label="Name">
                <TextInput
                  onChange={(event) =>
                    updateSelected((object) => ({
                      ...object,
                      name: event.target.value,
                      updatedAt: Date.now(),
                    }))
                  }
                  value={selectedObject.name ?? ""}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <ToggleRow
                  checked={selectedObject.visible}
                  label="Visible"
                  onChange={(visible) =>
                    updateSelected((object) => ({
                      ...object,
                      updatedAt: Date.now(),
                      visible,
                    }))
                  }
                />
                <ToggleRow
                  checked={selectedObject.locked}
                  label="Locked"
                  onChange={(locked) =>
                    updateSelected((object) => ({
                      ...object,
                      locked,
                      updatedAt: Date.now(),
                    }))
                  }
                />
              </div>
            </Section>

            <Divider className="my-4" />

            <GeometrySection
              object={selectedObject}
              objects={objects}
              updateSelected={updateSelected}
            />

            <Divider className="my-4" />

            <Section title="Appearance">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Stroke">
                  <TextInput
                    onChange={(event) => updateStyle({ stroke: event.target.value })}
                    type="color"
                    value={selectedObject.style.stroke}
                  />
                </Field>
                <Field label="Fill">
                  <TextInput
                    onChange={(event) => updateStyle({ fill: event.target.value })}
                    type="color"
                    value={
                      selectedObject.style.fill === "transparent"
                        ? "#000000"
                        : selectedObject.style.fill
                    }
                  />
                </Field>
              </div>
              <Field label="Stroke Width">
                <TextInput
                  min={1}
                  onChange={(event) =>
                    updateStyle({
                      strokeWidth: Math.max(
                        1,
                        parseNumber(event.target.value, selectedObject.style.strokeWidth),
                      ),
                    })
                  }
                  step={0.25}
                  type="number"
                  value={selectedObject.style.strokeWidth}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Stroke Opacity">
                  <TextInput
                    max={1}
                    min={0}
                    onChange={(event) =>
                      updateStyle({
                        strokeOpacity: clamp(
                          parseNumber(event.target.value, selectedObject.style.strokeOpacity),
                          0,
                          1,
                        ),
                      })
                    }
                    step={0.05}
                    type="number"
                    value={selectedObject.style.strokeOpacity}
                  />
                </Field>
                <Field label="Fill Opacity">
                  <TextInput
                    max={1}
                    min={0}
                    onChange={(event) =>
                      updateStyle({
                        fillOpacity: clamp(
                          parseNumber(event.target.value, selectedObject.style.fillOpacity),
                          0,
                          1,
                        ),
                      })
                    }
                    step={0.05}
                    type="number"
                    value={selectedObject.style.fillOpacity}
                  />
                </Field>
              </div>
              <Field label="Dash Style">
                <SelectInput
                  onChange={(event) => updateStyle({ dash: event.target.value as DashStyle })}
                  value={selectedObject.style.dash}
                >
                  {dashOptions.map((dash) => (
                    <option key={dash} value={dash}>
                      {dash}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              {selectedObject.type === "point" && (
                <Field label="Point Size">
                  <TextInput
                    min={1}
                    onChange={(event) =>
                      updateStyle({
                        pointSize: Math.max(
                          1,
                          parseNumber(event.target.value, selectedObject.style.pointSize),
                        ),
                      })
                    }
                    step={0.5}
                    type="number"
                    value={selectedObject.style.pointSize}
                  />
                </Field>
              )}
            </Section>

            <Divider className="my-4" />

            <Section title="Label">
              <ToggleRow
                checked={selectedObject.style.labelVisible}
                label="Show Label"
                onChange={(labelVisible) => updateStyle({ labelVisible })}
              />
              <Field label="Label Text">
                <TextInput
                  onChange={(event) =>
                    updateSelected((object) => ({
                      ...object,
                      ...(object.type === "angle" ? { label: event.target.value } : {}),
                      name: event.target.value,
                      updatedAt: Date.now(),
                    }))
                  }
                  value={
                    selectedObject.type === "angle"
                      ? selectedObject.label ?? selectedObject.name ?? ""
                      : selectedObject.name ?? ""
                  }
                />
              </Field>
              <Field label="Label Position">
                <SelectInput
                  onChange={(event) =>
                    updateStyle({ labelPosition: event.target.value as LabelPosition })
                  }
                  value={selectedObject.style.labelPosition}
                >
                  {labelPositions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Label Size">
                <TextInput
                  min={8}
                  onChange={(event) =>
                    updateStyle({
                      labelSize: Math.max(
                        8,
                        parseNumber(event.target.value, selectedObject.style.labelSize ?? 12),
                      ),
                    })
                  }
                  step={1}
                  type="number"
                  value={selectedObject.style.labelSize ?? 12}
                />
              </Field>
            </Section>

            <Divider className="my-4" />

            <AdvancedSection
              object={selectedObject}
            />
          </>
        )}
      </div>
    </Panel>
  );
}

function GeometrySection({
  object,
  objects,
  updateSelected,
}: {
  readonly object: GeometryObject;
  readonly objects: Record<string, GeometryObject>;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
}) {
  if (object.type === "point") {
    return (
      <Section title="Geometry">
        <div className="grid grid-cols-2 gap-2">
          <Field label="X">
            <TextInput
              onChange={(event) =>
                updateSelected((current) => {
                  if (current.type !== "point") {
                    return current;
                  }

                  return {
                    ...current,
                    updatedAt: Date.now(),
                    x: parseNumber(event.target.value, current.x),
                  };
                })
              }
              type="number"
              value={object.x}
            />
          </Field>
          <Field label="Y">
            <TextInput
              onChange={(event) =>
                updateSelected((current) => {
                  if (current.type !== "point") {
                    return current;
                  }

                  return {
                    ...current,
                    updatedAt: Date.now(),
                    y: parseNumber(event.target.value, current.y),
                  };
                })
              }
              type="number"
              value={object.y}
            />
          </Field>
        </div>
      </Section>
    );
  }

  if (object.type === "circle") {
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

  if (object.type === "segment") {
    return (
      <Section title="Geometry">
        <Readout label="Start" value={object.startPointId} />
        <Readout label="End" value={object.endPointId} />
      </Section>
    );
  }

  if (object.type === "angle") {
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
              updateSelected((current) => {
                if (current.type !== "angle") {
                  return current;
                }

                return {
                  ...current,
                  radius: Math.max(EPSILON, parseNumber(event.target.value, current.radius)),
                  updatedAt: Date.now(),
                };
              })
            }
            step={0.05}
            type="number"
            value={object.radius}
          />
        </Field>
        <Field label="Label">
          <TextInput
            onChange={(event) =>
              updateSelected((current) => {
                if (current.type !== "angle") {
                  return current;
                }

                return {
                  ...current,
                  label: event.target.value,
                  name: event.target.value,
                  updatedAt: Date.now(),
                };
              })
            }
            value={object.label ?? object.name ?? ""}
          />
        </Field>
      </Section>
    );
  }

  return (
    <Section title="Geometry">
      <Readout label="Details" value="No editable geometry fields" />
    </Section>
  );
}

function AdvancedSection({ object }: { readonly object: GeometryObject }) {
  return (
    <Section title="Advanced">
      <Readout
        label="Dependencies"
        value={object.dependencies.length > 0 ? object.dependencies.join(", ") : "None"}
      />
      <Readout
        label="Dependents"
        value={object.dependents.length > 0 ? object.dependents.join(", ") : "None"}
      />
      <Readout
        label="Creation Time"
        value={object.createdAt ? new Date(object.createdAt).toLocaleString() : "Session seed"}
      />
      <Readout
        label="Object Metadata"
        value={object.metadata ? JSON.stringify(object.metadata) : "{}"}
      />
    </Section>
  );
}
