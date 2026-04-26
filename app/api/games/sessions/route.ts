import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { GameType, Difficulty } from "@/lib/games/shared";

const VALID_TYPES: GameType[] = ["game24", "sudoku", "idiom", "poem", "words"];
const VALID_DIFF: Difficulty[] = ["easy", "medium", "hard"];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { gameType?: string; difficulty?: string };
    if (!body.gameType || !VALID_TYPES.includes(body.gameType as GameType)) {
      return NextResponse.json({ error: "invalid gameType" }, { status: 400 });
    }
    const difficulty =
      body.difficulty && VALID_DIFF.includes(body.difficulty as Difficulty)
        ? (body.difficulty as Difficulty)
        : null;

    const session = await prisma.gameSession.create({
      data: { gameType: body.gameType, difficulty },
    });

    return NextResponse.json({
      id: session.id,
      gameType: session.gameType,
      difficulty: session.difficulty,
      startedAt: session.startedAt.toISOString(),
    });
  } catch (err) {
    console.error("[games/sessions POST]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameType = searchParams.get("gameType");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 100);

    const where = gameType ? { gameType } : undefined;
    const sessions = await prisma.gameSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        gameType: true,
        difficulty: true,
        startedAt: true,
        endedAt: true,
        score: true,
        totalRounds: true,
        correct: true,
        durationMs: true,
      },
    });

    return NextResponse.json({
      items: sessions.map((s) => ({
        ...s,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt ? s.endedAt.toISOString() : null,
      })),
    });
  } catch (err) {
    console.error("[games/sessions GET]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
