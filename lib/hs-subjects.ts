export const HS_SUBJECTS = [
  { id: "chinese",   name: "语文",   color: "#8b1a2a" },
  { id: "math",      name: "数学",   color: "#1a3870" },
  { id: "english",   name: "英语",   color: "#1a5c3a" },
  { id: "physics",   name: "物理",   color: "#2d1a70" },
  { id: "chemistry", name: "化学",   color: "#7a4a00" },
  { id: "biology",   name: "生物",   color: "#1a5c20" },
] as const;

export type HSSubjectId = (typeof HS_SUBJECTS)[number]["id"];

export function getHSSubject(id: string) {
  return HS_SUBJECTS.find((s) => s.id === id);
}
