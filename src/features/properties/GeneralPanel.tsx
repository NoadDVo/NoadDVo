import type { GeometryObject } from "../../core/geometry";
import {
  Field,
  Readout,
  Section,
  TextInput,
  ToggleRow,
} from "./PropertyInspectorFields";

type GeneralPanelProps = {
  readonly object: GeometryObject;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
};

export function GeneralPanel({ object, updateSelected }: GeneralPanelProps) {
  return (
    <Section title="General">
      <div className="grid grid-cols-2 gap-2">
        <Readout label="Type" value={object.type} />
        <Readout label="ID" value={object.id} />
      </div>
      <Field label="Name">
        <TextInput
          onChange={(event) =>
            updateSelected((current) => ({
              ...current,
              name: event.target.value,
              updatedAt: Date.now(),
            }))
          }
          value={object.name ?? ""}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <ToggleRow
          checked={object.visible}
          label="Visible"
          onChange={(visible) =>
            updateSelected((current) => ({
              ...current,
              updatedAt: Date.now(),
              visible,
            }))
          }
        />
        <ToggleRow
          checked={object.locked}
          label="Locked"
          onChange={(locked) =>
            updateSelected((current) => ({
              ...current,
              locked,
              updatedAt: Date.now(),
            }))
          }
        />
      </div>
    </Section>
  );
}

