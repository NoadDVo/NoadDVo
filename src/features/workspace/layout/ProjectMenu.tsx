import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Download,
  FilePlus2,
  FolderClock,
  FolderOpen,
  Menu,
  FileImage,
  Clipboard,
  Copy,
  Save,
  Upload,
} from "lucide-react";

import {
  useGeometryStore,
  type ExampleSceneId,
} from "../../../app/store/geometryStore";
import { useViewportStore } from "../../../app/store/viewportStore";
import { createReferenceImageObject } from "../../../core/geometry";
import { screenToWorld } from "../../../core/geometry/viewport";
import { exportManager } from "../../../core/export";
import {
  copySelectionToGeometryClipboard,
  duplicateSelection,
  hasGeometryClipboard,
  pasteGeometryClipboard,
} from "../../../core/clipboard";
import { projectManager, type ProjectManagerState } from "../../../core/project";
import { Button } from "../../../ui/primitives";
import { AnchoredOverlay } from "../../../ui/overlay/OverlayPortal";

type ProjectMenuProps = {
  readonly projectState: ProjectManagerState;
};

export function ProjectMenu({ projectState }: ProjectMenuProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadExample = (exampleId: ExampleSceneId) => {
    if (!useGeometryStore.getState().loadExample(exampleId)) {
      window.alert("The example scene could not be loaded.");
    }

    setMenuOpen(false);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    projectManager.openProjectText(await file.text());
    setMenuOpen(false);
  };

  const handleImageImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const viewport = useViewportStore.getState().viewport;
    const center = screenToWorld(
      { x: viewport.width / 2, y: viewport.height / 2 },
      viewport,
    );
    const imageObject = createReferenceImageObject({
      mimeType: file.type || "application/octet-stream",
      name: file.name.replace(/\.[^.]+$/, "") || "Reference Image",
      position: center,
      src: dataUrl,
    });
    const geometry = useGeometryStore.getState();

    if (geometry.addObject(imageObject)) {
      geometry.selectObject(imageObject.id);
    } else {
      window.alert("The reference image could not be imported.");
    }

    setMenuOpen(false);
  };

  return (
    <>
      <input
        accept=".ndv,application/json"
        className="hidden"
        onChange={handleImport}
        ref={fileInputRef}
        type="file"
      />
      <input
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleImageImport}
        ref={imageInputRef}
        type="file"
      />
      <Button
        icon={<Menu size={16} strokeWidth={2} />}
        onClick={() => setMenuOpen((open) => !open)}
        ref={buttonRef}
        size="sm"
        variant="ghost"
      >
        Project
      </Button>
      <AnchoredOverlay anchorRef={buttonRef} open={menuOpen} width={320}>
        <div className="overflow-hidden rounded-[16px] border border-arctic-border/10 bg-arctic-background/95 p-1.5 shadow-[0_18px_50px_rgb(0_0_0/0.38)] backdrop-blur-panel">
          <ProjectOption
            icon={<FilePlus2 size={15} strokeWidth={2} />}
            label="New Project"
            onClick={() => {
              projectManager.newProject();
              setMenuOpen(false);
            }}
          />
          <ProjectOption
            icon={<Upload size={15} strokeWidth={2} />}
            label="Open Project"
            onClick={() => fileInputRef.current?.click()}
          />
          <ProjectOption
            icon={<FileImage size={15} strokeWidth={2} />}
            label="Import Reference Image"
            onClick={() => imageInputRef.current?.click()}
          />
          <MenuDivider />
          <MenuHeading icon={<FolderClock size={14} strokeWidth={2} />}>
            Recent Projects
          </MenuHeading>
          {projectState.recentProjects.length === 0 ? (
            <div className="rounded-[12px] px-3 py-2 text-[11px] font-semibold text-arctic-muted">
              No recent projects yet.
            </div>
          ) : (
            projectState.recentProjects.map((project) => (
              <button
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left transition hover:bg-arctic-surface/70"
                key={project.id}
                onClick={() => {
                  projectManager.openRecentProject(project);
                  setMenuOpen(false);
                }}
                type="button"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-arctic-ice/15 bg-arctic-ice/10 text-[9px] font-black text-arctic-ice">
                  NDV
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold uppercase tracking-[0.12em] text-arctic-text">
                    {project.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] text-arctic-muted">
                    {new Date(project.modifiedAt).toLocaleString()}
                  </span>
                </span>
              </button>
            ))
          )}
          <MenuDivider />
          <ProjectOption
            icon={<Save size={15} strokeWidth={2} />}
            label="Save"
            onClick={() => {
              projectManager.saveProject();
              setMenuOpen(false);
            }}
          />

          <MenuDivider />
          <ProjectOption
            icon={<Clipboard size={15} strokeWidth={2} />}
            label="Copy Selection"
            onClick={() => {
              copySelectionToGeometryClipboard();
              setMenuOpen(false);
            }}
          />
          <ProjectOption
            icon={<Clipboard size={15} strokeWidth={2} />}
            label="Paste"
            onClick={() => {
              pasteGeometryClipboard();
              setMenuOpen(false);
            }}
          />
          <ProjectOption
            icon={<Copy size={15} strokeWidth={2} />}
            label="Duplicate Selection"
            onClick={() => {
              duplicateSelection();
              setMenuOpen(false);
            }}
          />
          {!hasGeometryClipboard() && (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-arctic-muted">
              Paste uses the internal geometry clipboard.
            </div>
          )}
          <MenuDivider />
          <MenuHeading icon={<FolderOpen size={14} strokeWidth={2} />}>
            Load Example
          </MenuHeading>
          {([
            ["triangle", "Triangle"],
            ["circle", "Circle"],
            ["olympiad", "Olympiad Sample"],
            ["coordinate", "Coordinate Geometry"],
          ] as const).map(([id, label]) => (
            <ProjectOption
              key={id}
              label={label}
              onClick={() => loadExample(id as ExampleSceneId)}
            />
          ))}
          <ProjectOption
            icon={<Upload size={15} strokeWidth={2} />}
            label="Import"
            onClick={() => fileInputRef.current?.click()}
          />
          <ProjectOption
            icon={<Download size={15} strokeWidth={2} />}
            label="Export"
            onClick={() => {
              exportManager.exportProjectText(projectManager.serializeCurrentProject());
              setMenuOpen(false);
            }}
          />
        </div>
      </AnchoredOverlay>
    </>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("error", () => reject(reader.error));
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.readAsDataURL(file);
  });
}

function ProjectOption({
  icon,
  label,
  onClick,
}: {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      className="flex min-h-9 w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-arctic-text transition hover:bg-arctic-surface/70 hover:text-arctic-ice"
      onClick={onClick}
      type="button"
    >
      {icon && <span className="text-arctic-ice/80">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

function MenuHeading({
  children,
  icon,
}: {
  readonly children: ReactNode;
  readonly icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-arctic-muted">
      {icon}
      {children}
    </div>
  );
}

function MenuDivider() {
  return <div className="my-1 h-px bg-gradient-to-r from-transparent via-arctic-border/10 to-transparent" />;
}
