import type { GeometryObject, GeometryStyle } from "../../core/geometry";
import { useTranslation } from "../../lib/useTranslation";
import {
  clamp,
  Field,
  parseNumber,
  TextInput,
  ExpandableDetails,
  Readout,
} from "./PropertyInspectorFields";

type AdvancedPanelProps = {
  readonly object: GeometryObject;
  readonly updateSelected: (updater: (object: GeometryObject) => GeometryObject) => void;
  readonly updateStyle: (patch: Partial<GeometryStyle>) => void;
};

export function AdvancedPanel({ object, updateSelected, updateStyle }: AdvancedPanelProps) {
  const { t } = useTranslation();

  return (
    <ExpandableDetails summary={t("panel.advanced")}>
      {/* Dependency Readouts based on object type */}
      {object.type === "line" && (
        <>
          <Readout label={t("geom.pointA")} value={object.pointAId} />
          <Readout label={t("geom.pointB")} value={object.pointBId} />
        </>
      )}
      {object.type === "ray" && (
        <>
          <Readout label={t("geom.start")} value={object.startPointId} />
          <Readout label={t("geom.through")} value={object.throughPointId} />
        </>
      )}
      {object.type === "vector" && (
        <>
          <Readout label={t("geom.start")} value={object.startPointId} />
          <Readout label={t("geom.end")} value={object.endPointId} />
        </>
      )}
      {object.type === "segment" && (
        <>
          <Readout label={t("geom.start")} value={object.startPointId} />
          <Readout label={t("geom.end")} value={object.endPointId} />
        </>
      )}
      {object.type === "arc" && (
        <>
          <Readout label={t("geom.center")} value={object.centerPointId} />
          <Readout label={t("geom.start")} value={object.startPointId} />
          <Readout label={t("geom.end")} value={object.endPointId} />
          <Readout label={t("geom.direction")} value={object.direction} />
        </>
      )}
      {object.type === "elliptical-arc" && (
        <>
          <Readout label={t("geom.center")} value={object.centerPointId} />
          <Readout label={t("geom.start")} value={object.startPointId} />
          <Readout label={t("geom.end")} value={object.endPointId} />
          <Readout label={t("geom.direction")} value={object.direction} />
        </>
      )}
      {object.type === "region" && (
        <>
          <Readout label={t("geom.boundaryPoints")} value={String(object.boundaryPointIds.length)} />
        </>
      )}

      <Field label={t("prop.labelText")}>
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
      <Field label={t("prop.labelSize")}>
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
      <Field label={t("prop.strokeWidth")}>
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
        <Field label={t("prop.strokeOpacity")}>
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
        <Field label={t("prop.fillOpacity")}>
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
    </ExpandableDetails>
  );
}
