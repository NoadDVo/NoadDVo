"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recentProjects = exports.RecentProjects = void 0;
const ProjectVersion_1 = require("./ProjectVersion");
function safeStorage() {
    try {
        return window.localStorage;
    }
    catch {
        return null;
    }
}
function parseRecentProjects(value) {
    if (!value) {
        return [];
    }
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter((item) => typeof item === "object" &&
            item !== null &&
            "id" in item &&
            "name" in item &&
            "modifiedAt" in item &&
            "serializedProject" in item);
    }
    catch {
        return [];
    }
}
class RecentProjects {
    getAll() {
        return parseRecentProjects(safeStorage()?.getItem(ProjectVersion_1.RECENT_PROJECTS_KEY) ?? null);
    }
    add(document, serializedProject) {
        const recentProject = {
            id: document.project.id,
            modifiedAt: document.project.updatedAt,
            name: document.project.name,
            serializedProject,
            thumbnail: document.project.thumbnail ?? "placeholder",
        };
        const nextProjects = [
            recentProject,
            ...this.getAll().filter((project) => project.id !== recentProject.id),
        ].slice(0, 10);
        safeStorage()?.setItem(ProjectVersion_1.RECENT_PROJECTS_KEY, JSON.stringify(nextProjects));
        return nextProjects;
    }
}
exports.RecentProjects = RecentProjects;
exports.recentProjects = new RecentProjects();
