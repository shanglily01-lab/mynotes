export const PRIMARY_SUBJECTS = [
  { id: "chinese",   name: "语文",       color: "#8b1a2a" },
  { id: "math",      name: "数学",       color: "#1a3870" },
  { id: "english",   name: "英语",       color: "#1a5c3a" },
  { id: "science",   name: "科学",       color: "#2d5a1a" },
  { id: "ethics",    name: "道德与法治", color: "#5a2d70" },
] as const;

export type PrimarySubjectId = typeof PRIMARY_SUBJECTS[number]["id"];

export function getPrimarySubject(id: string) {
  return PRIMARY_SUBJECTS.find((s) => s.id === id);
}
