const defaultBlackHexes = new Set(["0B0F14", "000000", "747B84"]);

function normalizeRgbColor(color: string): string | null {
  const match = color.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);

  if (!match?.[1] || !match[2] || !match[3]) {
    return null;
  }

  const channels = [match[1], match[2], match[3]].map((channel) => Number(channel));

  if (channels.some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255)) {
    return null;
  }

  return channels
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function normalizeHex(color: string): string | null {
  if (color === "transparent") {
    return null;
  }

  const trimmed = color.trim();
  const shortHex = /^#([0-9a-fA-F]{3})$/;
  const fullHex = /^#?([0-9a-fA-F]{6})$/;
  const shortMatch = trimmed.match(shortHex);
  const fullMatch = trimmed.match(fullHex);

  if (trimmed.toLowerCase() === "black") {
    return null;
  }

  if (fullMatch?.[1]) {
    const hex = fullMatch[1].toUpperCase();

    return defaultBlackHexes.has(hex) ? null : hex;
  }

  if (shortMatch?.[1]) {
    const hex = shortMatch[1]
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toUpperCase();

    return defaultBlackHexes.has(hex) ? null : hex;
  }

  const rgbHex = normalizeRgbColor(trimmed);

  if (rgbHex) {
    return defaultBlackHexes.has(rgbHex) ? null : rgbHex;
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
