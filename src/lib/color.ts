import { colord, extend } from "colord";
import mixPlugin from "colord/plugins/mix";
import namesPlugin from "colord/plugins/names";
import a11yPlugin from "colord/plugins/a11y";

extend([mixPlugin, namesPlugin, a11yPlugin]);

export type ColorResult = {
  accent: string;
  accentRgb: string;
  accentHover: string;
};

/**
 * Adjusts the given color to be suitable for use as an accent color in a dark theme.
 * Ensures sufficient saturation and appropriate lightness.
 * @param color Hex string or RGB object/array
 */
export function adjustAccentColor(color: string | [number, number, number] | { r: number; g: number; b: number }): ColorResult {
  let c;

  if (Array.isArray(color)) {
    c = colord({ r: color[0], g: color[1], b: color[2] });
  } else {
    c = colord(color);
  }

  // Ensure valid color, fallback to default blue if invalid
  if (!c.isValid()) {
    c = colord("#58a6ff");
  }

  // Adjust saturation: if too low, saturate
  if (c.toHsl().s < 40) {
    c = c.saturate(0.3);
  } else if (c.toHsl().s < 60) {
    c = c.saturate(0.1);
  }

  // Adjust lightness for dark mode context
  // Should be bright enough to glow, but not white
  const l = c.toHsl().l;
  if (l < 45) {
    c = c.lighten(0.45 - l / 100); // Lift to at least 45%
  } else if (l > 85) {
    c = c.darken(l / 100 - 0.85); // Dim to at most 85%
  }

  const hex = c.toHex();
  const rgb = c.toRgb();
  const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  // Hover state is slightly lighter
  const hover = c.lighten(0.1).toHex();

  return {
    accent: hex,
    accentRgb: rgbString,
    accentHover: hover,
  };
}
