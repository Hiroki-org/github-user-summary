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

// Constants for color adjustment
const DEFAULT_ACCENT_COLOR = "#58a6ff";
const MIN_SATURATION_FOR_HIGH_BOOST = 40;
const HIGH_SATURATION_BOOST = 0.3;
const MIN_SATURATION_FOR_LOW_BOOST = 60;
const LOW_SATURATION_BOOST = 0.1;
const TARGET_MIN_LIGHTNESS = 45;
const TARGET_MAX_LIGHTNESS = 85;
const HOVER_LIGHTEN_AMOUNT = 0.1;

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
    c = colord(DEFAULT_ACCENT_COLOR);
  }

  // Adjust saturation: if too low, saturate
  const s = c.toHsl().s;
  if (s < MIN_SATURATION_FOR_HIGH_BOOST) {
    c = c.saturate(HIGH_SATURATION_BOOST);
  } else if (s < MIN_SATURATION_FOR_LOW_BOOST) {
    c = c.saturate(LOW_SATURATION_BOOST);
  }

  // Adjust lightness for dark mode context
  // Should be bright enough to glow, but not white
  const l = c.toHsl().l;
  if (l < TARGET_MIN_LIGHTNESS) {
    // Lift to at least TARGET_MIN_LIGHTNESS
    c = c.lighten((TARGET_MIN_LIGHTNESS - l) / 100);
  } else if (l > TARGET_MAX_LIGHTNESS) {
    // Dim to at most TARGET_MAX_LIGHTNESS
    c = c.darken((l - TARGET_MAX_LIGHTNESS) / 100);
  }

  const hex = c.toHex();
  const rgb = c.toRgb();
  const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  // Hover state is slightly lighter
  const hover = c.lighten(HOVER_LIGHTEN_AMOUNT).toHex();

  return {
    accent: hex,
    accentRgb: rgbString,
    accentHover: hover,
  };
}
