import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { writeBinary, readBinaryAsBase64 } from "@/lib/filestore";

export const maxDuration = 60;

const PORTRAIT_STYLES = [
  {
    label: "史诗全身",
    suffix: "epic full body pose, Warcraft III The Frozen Throne official splash art style, Blizzard Entertainment 2003 RTS game character art, detailed fantasy armor with glowing runes, dramatic cinematic lighting, ancient Northrend stone environment",
  },
  {
    label: "英雄特写",
    suffix: "close-up face portrait, Warcraft III The Frozen Throne hero portrait style, Blizzard concept art, intense heroic expression, dark atmospheric background with icy blue particle effects, ultra detailed features, dramatic rim lighting",
  },
  {
    label: "战斗英姿",
    suffix: "dynamic battle action pose, Warcraft III The Frozen Throne loading screen art style, using signature ability, glowing magical energy, Northrend frozen tundra battlefield background, Blizzard RTS game art 2003",
  },
  {
    label: "沉思时刻",
    suffix: "standing alone in contemplation, Warcraft III The Frozen Throne cinematic art style, melancholic noble atmosphere, soft moonlight over icy Northrend landscape, Blizzard Entertainment painterly style, emotional depth",
  },
  {
    label: "暗黑氛围",
    suffix: "dark moody portrait, Warcraft III The Frozen Throne undead aesthetic, deep dramatic shadows, glowing fel or frost energy, ominous frozen stormy sky, Icecrown Citadel atmosphere, Blizzard dark fantasy art",
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

  const prompt = `Warcraft III The Frozen Throne official game art illustration of ${heroDesc}. ${style.suffix}${regenMod}. Blizzard Entertainment art style, 2003 RTS game aesthetic. No text, no watermark, no UI elements, ultra high quality digital painting.`;

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });

  const baseURL = process.env["OPENAI_API_URL"]
    ? process.env["OPENAI_API_URL"].replace(/\/chat\/completions$/, "")
    : undefined;

  const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

  let b64Image: string;
  try {
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt,
      size: "512x512",
      n: 1,
      response_format: "b64_json",
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("未返回图像数据");
    b64Image = b64;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[portrait] dall-e-2 error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const buf = Buffer.from(b64Image, "base64");

  const fileId = `${heroId}-${styleIndex}`;
  const filePath = await writeBinary("hero-portraits", fileId, "png", buf);

  await prisma.heroPortrait.upsert({
    where: { heroId_styleIndex: { heroId, styleIndex } },
    create: { heroId, styleIndex, filePath, version: nextVersion },
    update: { filePath, version: nextVersion },
  });

  const imageSrc = `data:image/png;base64,${b64Image}`;
  return NextResponse.json({ imageSrc, label: style.label, version: nextVersion });
}
