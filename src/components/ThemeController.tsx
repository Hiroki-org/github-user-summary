"use client";

import { useThemeColor } from "@/hooks/useThemeColor";

type Props = {
  avatarUrl?: string;
  topLanguageColor?: string;
};

export default function ThemeController({ avatarUrl, topLanguageColor }: Props) {
  useThemeColor({ avatarUrl, topLanguageColor });
  return null;
}
