import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

const DIRS = {
  articles: path.join(DATA_DIR, "articles"),
  plans: path.join(DATA_DIR, "plans"),
  exams: path.join(DATA_DIR, "exams"),
  progress: path.join(DATA_DIR, "progress"),
  materials: path.join(DATA_DIR, "materials"),
} as const;

type StoreDir = keyof typeof DIRS;

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeText(
  category: StoreDir,
  id: string,
  content: string
): Promise<string> {
  await ensureDir(DIRS[category]);
  const filePath = path.join(DIRS[category], `${id}.txt`);
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

export async function readText(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

export async function deleteText(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore if file doesn't exist
  }
}
