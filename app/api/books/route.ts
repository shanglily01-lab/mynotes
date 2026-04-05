import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/books?subjectId=psychology
export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get("subjectId") ?? undefined;

  const books = await prisma.bookDownload.findMany({
    where: subjectId ? { subjectId } : undefined,
    orderBy: [{ subjectId: "asc" }, { title: "asc" }],
  });

  return NextResponse.json({ books });
}
