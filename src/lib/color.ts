import { colord, extend, type Colord } from "colord";
import mixPlugin from "colord/plugins/mix";
import namesPlugin from "colord/plugins/names";
import a11yPlugin from "colord/plugins/a11y";
import { logger } from "./logger";

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

type ColorInput = string | [number, number, number] | { r: number; g: number; b: number };

function parseColor(color: ColorInput): Colord {
  let c: Colord;
  if (Array.isArray(color)) {
    c = colord({ r: color[0], g: color[1], b: color[2] });
  } else {
    c = colord(color);
  }

  // Ensure valid color, fallback to default blue if invalid
  if (!c.isValid()) {
    return colord(DEFAULT_ACCENT_COLOR);
  }
  return c;
}

function ensureSaturation(c: Colord): Colord {
  const s = c.toHsl().s;
  if (s < MIN_SATURATION_FOR_HIGH_BOOST) {
    return c.saturate(HIGH_SATURATION_BOOST);
  } else if (s < MIN_SATURATION_FOR_LOW_BOOST) {
    return c.saturate(LOW_SATURATION_BOOST);
  }
  return c;
}

function adjustLightness(c: Colord): Colord {
  const l = c.toHsl().l;
  if (l < TARGET_MIN_LIGHTNESS) {
    // Lift to at least TARGET_MIN_LIGHTNESS
    return c.lighten((TARGET_MIN_LIGHTNESS - l) / 100);
  } else if (l > TARGET_MAX_LIGHTNESS) {
    // Dim to at most TARGET_MAX_LIGHTNESS
    return c.darken((l - TARGET_MAX_LIGHTNESS) / 100);
  }
  return c;
}

function generateColorResult(c: Colord): ColorResult {
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

/**
 * Adjusts the given color to be suitable for use as an accent color in a dark theme.
 * Ensures sufficient saturation and appropriate lightness.
 * @param color Hex string or RGB object/array
 */
export function adjustAccentColor(color: ColorInput): ColorResult {
  try {
    const parsed = parseColor(color);
    const saturated = ensureSaturation(parsed);
    const lightened = adjustLightness(saturated);
    return generateColorResult(lightened);
  } catch (error) {
    logger.error("Failed to adjust accent color:", error);
    return generateColorResult(
      adjustLightness(ensureSaturation(colord(DEFAULT_ACCENT_COLOR))),
    );
  }
}
