import {
  normalizeTextMode,
  getTextAttachment,
  getTextPlacementOptionsForTarget,
  textModes,
  type GeometryObject,
  type Point2D,
  type TextAttachmentPlacement,
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
  readonly objects: Record<string, GeometryObject>;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
};

export function TextAnnotationPanel({
  object,
  objects,
  updateSelected,
}: TextAnnotationPanelProps) {
  const attachment = getTextAttachment(object);
  const target = attachment ? objects[attachment.targetObjectId] ?? null : null;
  const placementOptions = getTextPlacementOptionsForTarget(target);
  const offset = attachment?.offset ?? { x: 0, y: 0 };

  const updateAttachment = ({
    nextOffset = offset,
    nextPlacement = attachment?.placement ?? placementOptions[0] ?? "above",
    nextTargetId = attachment?.targetObjectId ?? "",
  }: {
    readonly nextOffset?: Point2D;
    readonly nextPlacement?: TextAttachmentPlacement;
    readonly nextTargetId?: string;
  }) => {
    updateSelected((current) => {
      if (current.type !== "text") {
        return current;
      }

      const nextTarget = objects[nextTargetId];

      if (!nextTarget || getTextPlacementOptionsForTarget(nextTarget).length === 0) {
        const { offset: _offset, placement: _placement, targetObjectId: _targetObjectId, ...metadata } =
          current.metadata ?? {};

        return {
          ...current,
          dependencies: [],
          metadata,
          updatedAt: Date.now(),
        };
      }

      return {
        ...current,
        dependencies: [nextTarget.id],
        metadata: {
          ...current.metadata,
          offset: nextOffset,
          placement: nextPlacement,
          targetObjectId: nextTarget.id,
        },
        updatedAt: Date.now(),
      };
    });
  };

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
      <Field label="Target Object">
        <SelectInput
          onChange={(event) => {
            const nextTarget = objects[event.target.value];
            const placement =
              getTextPlacementOptionsForTarget(nextTarget)[0] ??
              attachment?.placement ??
              "above";

            updateAttachment({
              nextPlacement: placement,
              nextTargetId: event.target.value,
            });
          }}
          value={attachment?.targetObjectId ?? ""}
        >
          <option value="">Free text</option>
          {Object.values(objects)
            .filter((candidate) => candidate.id !== object.id)
            .filter((candidate) => getTextPlacementOptionsForTarget(candidate).length > 0)
            .map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name ?? candidate.id}
              </option>
            ))}
        </SelectInput>
      </Field>
      {target && (
        <>
          <Field label="Placement">
            <SelectInput
              onChange={(event) =>
                updateAttachment({
                  nextPlacement: event.target.value as TextAttachmentPlacement,
                })
              }
              value={attachment?.placement ?? placementOptions[0]}
            >
              {placementOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Offset X">
              <TextInput
                onChange={(event) =>
                  updateAttachment({
                    nextOffset: {
                      ...offset,
                      x: parseNumber(event.target.value, offset.x),
                    },
                  })
                }
                step={0.1}
                type="number"
                value={offset.x}
              />
            </Field>
            <Field label="Offset Y">
              <TextInput
                onChange={(event) =>
                  updateAttachment({
                    nextOffset: {
                      ...offset,
                      y: parseNumber(event.target.value, offset.y),
                    },
                  })
                }
                step={0.1}
                type="number"
                value={offset.y}
              />
            </Field>
          </div>
        </>
      )}
    </Section>
  );
}
