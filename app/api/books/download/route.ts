import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBookNote } from "@/lib/claude";
import { SUBJECTS } from "@/lib/subjects";

export const maxDuration = 600;

async function generateOne(bookId: string): Promise<{ done: boolean; error?: string }> {
  const book = await prisma.bookDownload.findUnique({ where: { id: bookId } });
  if (!book) return { done: false, error: "not found" };

  await prisma.bookDownload.update({
    where: { id: bookId },
    data: { status: "downloading", error: null },
  });

  try {
    const subject = SUBJECTS.find((s) => s.id === book.subjectId);
    const subjectName = subject?.name ?? book.subjectId;

    const markdown = await generateBookNote(book.title, book.author ?? "", subjectName);

    await prisma.bookDownload.update({
      where: { id: bookId },
      data: { status: "done", noteContent: markdown, error: null },
    });

    console.log(`[books] generated note for: ${book.title}`);
    return { done: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.bookDownload.update({
      where: { id: bookId },
      data: { status: "failed", error: msg },
    });
    return { done: false, error: msg };
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { id?: string; subjectId?: string; all?: boolean };

  // Single book: always regenerate regardless of current status
  if (body.id) {
    const result = await generateOne(body.id);
    return NextResponse.json({ ok: result.done, done: result.done ? 1 : 0, failed: result.done ? 0 : 1, total: 1 });
  }

  // Batch: only process pending/failed books
  type BookWhere = NonNullable<Parameters<typeof prisma.bookDownload.findMany>[0]>["where"];
  let where: BookWhere = { status: { in: ["pending", "failed"] } };

  if (body.subjectId) {
    where = { subjectId: body.subjectId, status: { in: ["pending", "failed"] } };
  } else if (!body.all) {
    return NextResponse.json({ error: "provide id, subjectId, or all:true" }, { status: 400 });
  }

  const books = await prisma.bookDownload.findMany({ where });
  if (books.length === 0) {
    return NextResponse.json({ ok: true, message: "no books to generate", done: 0, failed: 0 });
  }

  let done = 0;
  let failed = 0;
  for (const book of books) {
    const result = await generateOne(book.id);
    if (result.done) done++;
    else failed++;
  }

  return NextResponse.json({ ok: true, done, failed, total: books.length });
}
