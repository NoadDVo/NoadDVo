import {
  getVectorArrowSize,
  getVectorArrowStyle,
  type GeometryObject,
  type VectorArrowStyle,
} from "../../core/geometry";
import {
  Field,
  parseNumber,
  SelectInput,
  TextInput,
} from "./PropertyInspectorFields";

const arrowStyleOptions = ["latex", "stealth", "triangle", "none"] as const;

type VectorArrowControlsProps = {
  readonly object: Extract<GeometryObject, { readonly type: "vector" }>;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
};

export function VectorArrowControls({
  object,
  updateSelected,
}: VectorArrowControlsProps) {
  const arrowStyle = getVectorArrowStyle(object);
  const arrowSize = getVectorArrowSize(object);

  return (
    <>
      <Field label="Arrow Style">
        <SelectInput
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "vector"
                ? {
                    ...current,
                    metadata: {
                      ...current.metadata,
                      arrowStyle: event.target.value as VectorArrowStyle,
                    },
                    updatedAt: Date.now(),
                  }
                : current,
            )
          }
          value={arrowStyle}
        >
          {arrowStyleOptions.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Arrow Size">
        <TextInput
          min={1}
          onChange={(event) =>
            updateSelected((current) =>
              current.type === "vector"
                ? {
                    ...current,
                    metadata: {
                      ...current.metadata,
                      arrowSize: Math.max(1, parseNumber(event.target.value, arrowSize)),
                    },
                    updatedAt: Date.now(),
                  }
                : current,
            )
          }
          step={1}
          type="number"
          value={arrowSize}
        />
      </Field>
    </>
  );
}
