import type { GeometryObject } from "../../core/geometry";
import { useTranslation } from "../../lib/useTranslation";
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
  const { t } = useTranslation();

  return (
    <Section title={t("panel.general")}>
      <Field label={t("prop.name")}>
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
          label={t("prop.visible")}
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
          label={t("prop.locked")}
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

