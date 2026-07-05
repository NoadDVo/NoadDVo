function normalizeHex(color: string): string | null {
  if (color === "transparent") {
    return null;
  }

  const trimmed = color.trim();
  const shortHex = /^#([0-9a-fA-F]{3})$/;
  const fullHex = /^#([0-9a-fA-F]{6})$/;
  const shortMatch = trimmed.match(shortHex);
  const fullMatch = trimmed.match(fullHex);

  if (fullMatch?.[1]) {
    return fullMatch[1].toUpperCase();
  }

  if (shortMatch?.[1]) {
    return shortMatch[1]
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toUpperCase();
  }

  return null;
}

export class TikzColorRegistry {
  private readonly namesByHex = new Map<string, string>();

  getColorName(color: string): string | null {
    const hex = normalizeHex(color);

    if (!hex) {
      return null;
    }

    const existing = this.namesByHex.get(hex);

    if (existing) {
      return existing;
    }

    const name = `ndvColor${hex}`;
    this.namesByHex.set(hex, name);

    return name;
  }

  getDefinitions(): readonly string[] {
    return Array.from(this.namesByHex.entries())
      .sort(([firstHex], [secondHex]) => firstHex.localeCompare(secondHex))
      .map(([hex, name]) => `\\definecolor{${name}}{HTML}{${hex}}`);
  }
}
