import fs from "fs/promises";
import path from "path";

// IMPORTANT for Next.js 16 NFT (File Tracing):
// All path.join calls below put `process.cwd(), "data"` as literal segments
// in a SINGLE call. This anchors the trace to data/, so NFT does not
// conservatively assume the path could match anywhere in the project root
// (which would otherwise pull 10000+ files into the standalone bundle).

type StoreDir =
  | "articles"
  | "plans"
  | "exams"
  | "progress"
  | "materials"
  | "cases"
  | "hs-materials"
  | "school-materials"
  | "hero-stories"
  | "hero-portraits"
  | "gaokao"
  | "zhongkao";

function dirFor(category: StoreDir): string {
  return path.join(process.cwd(), "data", category);
}

export const HS_WRONG_ANSWERS_DIR     = path.join(process.cwd(), "data", "hs-wrong-answers");
export const SCHOOL_WRONG_ANSWERS_DIR = path.join(process.cwd(), "data", "school-wrong-answers");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeText(
  category: StoreDir,
  id: string,
  content: string
): Promise<string> {
  const dir = dirFor(category);
  await ensureDir(dir);
  const filePath = path.join(process.cwd(), "data", category, `${id}.txt`);
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
  const dir = dirFor(category);
  await ensureDir(dir);
  const filePath = path.join(process.cwd(), "data", category, `${id}.md`);
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
  const dir = dirFor(category);
  await ensureDir(dir);
  const filePath = path.join(process.cwd(), "data", category, `${id}.${ext}`);
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
