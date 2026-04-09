import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/chat/sessions — list sessions, newest first
export async function GET() {
  const sessions = await prisma.chatSession.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
  return NextResponse.json({ sessions });
}

// POST /api/chat/sessions — create a new session
export async function POST(req: NextRequest) {
  const { title } = (await req.json()) as { title?: string };
  const session = await prisma.chatSession.create({
    data: { title: title ?? null },
  });
  return NextResponse.json({ session });
}
