import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "data", "articles");

function isFilePath(s) {
  return s.length < 600 && /[/\\]/.test(s);
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const articles = await prisma.article.findMany({
    select: { id: true, summaryPath: true },
  });

  console.log("total articles:", articles.length);

  let migrated = 0;
  let alreadyPath = 0;
  let empty = 0;

  for (const a of articles) {
    if (!a.summaryPath) {
      empty++;
      continue;
    }
    if (isFilePath(a.summaryPath)) {
      alreadyPath++;
      continue;
    }
    // It's text — write to file
    const filePath = path.join(DATA_DIR, a.id + ".txt");
    await fs.writeFile(filePath, a.summaryPath, "utf-8");
    await prisma.article.update({
      where: { id: a.id },
      data: { summaryPath: filePath },
    });
    migrated++;
  }

  console.log("migrated:", migrated, "already-path:", alreadyPath, "empty:", empty);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
