import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";
import { writeBinary, readBinaryAsBase64 } from "@/lib/filestore";

export const maxDuration = 60;

const PORTRAIT_STYLES = [
  {
    label: "史诗全身",
    suffix: "epic full body warrior pose, detailed fantasy armor or magical robes, dramatic cinematic lighting, ancient stone environment, Blizzard Entertainment digital painting style, masterpiece",
  },
  {
    label: "英雄特写",
    suffix: "close-up face portrait, intense heroic expression, glowing magical eyes, dark atmospheric background with particle effects, ultra detailed skin and features, dramatic rim lighting",
  },
  {
    label: "战斗英姿",
    suffix: "dynamic battle action pose, using signature ability, glowing magical energy effects, motion blur on weapon, epic chaotic battle background, Warcraft III splash art style",
  },
  {
    label: "沉思时刻",
    suffix: "standing alone in contemplation, melancholic noble atmosphere, soft moonlight or firelight, detailed natural environment, painterly impressionistic style, emotional depth",
  },
  {
    label: "暗黑氛围",
    suffix: "dark moody atmospheric portrait, deep dramatic shadows, glowing mystical energy emanating from body, ominous stormy sky, high contrast chiaroscuro lighting, ominous power",
  },
];

const REGEN_MODIFIERS = [
  "different color palette, warmer tones",
  "close perspective, wider field of view",
  "sunset golden hour lighting",
  "rainy stormy weather atmosphere",
  "moonlit night scene, cool blue tones",
  "ancient ruins background setting",
  "snow and ice environment",
  "fire and ember particles surrounding",
];

const HERO_DESCRIPTIONS: Record<string, string> = {
  arthas:    "Arthas Menethil, human paladin prince of Lordaeron, silver plate armor with blue royal cape, wielding holy hammer, short blonde hair, young determined face",
  jaina:     "Jaina Proudmoore, powerful human mage, long blonde hair with white streak, blue arcane robes with glowing runes, summoning swirling arcane magic",
  uther:     "Uther the Lightbringer, elder paladin knight, ornate golden plate armor, white beard and hair, wielding massive golden warhammer, holy light radiating from armor",
  muradin:   "Muradin Bronzebeard, stout dwarf warrior explorer, braided red-brown beard, runic plate armor, wielding battleaxe, stocky powerful muscular build, determined expression",
  illidan:   "Illidan Stormrage, night elf demon hunter, blindfolded with glowing magical tattoos, green fel energy wings, wielding twin warglaives, purple skin covered in demonic runes",
  tyrande:   "Tyrande Whisperwind, night elf high priestess of the moon, silver ornate armor with crescent moon motifs, flowing silver hair, piercing violet glowing eyes, moonlit bow",
  malfurion: "Malfurion Stormrage, ancient night elf arch-druid, massive antler-like headdress, nature magic vines and leaves swirling around his body, long green hair, gnarled wooden staff",
  maiev:     "Maiev Shadowsong, night elf warden assassin, dark purple sleek armor, crescent blade weapon, stern determined face, shadow energy and darkness swirling around her",
  thrall:    "Thrall great orc warchief shaman, green muscular orc, wearing wolf fur pelt and elemental armor, glowing totem staff, commanding presence, lightning and storm wind swirling",
  grom:      "Grom Hellscream, fel green massive orc blademaster, huge double-bladed axe Gorehowl, demonic glowing red eyes, battle rage fury, burning village environment",
  cairne:    "Cairne Bloodhoof, enormous tauren chieftain, massive bull horns, ceremonial tribal leather and bone armor, earth-shaking totem, calm but immense power and wisdom",
  rexxar:    "Rexxar half-orc beastmaster, rugged wilderness leather gear, twin throwing axes, companion bear Misha at his side, long dark hair, tribal face markings",
  arthas_dk: "Arthas as undead death knight, black unholy plate armor with glowing blue rune engravings, pale grey skin, icy blue glowing eyes, Frostmourne runeblade, frost and shadow energy",
  sylvanas:  "Sylvanas Windrunner undead dark ranger, sleek black armor with purple void energy, long silver-white hair, glowing eerie blue undead eyes, ethereal ghostly bow",
  kelthuzad: "Kel'Thuzad undead lich, skeletal figure in dark flowing robes, glowing blue soul fire eyes, phylactery gem, necromantic blue magical flames, decaying aristocratic elegance",
  anubarak:  "Anub'arak nerubian crypt lord, massive insectoid spider-like body, dark chitinous armored carapace, multiple limbs, undead blue glow, ancient buried ruins environment",
};


// GET: return all saved portraits for a hero
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const heroId = searchParams.get("heroId");
  if (!heroId) return NextResponse.json({ portraits: Array(5).fill(null) });

  const records = await prisma.heroPortrait.findMany({ where: { heroId } });

  const portraits: (string | null)[] = Array(5).fill(null);
  await Promise.all(
    records.map(async (r) => {
      if (r.filePath) {
        const base64 = await readBinaryAsBase64(r.filePath);
        if (base64) portraits[r.styleIndex] = `data:image/png;base64,${base64}`;
      }
    })
  );

  return NextResponse.json({ portraits });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    heroId?: string;
    heroName?: string;
    raceName?: string;
    styleIndex?: number;
  };

  const { heroId, heroName, raceName, styleIndex = 0 } = body;
  if (!heroId || !heroName || !raceName) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const heroDesc =
    HERO_DESCRIPTIONS[heroId] ?? `${heroName}, ${raceName} hero from Warcraft III fantasy game`;
  const style = PORTRAIT_STYLES[styleIndex] ?? PORTRAIT_STYLES[0]!;

  // Get current version for variation modifier
  const existing = await prisma.heroPortrait.findUnique({
    where: { heroId_styleIndex: { heroId, styleIndex } },
  });
  const nextVersion = (existing?.version ?? 0) + 1;
  const regenMod = nextVersion > 1
    ? `, ${REGEN_MODIFIERS[(nextVersion - 2) % REGEN_MODIFIERS.length]}`
    : "";

  const prompt = `Fantasy portrait artwork of ${heroDesc}. ${style.suffix}${regenMod}. No text, no watermark, no UI elements, ultra high quality illustration.`;

  const apiKey = process.env["google-key"];
  if (!apiKey) return NextResponse.json({ error: "google-key not set" }, { status: 500 });

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseModalities: ["IMAGE"] },
  });

  const parts = result.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  const imageBytes = imagePart?.inlineData?.data;
  const mimeType = imagePart?.inlineData?.mimeType ?? "image/png";
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";

  if (!imageBytes) {
    console.error("[portrait] no image bytes returned", JSON.stringify(result).slice(0, 300));
    return NextResponse.json({ error: "未返回图像数据" }, { status: 500 });
  }

  const buf = Buffer.from(imageBytes, "base64");
  const fileId = `${heroId}-${styleIndex}`;
  const filePath = await writeBinary("hero-portraits", fileId, ext, buf);

  await prisma.heroPortrait.upsert({
    where: { heroId_styleIndex: { heroId, styleIndex } },
    create: { heroId, styleIndex, filePath, version: nextVersion },
    update: { filePath, version: nextVersion },
  });

  const imageSrc = `data:${mimeType};base64,${imageBytes}`;
  return NextResponse.json({ imageSrc, label: style.label, version: nextVersion });
}
