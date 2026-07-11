"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectManager = exports.ProjectManager = void 0;
const geometryStore_1 = require("../../app/store/geometryStore");
const uiStore_1 = require("../../app/store/uiStore");
const viewportStore_1 = require("../../app/store/viewportStore");
const export_1 = require("../export");
const tikz_1 = require("../tikz");
const ProjectLoader_1 = require("./ProjectLoader");
const ProjectMetadata_1 = require("./ProjectMetadata");
const ProjectSerializer_1 = require("./ProjectSerializer");
const AutosaveManager_1 = require("./AutosaveManager");
const RecentProjects_1 = require("./RecentProjects");
function createSnapshot() {
    const geometry = geometryStore_1.useGeometryStore.getState();
    const viewport = viewportStore_1.useViewportStore.getState();
    const ui = uiStore_1.useUiStore.getState();
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
        tikzOptions: (0, tikz_1.getTikzOptions)(ui.tikzMode),
        viewport: viewport.viewport,
    };
}
function filenameForProject(name) {
    return `${name.trim().replace(/[^a-zA-Z0-9-_]+/g, "-") || "noaddvo-project"}.ndv`;
}
class ProjectManager {
    listeners = new Set();
    state = {
        autosaveAvailable: false,
        currentProject: (0, ProjectMetadata_1.createProjectMetadata)(),
        pendingNewProject: false,
        recentProjects: RecentProjects_1.recentProjects.getAll(),
    };
    getSnapshot = () => this.state;
    subscribe = (listener) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    startAutosave() {
        AutosaveManager_1.autosaveManager.start({
            serialize: () => this.serializeCurrentProject(),
        });
        void this.checkAutosaveRecovery();
    }
    newProject() {
        const hasObjects = Object.keys(geometryStore_1.useGeometryStore.getState().objects).length > 0;
        if (hasObjects) {
            this.setPendingNewProject(true);
            return;
        }
        this.discardAndCreateProject();
    }
    cancelNewProject() {
        this.setPendingNewProject(false);
    }
    discardNewProject() {
        this.setPendingNewProject(false);
        this.discardAndCreateProject();
    }
    saveBeforeNewProject() {
        this.saveProject();
        this.setPendingNewProject(false);
    }
    recoverAutosave() {
        void AutosaveManager_1.autosaveManager.loadLast().then((serializedProject) => {
            if (!serializedProject) {
                this.setAutosaveAvailable(false);
                return;
            }
            if (this.openProjectText(serializedProject)) {
                void AutosaveManager_1.autosaveManager.clearLast();
                this.setAutosaveAvailable(false);
            }
        });
    }
    dismissAutosave() {
        void AutosaveManager_1.autosaveManager.clearLast().then(() => {
            this.setAutosaveAvailable(false);
        });
    }
    discardAndCreateProject() {
        geometryStore_1.useGeometryStore.getState().clearProject();
        viewportStore_1.useViewportStore.getState().resetViewport();
        this.setCurrentProject((0, ProjectMetadata_1.createProjectMetadata)());
    }
    saveProject() {
        const document = this.createTouchedDocument();
        const serializedProject = (0, ProjectSerializer_1.serializeProjectDocument)(document);
        export_1.exportManager.exportProjectText(serializedProject, filenameForProject(document.project.name));
        this.trackRecent(document, serializedProject);
    }
    saveProjectAs() {
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
    openProjectText(text) {
        const result = (0, ProjectLoader_1.loadProjectDocument)(text);
        if (!result.valid) {
            window.alert(result.error);
            return false;
        }
        this.applyDocument(result.document);
        this.trackRecent(result.document, text);
        AutosaveManager_1.autosaveManager.saveNow({
            serialize: () => this.serializeCurrentProject(),
        });
        return true;
    }
    openRecentProject(project) {
        return this.openProjectText(project.serializedProject);
    }
    serializeCurrentProject() {
        return (0, ProjectSerializer_1.serializeProjectDocument)((0, ProjectSerializer_1.createProjectDocument)(this.state.currentProject, createSnapshot()));
    }
    createTouchedDocument() {
        const metadata = (0, ProjectMetadata_1.touchProjectMetadata)(this.state.currentProject);
        const document = (0, ProjectSerializer_1.createProjectDocument)(metadata, createSnapshot());
        this.setCurrentProject(metadata);
        return document;
    }
    applyDocument(document) {
        const geometry = geometryStore_1.useGeometryStore.getState();
        const viewport = viewportStore_1.useViewportStore.getState();
        const ui = uiStore_1.useUiStore.getState();
        if (!geometry.setObjects(document.objects, "Open project", document.selection)) {
            window.alert("The project contains invalid geometry.");
            return;
        }
        viewport.setViewportState(document.viewport, document.settings);
        ui.setTheme(document.theme);
        ui.setTikzMode(document.tikzOptions.mode);
        this.setCurrentProject(document.project);
    }
    trackRecent(document, serializedProject) {
        this.state = {
            ...this.state,
            recentProjects: RecentProjects_1.recentProjects.add(document, serializedProject),
        };
        this.emit();
    }
    setCurrentProject(currentProject) {
        this.state = {
            ...this.state,
            currentProject,
        };
        this.emit();
    }
    setPendingNewProject(pendingNewProject) {
        this.state = {
            ...this.state,
            pendingNewProject,
        };
        this.emit();
    }
    setAutosaveAvailable(autosaveAvailable) {
        this.state = {
            ...this.state,
            autosaveAvailable,
        };
        this.emit();
    }
    async checkAutosaveRecovery() {
        const serializedProject = await AutosaveManager_1.autosaveManager.loadLast();
        this.setAutosaveAvailable(Boolean(serializedProject));
    }
    emit() {
        this.listeners.forEach((listener) => listener());
    }
}
exports.ProjectManager = ProjectManager;
exports.projectManager = new ProjectManager();
