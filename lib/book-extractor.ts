import fs from "fs";

export interface ExtractedBook {
  subjectId: string;
  title: string;    // 书名，不含《》
  author: string;
}

// Match lines like: - **《书名》** — 作者 (year): ...
// 》后可能跟 ** 或其他非破折号字符，再接 — 或 –
const BOOK_PATTERN = /《([^》]+)》[^—–\n]*[—–]+\s*([^：:(\n]+)/g;

export function extractBooksFromMaterial(subjectId: string, filePath: string): ExtractedBook[] {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf-8");
  const books: ExtractedBook[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  BOOK_PATTERN.lastIndex = 0;

  while ((match = BOOK_PATTERN.exec(content)) !== null) {
    const title = match[1]!.trim();
    // Author: strip year in parens and extra punctuation
    const author = (match[2] ?? "")
      .replace(/\s*\(\d{4}\)\s*$/, "")
      .replace(/\s*（\d{4}）\s*$/, "")
      .trim()
      .replace(/[,，、]\s*$/, "");

    if (!title || seen.has(title)) continue;
    seen.add(title);
    books.push({ subjectId, title, author });
  }

  return books;
}

// Extract books from all subject material files
export function extractAllBooks(
  subjects: Array<{ id: string; materialPath: string }>
): ExtractedBook[] {
  return subjects.flatMap(({ id, materialPath }) =>
    extractBooksFromMaterial(id, materialPath)
  );
}
