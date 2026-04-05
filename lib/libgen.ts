import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { HttpsProxyAgent } from "https-proxy-agent";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use proxy from env if set, otherwise plain HTTPS agent ignoring bad certs
const proxyUrl = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY ?? "";
const httpsAgent = proxyUrl
  ? new HttpsProxyAgent(proxyUrl, { rejectUnauthorized: false })
  : new https.Agent({ rejectUnauthorized: false });

console.log(`[libgen] proxy: ${proxyUrl || "none"}`);

const SEARCH_MIRRORS: Array<{ base: string; path: string }> = [
  { base: "https://libgen.li", path: "/index.php" },
  { base: "https://libgen.rs", path: "/search.php" },
  { base: "https://libgen.is", path: "/search.php" },
  { base: "https://libgen.st", path: "/search.php" },
];

const DOWNLOAD_MIRRORS = [
  "https://libgen.li/get.php?md5=",
  "https://libgen.rs/get.php?md5=",
  "https://libgen.is/get.php?md5=",
  "https://libgen.st/get.php?md5=",
];

export interface LibgenResult {
  id: string;
  title: string;
  author: string;
  md5: string;
  extension: string;
  year: string;
}

// Translate a Chinese book title/author to English using Gemini
async function toEnglish(title: string, author: string): Promise<{ title: string; author: string }> {
  // If already mostly ASCII, skip translation
  if (/^[\x00-\x7F\s·.，,]+$/.test(title)) return { title, author };

  try {
    const genAI = new GoogleGenerativeAI(process.env["google-key"] ?? "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Translate this book title and author name to English. Reply with JSON only: {"title":"...","author":"..."}
Title: ${title}
Author: ${author}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text) as { title: string; author: string };
    console.log(`[libgen] translated: "${title}" -> "${parsed.title}"`);
    return parsed;
  } catch (e) {
    console.log(`[libgen] translation failed:`, e instanceof Error ? e.message : e);
    return { title, author };
  }
}

function makeRequest(url: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const proto = isHttps ? https : http;
    const options: https.RequestOptions = {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      ...(isHttps ? { agent: httpsAgent } : {}),
    };

    const req = proto.get(url, options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        makeRequest(loc, timeoutMs).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    });

    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error(`timeout: ${url}`)); });
    req.on("error", reject);
  });
}

function downloadFileToDisk(url: string, destPath: string, timeoutMs = 180000): Promise<void> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const proto = isHttps ? https : http;
    const options: https.RequestOptions = {
      headers: { "User-Agent": "Mozilla/5.0" },
      ...(isHttps ? { agent: httpsAgent } : {}),
    };

    const req = proto.get(url, options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        req.destroy();
        const loc = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        downloadFileToDisk(loc, destPath, timeoutMs).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode ?? "?"}`));
        return;
      }
      const ct = res.headers["content-type"] ?? "";
      if (ct.includes("text/html")) {
        reject(new Error("got HTML instead of file"));
        return;
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
      file.on("error", (e) => { fs.unlink(destPath, () => undefined); reject(e); });
    });

    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error("download timeout")); });
    req.on("error", reject);
  });
}

// Strip edition/volume info to improve search hit rate
function cleanSearchTitle(title: string): string {
  return title
    .replace(/\(?\d+(?:st|nd|rd|th)?\s*(?:edition|ed\.?|版)\)?/gi, "")
    .replace(/\(?\d+\s*vols?\)?/gi, "")
    .replace(/\(?vol\.?\s*\d+\)?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseResultsFromHtml(html: string): LibgenResult[] {
  const $ = cheerio.load(html);
  const results: LibgenResult[] = [];

  // Strategy 1: extract md5 directly from links like href="get.php?md5=..." or "/ads.php?md5=..."
  const md5Pattern = /[?&]md5=([a-f0-9]{32})/i;

  const tableSelectors = ["table.c", "table#tablelibgen", "table"];
  for (const sel of tableSelectors) {
    const rows = $(sel).first().find("tr");
    if (rows.length < 2) continue;

    rows.each((i, row) => {
      if (i === 0) return; // skip header
      const cells = $(row).find("td");
      if (cells.length < 4) return;

      // Find md5 from any link in this row
      let md5 = "";
      $(row).find("a[href]").each((_, a) => {
        const href = $(a).attr("href") ?? "";
        const m = href.match(md5Pattern);
        if (m?.[1]) { md5 = m[1].toLowerCase(); return false; }
      });
      if (!md5) return;

      // Extension: look for PDF/EPUB/DJVU text in cells
      let extension = "";
      cells.each((_, td) => {
        const t = $(td).text().trim().toLowerCase();
        if (["pdf", "epub", "djvu"].includes(t)) { extension = t; return false; }
      });
      if (!extension) return;

      // Title from second or third cell link
      const title = $(row).find("td:nth-child(3) a").first().text().trim()
        || $(row).find("td:nth-child(2) a").first().text().trim()
        || "";

      // Author
      const author = $(row).find("td:nth-child(2)").text().trim()
        || $(row).find("td:nth-child(4)").text().trim()
        || "";

      // Year: cell with 4 digits
      let year = "";
      cells.each((_, td) => {
        const t = $(td).text().trim();
        if (/^\d{4}$/.test(t)) { year = t; return false; }
      });

      results.push({ id: "", title, author, md5, extension, year });
    });

    if (results.length > 0) break;
  }

  // Strategy 2: regex fallback — find all md5 links in page
  if (results.length === 0) {
    const seen = new Set<string>();
    const matches = html.matchAll(/(?:get|ads)\.php\?md5=([a-f0-9]{32})/gi);
    for (const m of matches) {
      const md5 = m[1]!.toLowerCase();
      if (seen.has(md5)) continue;
      seen.add(md5);
      // Guess extension from nearby context
      const idx = m.index ?? 0;
      const ctx = html.slice(Math.max(0, idx - 200), idx + 200).toLowerCase();
      const ext = ["pdf", "epub", "djvu"].find((e) => ctx.includes(e)) ?? "pdf";
      results.push({ id: "", title: "", author: "", md5, extension: ext, year: "" });
    }
  }

  return results;
}

async function searchOnMirror(
  mirror: { base: string; path: string },
  query: string
): Promise<{ html: string; mirror: string } | null> {
  const url = `${mirror.base}${mirror.path}?req=${encodeURIComponent(query)}&res=10&view=simple&phrase=1&column=title`;
  try {
    const html = await makeRequest(url, 15000);
    if (html.includes("404 Not Found")) return null;
    return { html, mirror: mirror.base };
  } catch (e) {
    console.log(`[libgen] ${mirror.base} failed: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

export async function searchLibgen(title: string, author?: string): Promise<LibgenResult[]> {
  const eng = await toEnglish(title, author ?? "");
  const cleanTitle = cleanSearchTitle(eng.title);

  // Try progressively simpler queries until we get results
  const queries = [
    `${cleanTitle} ${eng.author}`.trim(),
    cleanTitle,
    // First word(s) of title only, in case full title doesn't match
    cleanTitle.split(" ").slice(0, 4).join(" "),
  ];

  for (const query of queries) {
    if (!query || query.length < 3) continue;
    console.log(`[libgen] searching: "${query}"`);

    let result: { html: string; mirror: string } | null = null;
    for (const mirror of SEARCH_MIRRORS) {
      result = await searchOnMirror(mirror, query);
      if (result) { console.log(`[libgen] search OK via ${mirror}`); break; }
    }
    if (!result) continue;

    const books = parseResultsFromHtml(result.html);
    console.log(`[libgen] parsed ${books.length} results from ${result.mirror}`);
    if (books.length > 0) return books.slice(0, 5);
  }

  throw new Error("not found on LibGen");
}

// Extract actual file URL from an intermediate HTML download page
function extractDownloadUrl(html: string, pageUrl: string): string | null {
  const $ = cheerio.load(html);
  const base = new URL(pageUrl).origin;

  const resolve = (href: string) =>
    href.startsWith("http") ? href : `${base}/${href.replace(/^\//, "")}`;

  // 1. get.php with key= param (libgen.li, libgen.rs style)
  const keyLink = $("a[href*='key=']").first().attr("href");
  if (keyLink) return resolve(keyLink);

  // 2. #download block (library.lol style)
  const dlLink = $("#download a").first().attr("href");
  if (dlLink && !dlLink.includes("search")) return resolve(dlLink);

  // 3. Any link to cloudflare/ipfs CDN
  for (const cdn of ["cloudflare", "ipfs", "cdn", "gateway"]) {
    const a = $(`a[href*='${cdn}']`).first().attr("href");
    if (a) return resolve(a);
  }

  // 4. Direct file extension links
  for (const ext of ["pdf", "epub", "djvu"]) {
    const a = $(`a[href$='.${ext}']`).first().attr("href");
    if (a) return resolve(a);
  }

  // 5. Any non-trivial href that isn't navigation
  let found: string | null = null;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (
      href.startsWith("#") ||
      href.includes("search.php") ||
      href.includes("index.php") ||
      href === "/"
    ) return;
    if (href.includes("md5=") && !href.includes("key=")) return; // same page
    if (href.length > 10) { found = resolve(href); return false; }
  });
  if (found) return found;

  // 6. Regex: any URL ending in a file extension
  const m = html.match(/href=["'](https?:\/\/[^"']{10,}\.(pdf|epub|djvu)[^"']*)/i);
  if (m?.[1]) return m[1];

  return null;
}

async function tryDownloadFromPage(pageUrl: string, destPath: string): Promise<void> {
  const html = await makeRequest(pageUrl, 15000);
  const $ = cheerio.load(html);

  // If content-type was already a file (redirect happened), we'd have downloaded it
  // This path means we got HTML - extract the real link
  const downloadUrl = extractDownloadUrl(html, pageUrl);
  if (!downloadUrl) {
    const title = $("title").text().trim();
    const snippet = html.slice(0, 400).replace(/\s+/g, " ");
    console.log(`[libgen] no link found. title="${title}" snippet="${snippet}"`);
    throw new Error(`no download link found on page (title: "${title}")`);
  }

  console.log(`[libgen] found link: ${downloadUrl}`);
  await downloadFileToDisk(downloadUrl, destPath);
}

export async function downloadBook(result: LibgenResult, destDir: string): Promise<string> {
  fs.mkdirSync(destDir, { recursive: true });

  const safeTitle = result.title
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  const filename = `${safeTitle}.${result.extension}`;
  const destPath = path.join(destDir, filename);

  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 10240) {
    console.log(`[libgen] already exists: ${filename}`);
    return destPath;
  }

  const attempts = [
    // get.php returns an HTML intermediate page — parse it for the real link
    { url: `https://libgen.li/get.php?md5=${result.md5}`, direct: false },
    { url: `https://libgen.li/ads.php?md5=${result.md5}`, direct: false },
    { url: `https://library.lol/main/${result.md5}`, direct: false },
    { url: `https://libgen.rs/get.php?md5=${result.md5}`, direct: false },
    { url: `https://libgen.is/get.php?md5=${result.md5}`, direct: false },
  ];

  for (const { url, direct } of attempts) {
    console.log(`[libgen] trying: ${url}`);
    try {
      if (direct) {
        await downloadFileToDisk(url, destPath);
      } else {
        await tryDownloadFromPage(url, destPath);
      }

      const size = fs.existsSync(destPath) ? fs.statSync(destPath).size : 0;
      if (size < 10240) {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        console.log(`[libgen] file too small (${size}B)`);
        continue;
      }
      console.log(`[libgen] done: ${filename} (${(size / 1024 / 1024).toFixed(1)} MB)`);
      return destPath;
    } catch (e) {
      console.log(`[libgen] failed (${url}): ${e instanceof Error ? e.message : e}`);
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    }
  }

  throw new Error(`all download attempts failed for md5=${result.md5}`);
}
