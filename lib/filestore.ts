import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

const DIRS = {
  articles: path.join(DATA_DIR, "articles"),
  plans: path.join(DATA_DIR, "plans"),
  exams: path.join(DATA_DIR, "exams"),
  progress: path.join(DATA_DIR, "progress"),
  materials: path.join(DATA_DIR, "materials"),
  cases: path.join(DATA_DIR, "cases"),
  "hs-materials":     path.join(DATA_DIR, "hs-materials"),
  "school-materials": path.join(DATA_DIR, "school-materials"),
  "hero-stories":     path.join(DATA_DIR, "hero-stories"),
  "hero-portraits":   path.join(DATA_DIR, "hero-portraits"),
} as const;

export const HS_WRONG_ANSWERS_DIR     = path.join(DATA_DIR, "hs-wrong-answers");
export const SCHOOL_WRONG_ANSWERS_DIR = path.join(DATA_DIR, "school-wrong-answers");

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

export async function writeMarkdown(
  category: StoreDir,
  id: string,
  content: string
): Promise<string> {
  await ensureDir(DIRS[category]);
  const filePath = path.join(DIRS[category], `${id}.md`);
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

export async function readMarkdown(filePath: string): Promise<string> {
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

export async function writeBinary(
  category: StoreDir,
  id: string,
  ext: string,
  data: Buffer
): Promise<string> {
  await ensureDir(DIRS[category]);
  const filePath = path.join(DIRS[category], `${id}.${ext}`);
  await fs.writeFile(filePath, data);
  return filePath;
}

export async function readBinaryAsBase64(filePath: string): Promise<string | null> {
  try {
    const buf = await fs.readFile(filePath);
    return buf.toString("base64");
  } catch {
    return null;
  }
}
