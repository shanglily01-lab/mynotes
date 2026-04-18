export const MIDDLE_SUBJECTS = [
  { id: "chinese",   name: "语文",       color: "#8b1a2a" },
  { id: "math",      name: "数学",       color: "#1a3870" },
  { id: "english",   name: "英语",       color: "#1a5c3a" },
  { id: "physics",   name: "物理",       color: "#2d1a70" },
  { id: "chemistry", name: "化学",       color: "#7a4a00" },
  { id: "biology",   name: "生物",       color: "#1a5c20" },
  { id: "history",   name: "历史",       color: "#5a3a1a" },
  { id: "geography", name: "地理",       color: "#1a4a5c" },
  { id: "ethics",    name: "道德与法治", color: "#5a2d70" },
] as const;

export type MiddleSubjectId = typeof MIDDLE_SUBJECTS[number]["id"];

export function getMiddleSubject(id: string) {
  return MIDDLE_SUBJECTS.find((s) => s.id === id);
}
