import { useGeometryStore } from "../../app/store/geometryStore";
import { useUiStore } from "../../app/store/uiStore";
import { useViewportStore } from "../../app/store/viewportStore";
import { exportManager } from "../export";
import { getTikzOptions } from "../tikz";
import { loadProjectDocument } from "./ProjectLoader";
import {
  createProjectMetadata,
  touchProjectMetadata,
  type NoadDVoProjectDocument,
  type ProjectMetadata,
  type ProjectRuntimeSnapshot,
} from "./ProjectMetadata";
import {
  createProjectDocument,
  serializeProjectDocument,
} from "./ProjectSerializer";
import { autosaveManager } from "./AutosaveManager";
import { recentProjects, type RecentProject } from "./RecentProjects";

type Listener = () => void;

export type ProjectManagerState = {
  readonly autosaveAvailable: boolean;
  readonly currentProject: ProjectMetadata;
  readonly pendingNewProject: boolean;
  readonly recentProjects: readonly RecentProject[];
};

function createSnapshot(): ProjectRuntimeSnapshot {
  const geometry = useGeometryStore.getState();
  const viewport = useViewportStore.getState();
  const ui = useUiStore.getState();

  return {
    objects: geometry.objects,
    selectedObjectIds: geometry.selectedObjectIds,
    settings: {
      gridSize: viewport.gridSize,
      showAxes: viewport.showAxes,
      showGrid: viewport.showGrid,
      snapEnabled: viewport.snapEnabled,
    },
    theme: ui.theme,
    tikzOptions: getTikzOptions(ui.tikzMode),
    viewport: viewport.viewport,
  };
}

function filenameForProject(name: string): string {
  return `${name.trim().replace(/[^a-zA-Z0-9-_]+/g, "-") || "noaddvo-project"}.ndv`;
}

export class ProjectManager {
  private listeners = new Set<Listener>();
  private state: ProjectManagerState = {
    autosaveAvailable: false,
    currentProject: createProjectMetadata(),
    pendingNewProject: false,
    recentProjects: recentProjects.getAll(),
  };

  getSnapshot = (): ProjectManagerState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  startAutosave(): void {
    autosaveManager.start({
      serialize: () => this.serializeCurrentProject(),
    });
    void this.checkAutosaveRecovery();
  }

  newProject(): void {
    const hasObjects = Object.keys(useGeometryStore.getState().objects).length > 0;

    if (hasObjects) {
      this.setPendingNewProject(true);

      return;
    }

    this.discardAndCreateProject();
  }

  cancelNewProject(): void {
    this.setPendingNewProject(false);
  }

  discardNewProject(): void {
    this.setPendingNewProject(false);
    this.discardAndCreateProject();
  }

  saveBeforeNewProject(): void {
    this.saveProject();
    this.setPendingNewProject(false);
  }

  recoverAutosave(): void {
    void autosaveManager.loadLast().then((serializedProject) => {
      if (!serializedProject) {
        this.setAutosaveAvailable(false);

        return;
      }

      if (this.openProjectText(serializedProject)) {
        void autosaveManager.clearLast();
        this.setAutosaveAvailable(false);
      }
    });
  }

  dismissAutosave(): void {
    void autosaveManager.clearLast().then(() => {
      this.setAutosaveAvailable(false);
    });
  }

  private discardAndCreateProject(): void {
    useGeometryStore.getState().clearProject();
    useViewportStore.getState().resetViewport();
    this.setCurrentProject(createProjectMetadata());
  }

  saveProject(): void {
    const document = this.createTouchedDocument();
    const serializedProject = serializeProjectDocument(document);

    exportManager.exportProjectText(
      serializedProject,
      filenameForProject(document.project.name),
    );
    this.trackRecent(document, serializedProject);
  }

  saveProjectAs(): void {
    const nextName = window.prompt("Save project as", this.state.currentProject.name);

    if (nextName === null) {
      return;
    }

    const trimmedName = nextName.trim();

    if (!trimmedName) {
      return;
    }

    this.setCurrentProject({
      ...this.state.currentProject,
      name: trimmedName,
    });
    this.saveProject();
  }

  openProjectText(text: string): boolean {
    const result = loadProjectDocument(text);

    if (!result.valid) {
      window.alert(result.error);

      return false;
    }

    this.applyDocument(result.document);
    this.trackRecent(result.document, text);
    autosaveManager.saveNow({
      serialize: () => this.serializeCurrentProject(),
    });

    return true;
  }

  openRecentProject(project: RecentProject): boolean {
    return this.openProjectText(project.serializedProject);
  }

  serializeCurrentProject(): string {
    return serializeProjectDocument(
      createProjectDocument(this.state.currentProject, createSnapshot()),
    );
  }

  private createTouchedDocument(): NoadDVoProjectDocument {
    const metadata = touchProjectMetadata(this.state.currentProject);
    const document = createProjectDocument(metadata, createSnapshot());

    this.setCurrentProject(metadata);

    return document;
  }

  private applyDocument(document: NoadDVoProjectDocument): void {
    const geometry = useGeometryStore.getState();
    const viewport = useViewportStore.getState();
    const ui = useUiStore.getState();

    if (!geometry.setObjects(document.objects, "Open project", document.selection)) {
      window.alert("The project contains invalid geometry.");

      return;
    }

    viewport.setViewportState(document.viewport, document.settings);
    ui.setTheme(document.theme);
    ui.setTikzMode(document.tikzOptions.mode);
    this.setCurrentProject(document.project);
  }

  private trackRecent(
    document: NoadDVoProjectDocument,
    serializedProject: string,
  ): void {
    this.state = {
      ...this.state,
      recentProjects: recentProjects.add(document, serializedProject),
    };
    this.emit();
  }

  private setCurrentProject(currentProject: ProjectMetadata): void {
    this.state = {
      ...this.state,
      currentProject,
    };
    this.emit();
  }

  private setPendingNewProject(pendingNewProject: boolean): void {
    this.state = {
      ...this.state,
      pendingNewProject,
    };
    this.emit();
  }

  private setAutosaveAvailable(autosaveAvailable: boolean): void {
    this.state = {
      ...this.state,
      autosaveAvailable,
    };
    this.emit();
  }

  private async checkAutosaveRecovery(): Promise<void> {
    const serializedProject = await autosaveManager.loadLast();
    this.setAutosaveAvailable(Boolean(serializedProject));
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const projectManager = new ProjectManager();
