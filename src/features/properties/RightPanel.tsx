import { useGeometryStore } from "../../app/store/geometryStore";
import { useUiStore } from "../../app/store/uiStore";
import type { GeometryObject, GeometryStyle } from "../../core/geometry";
import { useTranslation } from "../../lib/useTranslation";
import { Divider, Panel } from "../../ui/primitives";
import { AdvancedPanel } from "./AdvancedPanel";
import { AppearancePanel } from "./AppearancePanel";
import { GeneralPanel } from "./GeneralPanel";
import { GeometryPanel } from "./GeometryPanel";
import { LabelPanel } from "./LabelPanel";

export function RightPanel() {
  const objects = useGeometryStore((state) => state.objects);
  const selectedObjectIds = useGeometryStore((state) => state.selectedObjectIds);
  const updateObject = useGeometryStore((state) => state.updateObject);
  
  const inspectorLocked = useUiStore((state) => state.inspectorLocked);
  const lockedObjectId = useUiStore((state) => state.lockedObjectId);

  const activeObjectId = inspectorLocked ? lockedObjectId : selectedObjectIds[0];
  const selectedObject = activeObjectId ? objects[activeObjectId] : null;
  const multipleSelected = !inspectorLocked && selectedObjectIds.length > 1;

  const updateSelected = (updater: (object: GeometryObject) => GeometryObject) => {
    if (!selectedObject) {
      return;
    }

    updateObject(selectedObject.id, updater);
  };

  const updateStyle = (patch: Partial<GeometryStyle>) => {
    updateSelected((object) => ({
      ...object,
      style: {
        ...object.style,
        ...patch,
      },
      updatedAt: Date.now(),
    }));
  };

  const { t } = useTranslation();

  return (
    <Panel
      className="h-full min-h-0 overflow-hidden max-lg:hidden"
      eyebrow={t("topbar.inspector")}
      title={t("panel.properties")}
    >
      <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 py-3">
        {!selectedObject ? (
          <EmptyInspectorState />
        ) : (
          <>
            {multipleSelected && (
              <div className="mb-3 rounded-[12px] border border-arctic-ice/20 bg-arctic-ice/10 px-3 py-2 text-[11px] font-semibold text-arctic-text">
                {t("inspector.editingFirst").replace("{count}", String(selectedObjectIds.length))}
              </div>
            )}
            <GeneralPanel object={selectedObject} updateSelected={updateSelected} />
            
            {(() => {
              let hasGeom = false;
              if (["point", "circle", "polygon", "angle", "text", "image", "slider", "arc", "elliptical-arc", "region"].includes(selectedObject.type)) {
                hasGeom = true;
              } else if (selectedObject.type === "line") {
                hasGeom = !!(
                  selectedObject.lineKind === "perpendicular" ||
                  selectedObject.lineKind === "perpendicular-bisector" ||
                  selectedObject.lineKind === "angle-bisector" ||
                  selectedObject.lineKind === "angle-bisector-4step" ||
                  selectedObject.specialLineKind === "perpendicular-bisector-3step" ||
                  selectedObject.specialLineKind === "angle-bisector" ||
                  selectedObject.specialLineKind === "altitude"
                );
              } else if (selectedObject.type === "segment") {
                hasGeom = !!(
                  selectedObject.specialLineKind === "perpendicular-bisector-3step" ||
                  selectedObject.specialLineKind === "angle-bisector" ||
                  selectedObject.specialLineKind === "altitude"
                );
              }
              return hasGeom && (
                <>
                  <Divider className="my-2.5" />
                  <GeometryPanel
                    object={selectedObject}
                    objects={objects}
                    updateSelected={updateSelected}
                  />
                </>
              );
            })()}

            <Divider className="my-2.5" />
            <AppearancePanel
              object={selectedObject}
              updateSelected={updateSelected}
              updateStyle={updateStyle}
            />
            <Divider className="my-2.5" />
            <LabelPanel
              object={selectedObject}
              updateSelected={updateSelected}
              updateStyle={updateStyle}
            />
            <Divider className="my-2.5" />
            <AdvancedPanel 
              object={selectedObject} 
              objects={objects}
              updateSelected={updateSelected} 
              updateStyle={updateStyle} 
            />
          </>
        )}
      </div>
    </Panel>
  );
}

function EmptyInspectorState() {
  const { t } = useTranslation();

  return (
    <div className="rounded-[14px] border border-arctic-border/8 bg-arctic-surface/55 px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-arctic-muted">
        {t("inspector.selection")}
      </p>
      <p className="mt-2 text-sm font-semibold text-arctic-text">
        {t("inspector.selectPrompt")}
      </p>
      <p className="mt-1 text-xs font-semibold text-arctic-muted">
        {t("inspector.chooseToolPrompt")}
      </p>
    </div>
  );
}
