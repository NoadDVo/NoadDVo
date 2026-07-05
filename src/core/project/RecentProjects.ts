import {
  RECENT_PROJECTS_KEY,
} from "./ProjectVersion";
import type { NoadDVoProjectDocument } from "./ProjectMetadata";

export type RecentProject = {
  readonly id: string;
  readonly name: string;
  readonly modifiedAt: string;
  readonly thumbnail: string;
  readonly serializedProject: string;
};

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseRecentProjects(value: string | null): readonly RecentProject[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is RecentProject =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "name" in item &&
        "modifiedAt" in item &&
        "serializedProject" in item,
    );
  } catch {
    return [];
  }
}

export class RecentProjects {
  getAll(): readonly RecentProject[] {
    return parseRecentProjects(safeStorage()?.getItem(RECENT_PROJECTS_KEY) ?? null);
  }

  add(document: NoadDVoProjectDocument, serializedProject: string): readonly RecentProject[] {
    const recentProject: RecentProject = {
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

    safeStorage()?.setItem(RECENT_PROJECTS_KEY, JSON.stringify(nextProjects));

    return nextProjects;
  }
}

export const recentProjects = new RecentProjects();

