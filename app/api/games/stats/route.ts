import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameType = searchParams.get("gameType");

    if (gameType) {
      return NextResponse.json(await statsForType(gameType));
    }

    const types = ["game24", "sudoku", "idiom", "poem", "words"];
    const all: Record<string, unknown> = {};
    for (const t of types) {
      all[t] = await statsForType(t);
    }
    return NextResponse.json(all);
  } catch (err) {
    console.error("[games/stats GET]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

async function statsForType(gameType: string) {
  const sessions = await prisma.gameSession.findMany({
    where: { gameType, endedAt: { not: null } },
    select: { score: true, endedAt: true },
    orderBy: { endedAt: "desc" },
    take: 200,
  });

  if (sessions.length === 0) {
    return { totalSessions: 0, bestScore: 0, avgScore: 0, last30Days: [] };
  }

  const totalSessions = sessions.length;
  const scores = sessions.map((s) => s.score);
  const bestScore = Math.max(...scores);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalSessions);

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const last30Days = sessions
    .filter((s) => s.endedAt && s.endedAt >= cutoff)
    .map((s) => ({
      date: s.endedAt!.toISOString().slice(0, 10),
      score: s.score,
    }));

  return { totalSessions, bestScore, avgScore, last30Days };
}
