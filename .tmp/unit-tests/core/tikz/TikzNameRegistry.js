"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TikzNameRegistry = void 0;
function sanitizeName(name) {
    const sanitized = name.replace(/\s+/g, "").replace(/[^A-Za-z0-9]/g, "");
    if (!sanitized) {
        return "P";
    }
    return /^[A-Za-z]/.test(sanitized) ? sanitized : `P${sanitized}`;
}
function fallbackName(index) {
    const letter = String.fromCharCode(65 + (index % 26));
    const suffix = Math.floor(index / 26);
    return suffix === 0 ? letter : `${letter}${suffix}`;
}
class TikzNameRegistry {
    namesByPointId = new Map();
    usedNames = new Set();
    registerPoint(point, index, usePointNames = true) {
        const existing = this.namesByPointId.get(point.id);
        if (existing) {
            return existing;
        }
        const baseName = sanitizeName(usePointNames ? point.name ?? fallbackName(index) : fallbackName(index));
        let candidate = baseName;
        let suffix = 1;
        while (this.usedNames.has(candidate)) {
            candidate = `${baseName}${suffix}`;
            suffix += 1;
        }
        this.usedNames.add(candidate);
        this.namesByPointId.set(point.id, candidate);
        return candidate;
    }
    getPointName(pointId) {
        return this.namesByPointId.get(pointId) ?? null;
    }
}
exports.TikzNameRegistry = TikzNameRegistry;
