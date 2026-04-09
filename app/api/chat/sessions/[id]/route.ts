import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/chat/sessions/[id] — get session with all messages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await prisma.chatSession.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ session });
}

// DELETE /api/chat/sessions/[id] — delete session (messages cascade)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.chatSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
