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

// PATCH /api/chat/sessions/[id] — update session title
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { title?: string };
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : null;
  const session = await prisma.chatSession.update({
    where: { id },
    data: { title: title || null },
  });
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
