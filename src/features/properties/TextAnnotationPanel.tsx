import {
  normalizeTextMode,
  textModes,
  type GeometryObject,
  type TextMode,
} from "../../core/geometry";
import {
  Field,
  parseNumber,
  Section,
  SelectInput,
  TextInput,
} from "./PropertyInspectorFields";

type TextAnnotationPanelProps = {
  readonly object: Extract<GeometryObject, { readonly type: "text" }>;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
};

export function TextAnnotationPanel({
  object,
  updateSelected,
}: TextAnnotationPanelProps) {
  return (
    <Section title="Text">
      <Field label="Content">
        <TextInput
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "text"
                ? {
                    ...current,
                    content: event.target.value,
                    updatedAt: Date.now(),
                  }
                : current,
            )
          }
          value={object.content}
        />
      </Field>
      <Field label="Text Mode">
        <SelectInput
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "text"
                ? {
                    ...current,
                    textMode: normalizeTextMode(event.target.value) as TextMode,
                    updatedAt: Date.now(),
                  }
                : current,
            )
          }
          value={object.textMode}
        >
          {textModes.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </SelectInput>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="X">
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "text"
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
                current.type === "text"
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
