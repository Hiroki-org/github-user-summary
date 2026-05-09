import type { CardBlockId, CardDisplayOptions } from "@/lib/types";

export const MAIN_BLOCKS: { id: CardBlockId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "contributions", label: "Contributions" },
  { id: "heatmap", label: "Activity Heatmap" },
  { id: "interests", label: "Interests" },
  { id: "topRepos", label: "Popular Repos" },
  { id: "skills", label: "Skills" },
];

export const DETAIL_OPTIONS: { key: keyof CardDisplayOptions; label: string }[] = [
  { key: "showAvatar", label: "Avatar" },
  { key: "showBio", label: "Bio" },
  { key: "showStats", label: "Stats" },
  { key: "showLocation", label: "Location" },
  { key: "showJoinedDate", label: "Joined Date" },
  { key: "showTopics", label: "Topics" },
  { key: "showLanguage", label: "Languages" },
];
