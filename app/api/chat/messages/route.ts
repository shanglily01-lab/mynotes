import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/chat/messages — save one or more messages to a session
export async function POST(req: NextRequest) {
  const { sessionId, messages } = (await req.json()) as {
    sessionId: string;
    messages: { role: string; content: string }[];
  };

  await prisma.chatMessage.createMany({
    data: messages.map((m) => ({
      sessionId,
      role: m.role,
      content: m.content,
    })),
  });

  // Update session updatedAt
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
