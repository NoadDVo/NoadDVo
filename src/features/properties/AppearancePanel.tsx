import type { DashStyle, GeometryObject, GeometryStyle } from "../../core/geometry";
import {
  clamp,
  dashOptions,
  Field,
  parseNumber,
  Section,
  SelectInput,
  TextInput,
  patternOptions,
} from "./PropertyInspectorFields";
import { useTranslation } from "../../lib/useTranslation";
import { TextAppearanceControls } from "./TextAppearanceControls";
import { VectorArrowControls } from "./VectorArrowControls";

type AppearancePanelProps = {
  readonly object: GeometryObject;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
  readonly updateStyle: (patch: Partial<GeometryStyle>) => void;
};

export function AppearancePanel({
  object,
  updateSelected,
  updateStyle,
}: AppearancePanelProps) {
  const { t } = useTranslation();

  return (
    <Section title={t("panel.appearance")}>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("prop.strokeColor")}>
          <TextInput
            onChange={(event) => updateStyle({ stroke: event.target.value })}
            type="color"
            value={object.style.stroke}
          />
        </Field>
        <Field label={t("prop.fillColor")}>
          <TextInput
            onChange={(event) => {
              const updates: any = { fill: event.target.value };
              if (object.style.fillOpacity === 0 && event.target.value !== "transparent" && event.target.value !== "#000000") {
                updates.fillOpacity = 0.2;
              } else if (object.style.fillOpacity === 0 && object.style.fill === "transparent") {
                 updates.fillOpacity = 0.2;
              }
              updateStyle(updates);
            }}
            type="color"
            value={object.style.fill === "transparent" ? "#000000" : object.style.fill}
          />
        </Field>
      </div>
      <Field label={t("prop.strokeWidth")}>
        <TextInput
          min={1}
          onChange={(event) =>
            updateStyle({
              strokeWidth: Math.max(
                1,
                parseNumber(event.target.value, object.style.strokeWidth),
              ),
            })
          }
          step={0.25}
          type="number"
          value={object.style.strokeWidth}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("prop.strokeOpacity")}>
          <TextInput
            max={1}
            min={0}
            onChange={(event) =>
              updateStyle({
                strokeOpacity: clamp(
                  parseNumber(event.target.value, object.style.strokeOpacity),
                  0,
                  1,
                ),
              })
            }
            step={0.05}
            type="number"
            value={object.style.strokeOpacity}
          />
        </Field>
        <Field label={t("prop.fillOpacity")}>
          <TextInput
            max={1}
            min={0}
            onChange={(event) =>
              updateStyle({
                fillOpacity: clamp(
                  parseNumber(event.target.value, object.style.fillOpacity),
                  0,
                  1,
                ),
              })
            }
            step={0.05}
            type="number"
            value={object.style.fillOpacity}
          />
        </Field>
      </div>
      <Field label={t("prop.dashStyle")}>
        <SelectInput
          onChange={(event) => updateStyle({ dash: event.target.value as DashStyle })}
          value={object.style.dash}
        >
          {dashOptions.map((dash) => (
            <option key={dash} value={dash}>
              {dash}
            </option>
          ))}
        </SelectInput>
      </Field>
      {object.type === "point" && (
        <>
          <Field label={t("prop.pointSize")}>
            <TextInput
              min={0}
              onChange={(event) =>
                updateStyle({
                  pointSize: Math.max(
                    0,
                    parseNumber(event.target.value, object.style.pointSize),
                  ),
                })
              }
              step={0.5}
              type="number"
              value={object.style.pointSize}
            />
          </Field>
          <Field label={t("prop.pointStyle") ?? "Point Style"}>
            <SelectInput
              onChange={(event) => updateStyle({ pointStyle: event.target.value as any })}
              value={object.style.pointStyle ?? "filled"}
            >
              {["filled", "hollow", "cross", "plus", "square"].map((style) => (
                <option key={style} value={style}>
                  {t(`prop.pointStyle.${style}` as any) ?? style}
                </option>
              ))}
            </SelectInput>
          </Field>
        </>
      )}
      {object.type === "vector" && (
        <VectorArrowControls object={object} updateSelected={updateSelected} />
      )}
      {object.type === "text" && (
        <TextAppearanceControls object={object} updateSelected={updateSelected} />
      )}
      {(object.type === "circle" || object.type === "polygon" || object.type === "region" || object.type === "area" || object.type === "ellipse") && (
        <>
          <Field label={t("prop.patternType")}>
            <SelectInput
              onChange={(event) => {
                const updates: any = { pattern: { ...(object.style.pattern ?? { type: "none", density: 0.5, size: 10 }), type: event.target.value as any } };
                if (object.style.fillOpacity === 0 && event.target.value !== "none") {
                  updates.fillOpacity = 0.2;
                }
                updateStyle(updates);
              }}
              value={object.style.pattern?.type ?? "none"}
            >
              {patternOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </SelectInput>
          </Field>
          {object.style.pattern?.type && object.style.pattern.type !== "none" && (
            <>
              <Field label={t("prop.patternColor")}>
                <TextInput
                  onChange={(event) =>
                    updateStyle({
                      pattern: {
                        ...(object.style.pattern ?? { type: "none", density: 0.5, size: 10 }),
                        color: event.target.value,
                      }
                    })
                  }
                  type="color"
                  value={object.style.pattern?.color ?? "#000000"}
                />
              </Field>
              {object.style.pattern.type !== "hatch" && object.style.pattern.type !== "crosshatch" && (
                <div className="grid grid-cols-2 gap-2">
                <Field label={t("prop.patternDensity")}>
                  <TextInput
                  max={1}
                  min={0.1}
                  onChange={(event) =>
                    updateStyle({
                      pattern: {
                        ...(object.style.pattern ?? { type: "none", density: 0.5, size: 10 }),
                        density: clamp(parseNumber(event.target.value, object.style.pattern?.density ?? 0.5), 0.1, 1),
                      }
                    })
                  }
                  step={0.1}
                  type="number"
                  value={object.style.pattern?.density ?? 0.5}
                />
              </Field>
              <Field label={t("prop.patternSize")}>
                <TextInput
                  min={1}
                  onChange={(event) =>
                    updateStyle({
                      pattern: {
                        ...(object.style.pattern ?? { type: "none", density: 0.5, size: 10 }),
                        size: Math.max(1, parseNumber(event.target.value, object.style.pattern?.size ?? 10)),
                      }
                    })
                  }
                  step={1}
                  type="number"
                  value={object.style.pattern?.size ?? 10}
                />
              </Field>
                </div>
              )}
            </>
          )}
          {(object.style.pattern?.type === "hatch" || object.style.pattern?.type === "crosshatch") && (
            <div className="grid grid-cols-3 gap-2">
              <Field label={t("prop.angle")}>
                <TextInput
                  max={180}
                  min={0}
                  onChange={(event) =>
                    updateStyle({
                      pattern: {
                        ...(object.style.pattern ?? { type: "hatch", density: 0.5, size: 10 }),
                        angle: clamp(parseNumber(event.target.value, object.style.pattern?.angle ?? 45), 0, 180),
                      }
                    })
                  }
                  step={5}
                  type="number"
                  value={object.style.pattern?.angle ?? 45}
                />
              </Field>
              <Field label={t("prop.spacing")}>
                <TextInput
                  max={2}
                  min={0.1}
                  onChange={(event) =>
                    updateStyle({
                      pattern: {
                        ...(object.style.pattern ?? { type: "hatch", density: 0.5, size: 10 }),
                        spacing: clamp(parseNumber(event.target.value, object.style.pattern?.spacing ?? 0.2), 0.1, 2),
                      }
                    })
                  }
                  step={0.05}
                  type="number"
                  value={object.style.pattern?.spacing ?? 0.2}
                />
              </Field>
              <Field label={t("prop.lineWidth")}>
                <TextInput
                  max={2}
                  min={0.1}
                  onChange={(event) =>
                    updateStyle({
                      pattern: {
                        ...(object.style.pattern ?? { type: "hatch", density: 0.5, size: 10 }),
                        lineWidth: clamp(parseNumber(event.target.value, object.style.pattern?.lineWidth ?? 0.4), 0.1, 2),
                      }
                    })
                  }
                  step={0.1}
                  type="number"
                  value={object.style.pattern?.lineWidth ?? 0.4}
                />
              </Field>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
