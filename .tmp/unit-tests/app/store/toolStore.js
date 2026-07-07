"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolStore = void 0;
const createToolStore = (set) => ({
    setActiveTool: (toolId) => {
        set({ activeTool: toolId });
    },
});
exports.createToolStore = createToolStore;
