import type { GeometryObject, GeometryStyle, LabelPosition } from "../../core/geometry";
import {
  Field,
  labelPositions,
  parseNumber,
  Section,
  SelectInput,
  TextInput,
  ToggleRow,
} from "./PropertyInspectorFields";

type LabelPanelProps = {
  readonly object: GeometryObject;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
  readonly updateStyle: (patch: Partial<GeometryStyle>) => void;
};

export function LabelPanel({ object, updateSelected, updateStyle }: LabelPanelProps) {
  return (
    <Section title="Label">
      <ToggleRow
        checked={object.style.labelVisible}
        label="Show Label"
        onChange={(labelVisible) => updateStyle({ labelVisible })}
      />
      <Field label="Label Text">
        <TextInput
          onChange={(event) =>
            updateSelected((current) => ({
              ...current,
              ...(current.type === "angle" ? { label: event.target.value } : {}),
              name: event.target.value,
              updatedAt: Date.now(),
            }))
          }
          value={
            object.type === "angle"
              ? object.label ?? object.name ?? ""
              : object.name ?? ""
          }
        />
      </Field>
      <Field label="Label Position">
        <SelectInput
          onChange={(event) =>
            updateStyle({ labelPosition: event.target.value as LabelPosition })
          }
          value={object.style.labelPosition}
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
                parseNumber(event.target.value, object.style.labelSize ?? 12),
              ),
            })
          }
          step={1}
          type="number"
          value={object.style.labelSize ?? 12}
        />
      </Field>
    </Section>
  );
}

