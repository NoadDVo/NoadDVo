"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autosaveManager = exports.AutosaveManager = void 0;
const geometryStore_1 = require("../../app/store/geometryStore");
const ProjectVersion_1 = require("./ProjectVersion");
function saveToLocalStorage(serializedProject) {
    try {
        window.localStorage.setItem(ProjectVersion_1.AUTOSAVE_KEY, serializedProject);
    }
    catch {
        // Autosave is best-effort and should never interrupt drawing.
    }
}
async function saveToIndexedDb(serializedProject) {
    if (!("indexedDB" in window)) {
        saveToLocalStorage(serializedProject);
        return;
    }
    await new Promise((resolve) => {
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
            transaction.objectStore("autosave").put(serializedProject, ProjectVersion_1.AUTOSAVE_KEY);
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
class AutosaveManager {
    intervalId = null;
    unsubscribeGeometry = null;
    beforeUnloadHandler = null;
    lastHistoryVersion = geometryStore_1.useGeometryStore.getState().historyVersion;
    start(provider) {
        if (this.intervalId !== null) {
            return;
        }
        const autosave = () => {
            void saveToIndexedDb(provider.serialize());
        };
        this.intervalId = window.setInterval(autosave, ProjectVersion_1.AUTOSAVE_INTERVAL_MS);
        this.unsubscribeGeometry = geometryStore_1.useGeometryStore.subscribe((state) => {
            if (state.historyVersion === this.lastHistoryVersion) {
                return;
            }
            this.lastHistoryVersion = state.historyVersion;
            window.setTimeout(autosave, 250);
        });
        this.beforeUnloadHandler = autosave;
        window.addEventListener("beforeunload", autosave);
    }
    stop() {
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
    saveNow(provider) {
        void saveToIndexedDb(provider.serialize());
    }
    async loadLast() {
        if (!("indexedDB" in window)) {
            return globalThis.localStorage.getItem(ProjectVersion_1.AUTOSAVE_KEY);
        }
        return new Promise((resolve) => {
            const request = window.indexedDB.open("noaddvo-geometry-studio", 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore("autosave");
            };
            request.onerror = () => {
                resolve(globalThis.localStorage.getItem(ProjectVersion_1.AUTOSAVE_KEY));
            };
            request.onsuccess = () => {
                const database = request.result;
                const transaction = database.transaction("autosave", "readonly");
                const readRequest = transaction.objectStore("autosave").get(ProjectVersion_1.AUTOSAVE_KEY);
                readRequest.onsuccess = () => {
                    database.close();
                    resolve(typeof readRequest.result === "string" ? readRequest.result : null);
                };
                readRequest.onerror = () => {
                    database.close();
                    resolve(globalThis.localStorage.getItem(ProjectVersion_1.AUTOSAVE_KEY));
                };
            };
        });
    }
    async clearLast() {
        window.localStorage.removeItem(ProjectVersion_1.AUTOSAVE_KEY);
        if (!("indexedDB" in window)) {
            return;
        }
        await new Promise((resolve) => {
            const request = window.indexedDB.open("noaddvo-geometry-studio", 1);
            request.onerror = () => resolve();
            request.onsuccess = () => {
                const database = request.result;
                const transaction = database.transaction("autosave", "readwrite");
                transaction.objectStore("autosave").delete(ProjectVersion_1.AUTOSAVE_KEY);
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
exports.AutosaveManager = AutosaveManager;
exports.autosaveManager = new AutosaveManager();
