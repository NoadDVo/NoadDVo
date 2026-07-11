import type { PointObject } from "../geometry";

function sanitizeName(name: string): string {
  const sanitized = name.replace(/\s+/g, "").replace(/[^A-Za-z0-9]/g, "");

  if (!sanitized) {
    return "P";
  }

  return /^[A-Za-z]/.test(sanitized) ? sanitized : `P${sanitized}`;
}

function fallbackName(index: number): string {
  const letter = String.fromCharCode(65 + (index % 26));
  const suffix = Math.floor(index / 26);

  return suffix === 0 ? letter : `${letter}${suffix}`;
}

export class TikzNameRegistry {
  private readonly namesByPointId = new Map<string, string>();
  private readonly usedNames = new Set<string>();

  registerPoint(point: PointObject, index: number, usePointNames = true): string {
    const existing = this.namesByPointId.get(point.id);

    if (existing) {
      return existing;
    }

    const baseName = sanitizeName(
      usePointNames ? point.name ?? fallbackName(index) : fallbackName(index),
    );
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

  getPointName(pointId: string): string | null {
    return this.namesByPointId.get(pointId) ?? null;
  }
}
