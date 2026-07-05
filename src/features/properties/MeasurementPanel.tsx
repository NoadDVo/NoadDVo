import {
  formatMeasurementValue,
  type GeometryObject,
  type LabelPosition,
} from "../../core/geometry";
import {
  Field,
  labelPositions,
  parseNumber,
  Readout,
  Section,
  SelectInput,
  TextInput,
} from "./PropertyInspectorFields";

type MeasurementPanelProps = {
  readonly object: Extract<GeometryObject, { readonly type: "measurement" }>;
  readonly objects: Record<string, GeometryObject>;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
};

export function MeasurementPanel({
  object,
  objects,
  updateSelected,
}: MeasurementPanelProps) {
  return (
    <Section title="Measurement">
      <Readout label="Type" value={object.measurementType} />
      <Readout label="Target" value={object.targetObjectId} />
      <Readout label="Value" value={formatMeasurementValue(object, objects)} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Precision">
          <TextInput
            min={0}
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "measurement"
                  ? {
                      ...current,
                      precision: Math.max(0, Math.round(parseNumber(event.target.value, current.precision ?? 2))),
                      updatedAt: Date.now(),
                    }
                  : current,
              )
            }
            step={1}
            type="number"
            value={object.precision ?? 2}
          />
        </Field>
        <Field label="Font Size">
          <TextInput
            min={6}
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "measurement"
                  ? {
                      ...current,
                      style: {
                        ...current.style,
                        labelSize: Math.max(6, parseNumber(event.target.value, current.style.labelSize)),
                      },
                      updatedAt: Date.now(),
                    }
                  : current,
              )
            }
            step={1}
            type="number"
            value={object.style.labelSize}
          />
        </Field>
      </div>
      <Field label="Position">
        <SelectInput
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "measurement"
                ? {
                    ...current,
                    labelPosition: event.target.value as LabelPosition,
                    style: {
                      ...current.style,
                      labelPosition: event.target.value as LabelPosition,
                    },
                    updatedAt: Date.now(),
                  }
                : current,
            )
          }
          value={object.labelPosition}
        >
          {labelPositions.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </SelectInput>
      </Field>
    </Section>
  );
}
