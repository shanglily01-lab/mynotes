import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const book = await prisma.bookDownload.findUnique({ where: { id } });
  if (!book) return NextResponse.json({ error: "not found" }, { status: 404 });

  let content = "";
  if (book.filePath) {
    const absPath = path.join(process.cwd(), book.filePath);
    if (fs.existsSync(absPath)) {
      content = fs.readFileSync(absPath, "utf-8");
    }
  }

  return NextResponse.json({ book, content });
}
