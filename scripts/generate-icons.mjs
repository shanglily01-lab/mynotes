// Generate PWA icons from public/icon.svg using sharp.
// Run: node scripts/generate-icons.mjs

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
// sharp may not be a direct dep — try project node_modules and pnpm virtual store
async function loadSharp() {
  const candidates = [
    join(here, "..", "node_modules", "sharp", "lib", "index.js"),
    join(here, "..", "node_modules", ".pnpm", "sharp@0.34.5", "node_modules", "sharp", "lib", "index.js"),
  ];
  for (const p of candidates) {
    try {
      const mod = await import(pathToFileURL(p).href);
      return mod.default ?? mod;
    } catch { /* try next */ }
  }
  throw new Error("sharp not found in node_modules");
}
const sharp = await loadSharp();

const root = join(here, "..");
const svgPath = join(root, "public", "icon.svg");

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32.png", size: 32 },
];

async function main() {
  const svg = await readFile(svgPath);
  for (const t of targets) {
    const out = join(root, "public", t.name);
    const buf = await sharp(svg, { density: 384 })
      .resize(t.size, t.size, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writeFile(out, buf);
    console.log(`wrote ${t.name} (${t.size}x${t.size}, ${buf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
