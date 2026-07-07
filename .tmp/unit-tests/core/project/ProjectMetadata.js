"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectMetadata = createProjectMetadata;
exports.touchProjectMetadata = touchProjectMetadata;
let metadataCounter = 0;
function createProjectId() {
    metadataCounter += 1;
    return `project-${Date.now().toString(36)}-${metadataCounter}`;
}
function createProjectMetadata(name = "Untitled Geometry", author = "NoadDVo") {
    const now = new Date().toISOString();
    return {
        author,
        createdAt: now,
        description: "",
        id: createProjectId(),
        name,
        updatedAt: now,
    };
}
function touchProjectMetadata(metadata) {
    return {
        ...metadata,
        updatedAt: new Date().toISOString(),
    };
}
