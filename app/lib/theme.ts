export function hslToRgb(h: number, s: number, l: number) {
  // Normalize inputs: Hue (0-360), Saturation (0-1), Lightness (0-1)
  h = h % 360; // Ensure hue is within 0-360
  s = Math.max(0, Math.min(1, s)); // Clamp saturation between 0 and 1
  l = Math.max(0, Math.min(1, l)); // Clamp lightness between 0 and 1

  if (s === 0) {
    // Achromatic (gray), no saturation
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  const c = (1 - Math.abs(2 * l - 1)) * s; // Chroma
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r, g, b;
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  // Convert to 0-255 range and add the lightness offset
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b] as const;
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function hslToHex(h: number, s: number, l: number) {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
}

export function getThemeValues() {
  const bodyStyle = getComputedStyle(document.body);
  const getColor = (value: string) => {
    const hsl = bodyStyle.getPropertyValue(value);
    const hslArray = hsl
      .replace(/[^\d.\s]/g, "")
      .split(" ")
      .map(Number);
    if (hslArray.length !== 3) {
      return "#000000";
    }
    const [h, s, l] = hslArray;
    return hslToHex(h, s / 100, l / 100);
  };

  return {
    // Theme fonts
    fontFamily: bodyStyle.getPropertyValue("font-family"),

    // Theme colors
    mutedForeground: getColor(`--muted-foreground`),
    foreground: getColor(`--foreground`),

    // Special status colors
    COMPLIANT: getColor(`--status-compliant`),
    DUE_SOON: getColor(`--status-due-soon`),
    NON_COMPLIANT: getColor(`--status-non-compliant`),
    NEVER: getColor(`--status-never`),
  } as const;
}
