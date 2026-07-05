import { Lock, SlidersHorizontal } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import type { GeometryObject, GeometryStyle } from "../../core/geometry";
import { Divider, IconButton, Panel } from "../../ui/primitives";
import { AdvancedPanel } from "./AdvancedPanel";
import { AppearancePanel } from "./AppearancePanel";
import { GeneralPanel } from "./GeneralPanel";
import { GeometryPanel } from "./GeometryPanel";
import { LabelPanel } from "./LabelPanel";

export function RightPanel() {
  const objects = useGeometryStore((state) => state.objects);
  const selectedObjectIds = useGeometryStore((state) => state.selectedObjectIds);
  const updateObject = useGeometryStore((state) => state.updateObject);
  const selectedObject = selectedObjectIds[0] ? objects[selectedObjectIds[0]] : null;
  const multipleSelected = selectedObjectIds.length > 1;

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

  return (
    <Panel
      actions={
        <>
          <IconButton label="Inspector Options" size="sm">
            <SlidersHorizontal size={16} strokeWidth={2} />
          </IconButton>
          <IconButton label="Lock Panel" size="sm">
            <Lock size={16} strokeWidth={2} />
          </IconButton>
        </>
      }
      className="min-h-0 overflow-hidden max-lg:hidden"
      eyebrow="Inspector"
      title="Properties"
    >
      <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 py-3">
        {!selectedObject ? (
          <EmptyInspectorState />
        ) : (
          <>
            {multipleSelected && (
              <div className="mb-3 rounded-[12px] border border-arctic-ice/20 bg-arctic-ice/10 px-3 py-2 text-[11px] font-semibold text-arctic-text">
                Editing first of {selectedObjectIds.length} selected objects.
              </div>
            )}
            <GeneralPanel object={selectedObject} updateSelected={updateSelected} />
            <Divider className="my-4" />
            <GeometryPanel
              object={selectedObject}
              objects={objects}
              updateSelected={updateSelected}
            />
            <Divider className="my-4" />
            <AppearancePanel
              object={selectedObject}
              updateSelected={updateSelected}
              updateStyle={updateStyle}
            />
            <Divider className="my-4" />
            <LabelPanel
              object={selectedObject}
              updateSelected={updateSelected}
              updateStyle={updateStyle}
            />
            <Divider className="my-4" />
            <AdvancedPanel object={selectedObject} />
          </>
        )}
      </div>
    </Panel>
  );
}

function EmptyInspectorState() {
  return (
    <div className="rounded-[14px] border border-white/8 bg-white/[0.035] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-arctic-muted">
        Selection
      </p>
      <p className="mt-2 text-sm font-semibold text-arctic-text">
        Select an object to edit its properties.
      </p>
    </div>
  );
}
