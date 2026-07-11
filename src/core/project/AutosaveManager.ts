import { useGeometryStore } from "../../app/store/geometryStore";
import {
  AUTOSAVE_INTERVAL_MS,
  AUTOSAVE_KEY,
} from "./ProjectVersion";

type AutosaveProvider = {
  readonly serialize: () => string;
};

function saveToLocalStorage(serializedProject: string): void {
  try {
    window.localStorage.setItem(AUTOSAVE_KEY, serializedProject);
  } catch {
    // Autosave is best-effort and should never interrupt drawing.
  }
}

async function saveToIndexedDb(serializedProject: string): Promise<void> {
  if (!("indexedDB" in window)) {
    saveToLocalStorage(serializedProject);

    return;
  }

  await new Promise<void>((resolve) => {
    const request = window.indexedDB.open("noaddvo-geometry-studio", 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore("autosave");
    };
    request.onerror = () => {
      saveToLocalStorage(serializedProject);
      resolve();
    };
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("autosave", "readwrite");

      transaction.objectStore("autosave").put(serializedProject, AUTOSAVE_KEY);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        saveToLocalStorage(serializedProject);
        resolve();
      };
    };
  });
}

export class AutosaveManager {
  private intervalId: number | null = null;
  private unsubscribeGeometry: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;
  private lastHistoryVersion = useGeometryStore.getState().historyVersion;

  start(provider: AutosaveProvider): void {
    if (this.intervalId !== null) {
      return;
    }

    const autosave = () => {
      void saveToIndexedDb(provider.serialize());
    };

    this.intervalId = window.setInterval(autosave, AUTOSAVE_INTERVAL_MS);
    this.unsubscribeGeometry = useGeometryStore.subscribe((state) => {
      if (state.historyVersion === this.lastHistoryVersion) {
        return;
      }

      this.lastHistoryVersion = state.historyVersion;
      window.setTimeout(autosave, 250);
    });
    this.beforeUnloadHandler = autosave;
    window.addEventListener("beforeunload", autosave);
  }

  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.unsubscribeGeometry?.();
    this.unsubscribeGeometry = null;

    if (this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }

  saveNow(provider: AutosaveProvider): void {
    void saveToIndexedDb(provider.serialize());
  }

  async loadLast(): Promise<string | null> {
    if (!("indexedDB" in window)) {
      return globalThis.localStorage.getItem(AUTOSAVE_KEY);
    }

    return new Promise((resolve) => {
      const request = window.indexedDB.open("noaddvo-geometry-studio", 1);

      request.onupgradeneeded = () => {
        request.result.createObjectStore("autosave");
      };
      request.onerror = () => {
        resolve(globalThis.localStorage.getItem(AUTOSAVE_KEY));
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("autosave", "readonly");
        const readRequest = transaction.objectStore("autosave").get(AUTOSAVE_KEY);

        readRequest.onsuccess = () => {
          database.close();
          resolve(typeof readRequest.result === "string" ? readRequest.result : null);
        };
        readRequest.onerror = () => {
          database.close();
          resolve(globalThis.localStorage.getItem(AUTOSAVE_KEY));
        };
      };
    });
  }

  async clearLast(): Promise<void> {
    window.localStorage.removeItem(AUTOSAVE_KEY);

    if (!("indexedDB" in window)) {
      return;
    }

    await new Promise<void>((resolve) => {
      const request = window.indexedDB.open("noaddvo-geometry-studio", 1);

      request.onerror = () => resolve();
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("autosave", "readwrite");

        transaction.objectStore("autosave").delete(AUTOSAVE_KEY);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          resolve();
        };
      };
    });
  }
}

export const autosaveManager = new AutosaveManager();
