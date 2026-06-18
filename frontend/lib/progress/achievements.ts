/** Static achievement catalog. Unlocks live in xp_events (type='achievement'). */
export const ACHIEVEMENTS = [
  { key: "first_analysis", name: "First Steps",     xp: 25,  hint: "Save your first analysis" },
  { key: "ten_analyses",   name: "Getting Warm",    xp: 50,  hint: "Save 10 analyses" },
  { key: "streak_7",       name: "Consistent",      xp: 75,  hint: "7-day streak" },
  { key: "all_languages",  name: "Polyglot",        xp: 100, hint: "Analyze in all 7 languages" },
  { key: "found_factorial",name: "Here Be Dragons", xp: 100, hint: "Analyze an O(n!) algorithm" },
] as const;

export type AchievementKey = (typeof ACHIEVEMENTS)[number]["key"];
export type Achievement = (typeof ACHIEVEMENTS)[number];
