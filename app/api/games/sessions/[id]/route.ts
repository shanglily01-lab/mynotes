import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      score?: number;
      totalRounds?: number;
      correct?: number;
      endedAt?: string | boolean;
      durationMs?: number;
      metadata?: unknown;
    };

    const data: Record<string, unknown> = {};
    if (typeof body.score === "number") data.score = body.score;
    if (typeof body.totalRounds === "number") data.totalRounds = body.totalRounds;
    if (typeof body.correct === "number") data.correct = body.correct;
    if (typeof body.durationMs === "number") data.durationMs = body.durationMs;
    if (body.endedAt) {
      data.endedAt = typeof body.endedAt === "string" ? new Date(body.endedAt) : new Date();
    }
    if (body.metadata !== undefined) {
      data.metadata = typeof body.metadata === "string" ? body.metadata : JSON.stringify(body.metadata);
    }

    const updated = await prisma.gameSession.update({ where: { id }, data });
    return NextResponse.json({
      id: updated.id,
      score: updated.score,
      endedAt: updated.endedAt ? updated.endedAt.toISOString() : null,
    });
  } catch (err) {
    console.error("[games/sessions PATCH]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await prisma.gameSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });

    return NextResponse.json({
      ...session,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
      createdAt: session.createdAt.toISOString(),
      metadata: session.metadata ? safeParse(session.metadata) : null,
    });
  } catch (err) {
    console.error("[games/sessions GET id]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
