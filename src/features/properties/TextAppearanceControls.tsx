import {
  getTextAlignment,
  getTextFontSize,
  getTextOpacity,
  getTextRotation,
  textAlignments,
  type GeometryObject,
  type TextAlignment,
} from "../../core/geometry";
import {
  clamp,
  Field,
  parseNumber,
  SelectInput,
  TextInput,
} from "./PropertyInspectorFields";

type TextAppearanceControlsProps = {
  readonly object: Extract<GeometryObject, { readonly type: "text" }>;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
};

export function TextAppearanceControls({
  object,
  updateSelected,
}: TextAppearanceControlsProps) {
  const fontSize = getTextFontSize(object);
  const opacity = getTextOpacity(object);
  const rotation = getTextRotation(object);
  const alignment = getTextAlignment(object);

  return (
    <>
      <Field label="Font Size">
        <TextInput
          min={6}
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "text"
                ? {
                    ...current,
                    metadata: {
                      ...current.metadata,
                      fontSize: Math.max(6, parseNumber(event.target.value, fontSize)),
                    },
                    style: {
                      ...current.style,
                      labelSize: Math.max(6, parseNumber(event.target.value, fontSize)),
                    },
                    updatedAt: Date.now(),
                  }
                : current,
            )
          }
          step={1}
          type="number"
          value={fontSize}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Text Opacity">
          <TextInput
            max={1}
            min={0}
            onChange={(event) => {
              const nextOpacity = clamp(parseNumber(event.target.value, opacity), 0, 1);

              updateSelected((current) =>
                current.type === "text"
                  ? {
                      ...current,
                      metadata: {
                        ...current.metadata,
                        opacity: nextOpacity,
                      },
                      style: {
                        ...current.style,
                        strokeOpacity: nextOpacity,
                      },
                      updatedAt: Date.now(),
                    }
                  : current,
              );
            }}
            step={0.05}
            type="number"
            value={opacity}
          />
        </Field>
        <Field label="Rotation">
          <TextInput
            onChange={(event) =>
              updateSelected((current) =>
                current.type === "text"
                  ? {
                      ...current,
                      metadata: {
                        ...current.metadata,
                        rotation: parseNumber(event.target.value, rotation),
                      },
                      updatedAt: Date.now(),
                    }
                  : current,
              )
            }
            step={1}
            type="number"
            value={rotation}
          />
        </Field>
      </div>
      <Field label="Alignment">
        <SelectInput
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "text"
                ? {
                    ...current,
                    metadata: {
                      ...current.metadata,
                      alignment: event.target.value as TextAlignment,
                    },
                    updatedAt: Date.now(),
                  }
                : current,
            )
          }
          value={alignment}
        >
          {textAlignments.map((align) => (
            <option key={align} value={align}>
              {align}
            </option>
          ))}
        </SelectInput>
      </Field>
    </>
  );
}
