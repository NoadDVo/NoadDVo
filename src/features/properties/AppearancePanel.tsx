import type { DashStyle, GeometryObject, GeometryStyle } from "../../core/geometry";
import {
  clamp,
  dashOptions,
  Field,
  parseNumber,
  Section,
  SelectInput,
  TextInput,
} from "./PropertyInspectorFields";
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
  return (
    <Section title="Appearance">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Stroke">
          <TextInput
            onChange={(event) => updateStyle({ stroke: event.target.value })}
            type="color"
            value={object.style.stroke}
          />
        </Field>
        <Field label="Fill">
          <TextInput
            onChange={(event) => updateStyle({ fill: event.target.value })}
            type="color"
            value={object.style.fill === "transparent" ? "#000000" : object.style.fill}
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
        <Field label="Stroke Opacity">
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
        <Field label="Fill Opacity">
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
      <Field label="Dash Style">
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
        <Field label="Point Size">
          <TextInput
            min={1}
            onChange={(event) =>
              updateStyle({
                pointSize: Math.max(
                  1,
                  parseNumber(event.target.value, object.style.pointSize),
                ),
              })
            }
            step={0.5}
            type="number"
            value={object.style.pointSize}
          />
        </Field>
      )}
      {object.type === "vector" && (
        <VectorArrowControls object={object} updateSelected={updateSelected} />
      )}
      {object.type === "text" && (
        <TextAppearanceControls object={object} updateSelected={updateSelected} />
      )}
    </Section>
  );
}
