import { useEffect } from "react";
import { FastAverageColor } from "fast-average-color";
import { adjustAccentColor } from "@/lib/color";
import { logger } from "@/lib/logger";

function applyColor(color: string | [number, number, number]) {
  const result = adjustAccentColor(color);
  document.documentElement.style.setProperty("--accent", result.accent);
  document.documentElement.style.setProperty("--accent-rgb", result.accentRgb);
  document.documentElement.style.setProperty("--accent-hover", result.accentHover);
}

function resetColor() {
  document.documentElement.style.removeProperty("--accent");
  document.documentElement.style.removeProperty("--accent-rgb");
  document.documentElement.style.removeProperty("--accent-hover");
}

type UseThemeColorOptions = {
  avatarUrl?: string;
  topLanguageColor?: string;
};

export function useThemeColor({ avatarUrl, topLanguageColor }: UseThemeColorOptions) {
  useEffect(() => {
    // 1. Apply top language color immediately as a fallback/initial state
    if (topLanguageColor) {
      applyColor(topLanguageColor);
    }

    const fac = new FastAverageColor();
    let isMounted = true;

    // 2. Extract color from avatar asynchronously
    if (avatarUrl) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = avatarUrl;

      // Use getColorAsync to extract color
      fac.getColorAsync(img, {
        algorithm: 'dominant', // 'dominant' or 'simple' (average)
      })
      .then((color) => {
        if (isMounted) {
          // color.value is [r, g, b, a]
          applyColor(color.value.slice(0, 3) as [number, number, number]);
        }
      })
      .catch((e) => {
        logger.warn(
          "Failed to extract color from avatar, keeping fallback color. This may be expected if the component unmounted.",
          e,
        );
      });
    }

    // Cleanup: Reset to default theme colors on unmount
    return () => {
      isMounted = false;
      fac.destroy();
      resetColor();
    };
  }, [avatarUrl, topLanguageColor]);
}
