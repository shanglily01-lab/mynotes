export type GameType = "game24" | "sudoku" | "idiom" | "poem" | "words";

export type Difficulty = "easy" | "medium" | "hard";

export const GAME_LABELS: Record<GameType, { zh: string; en: string; tagline: string }> = {
  game24:  { zh: "算 24 点",       en: "24 Game",       tagline: "用 4 张牌和加减乘除算出 24" },
  sudoku:  { zh: "数独",           en: "Sudoku",        tagline: "4x4 与 6x6 经典逻辑填数" },
  idiom:   { zh: "语文益智",       en: "Idiom & Poem",  tagline: "成语接龙 / 古诗填空 双模式" },
  poem:    { zh: "古诗填空",       en: "Poem Fill",     tagline: "唐诗宋词关键字补全" },
  words:   { zh: "单词记忆卡",     en: "Word Cards",    tagline: "复习每日英语词汇" },
};

export interface GameSessionDTO {
  id: string;
  gameType: GameType;
  difficulty: Difficulty | null;
  startedAt: string;
  endedAt: string | null;
  score: number;
  totalRounds: number;
  correct: number;
  durationMs: number | null;
}

export interface GameStatsDTO {
  totalSessions: number;
  bestScore: number;
  avgScore: number;
  last30Days: { date: string; score: number }[];
}
