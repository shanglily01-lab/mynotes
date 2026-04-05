import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/db";
import { extractBooksFromMaterial } from "@/lib/book-extractor";
import { SUBJECTS } from "@/lib/subjects";

// POST /api/books/scan
// Scans all material .txt files, extracts book titles, and seeds BookDownload records (status=pending)
export async function POST() {
  const materialsDir = path.join(process.cwd(), "data", "materials");

  const subjectConfigs = SUBJECTS.filter((s) => s.id !== "news" && s.id !== "english").map((s) => ({
    id: s.id,
    materialPath: path.join(materialsDir, `${s.id}.txt`),
  }));

  let totalInserted = 0;
  const bySubject: Record<string, number> = {};

  for (const { id, materialPath } of subjectConfigs) {
    const books = extractBooksFromMaterial(id, materialPath);

    for (const book of books) {
      const existing = await prisma.bookDownload.findUnique({
        where: { subjectId_title: { subjectId: book.subjectId, title: book.title } },
      });

      if (!existing) {
        await prisma.bookDownload.create({
          data: {
            subjectId: book.subjectId,
            title: book.title,
            author: book.author || null,
            status: "pending",
          },
        });
        totalInserted++;
        bySubject[id] = (bySubject[id] ?? 0) + 1;
      } else if (book.author && !existing.author) {
        await prisma.bookDownload.update({
          where: { id: existing.id },
          data: { author: book.author },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, totalInserted, bySubject });
}

// GET /api/books/scan — return scan preview without writing to DB
export async function GET() {
  const materialsDir = path.join(process.cwd(), "data", "materials");

  const subjectConfigs = SUBJECTS.filter((s) => s.id !== "news" && s.id !== "english").map((s) => ({
    id: s.id,
    name: s.name,
    materialPath: path.join(materialsDir, `${s.id}.txt`),
  }));

  const preview: Record<string, string[]> = {};
  for (const { id, materialPath } of subjectConfigs) {
    const books = extractBooksFromMaterial(id, materialPath);
    preview[id] = books.map((b) => `${b.title}${b.author ? ` — ${b.author}` : ""}`);
  }

  return NextResponse.json({ preview });
}
