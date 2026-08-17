import type { GeometryObject, GeometryStyle, LabelPosition } from "../../core/geometry";
import { useTranslation } from "../../lib/useTranslation";
import {
  Field,
  labelPositions,
  parseNumber,
  Section,
  SelectInput,
  TextInput,
  ToggleRow,
  ExpandableDetails,
} from "./PropertyInspectorFields";

type LabelPanelProps = {
  readonly object: GeometryObject;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
  readonly updateStyle: (patch: Partial<GeometryStyle>) => void;
};

export function LabelPanel({ object, updateSelected, updateStyle }: LabelPanelProps) {
  const { t } = useTranslation();

  return (
    <Section title={t("panel.label")}>
      <ToggleRow
        checked={object.style.labelVisible}
        label={t("prop.showLabel")}
        onChange={(labelVisible) => updateStyle({ labelVisible })}
      />
      <Field label={t("prop.labelPosition")}>
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
    </Section>
  );
}

