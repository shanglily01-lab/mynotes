import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const book = await prisma.bookDownload.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ book, content: book.noteContent ?? "" });
}
