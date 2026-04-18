import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const PORTRAIT_STYLES = [
  {
    label: "史诗全身",
    suffix:
      "epic full body warrior pose, detailed fantasy armor or magical robes, dramatic cinematic lighting, ancient stone environment, Blizzard Entertainment digital painting style, masterpiece",
  },
  {
    label: "英雄特写",
    suffix:
      "close-up face portrait, intense heroic expression, glowing magical eyes, dark atmospheric background with particle effects, ultra detailed skin and features, dramatic rim lighting",
  },
  {
    label: "战斗英姿",
    suffix:
      "dynamic battle action pose, using signature ability, glowing magical energy effects, motion blur on weapon, epic chaotic battle background, Warcraft III splash art style",
  },
  {
    label: "沉思时刻",
    suffix:
      "standing alone in contemplation, melancholic noble atmosphere, soft moonlight or firelight, detailed natural environment, painterly impressionistic style, emotional depth",
  },
  {
    label: "暗黑氛围",
    suffix:
      "dark moody atmospheric portrait, deep dramatic shadows, glowing mystical energy emanating from body, ominous stormy sky, high contrast chiaroscuro lighting, ominous power",
  },
];

const HERO_DESCRIPTIONS: Record<string, string> = {
  arthas:
    "Arthas Menethil, human paladin prince of Lordaeron, silver plate armor with blue royal cape, wielding holy hammer, short blonde hair, young determined face",
  jaina:
    "Jaina Proudmoore, powerful human mage, long blonde hair with white streak, blue arcane robes with glowing runes, summoning swirling arcane magic",
  uther:
    "Uther the Lightbringer, elder paladin knight, ornate golden plate armor, white beard and hair, wielding massive golden warhammer, holy light radiating from armor",
  muradin:
    "Muradin Bronzebeard, stout dwarf warrior explorer, braided red-brown beard, runic plate armor, wielding battleaxe, stocky powerful muscular build, determined expression",
  illidan:
    "Illidan Stormrage, night elf demon hunter, blindfolded with glowing magical tattoos, green fel energy wings, wielding twin warglaives, purple skin covered in demonic runes",
  tyrande:
    "Tyrande Whisperwind, night elf high priestess of the moon, silver ornate armor with crescent moon motifs, flowing silver hair, piercing violet glowing eyes, moonlit bow",
  malfurion:
    "Malfurion Stormrage, ancient night elf arch-druid, massive antler-like headdress, nature magic vines and leaves swirling around his body, long green hair, gnarled wooden staff",
  maiev:
    "Maiev Shadowsong, night elf warden assassin, dark purple sleek armor, crescent blade weapon, stern determined face, shadow energy and darkness swirling around her",
  thrall:
    "Thrall great orc warchief shaman, green muscular orc, wearing wolf fur pelt and elemental armor, glowing totem staff, commanding presence, lightning and storm wind swirling",
  grom:
    "Grom Hellscream, fel green massive orc blademaster, huge double-bladed axe Gorehowl, demonic glowing red eyes, battle rage fury, burning village environment",
  cairne:
    "Cairne Bloodhoof, enormous tauren chieftain, massive bull horns, ceremonial tribal leather and bone armor, earth-shaking totem, calm but immense power and wisdom",
  rexxar:
    "Rexxar half-orc beastmaster, rugged wilderness leather gear, twin throwing axes, companion bear Misha at his side, long dark hair, tribal face markings",
  arthas_dk:
    "Arthas as undead death knight, black unholy plate armor with glowing blue rune engravings, pale grey skin, icy blue glowing eyes, Frostmourne runeblade, frost and shadow energy",
  sylvanas:
    "Sylvanas Windrunner undead dark ranger, sleek black armor with purple void energy, long silver-white hair, glowing eerie blue undead eyes, ethereal ghostly bow",
  kelthuzad:
    "Kel'Thuzad undead lich, skeletal figure in dark flowing robes, glowing blue soul fire eyes, phylactery gem, necromantic blue magical flames, decaying aristocratic elegance",
  anubarak:
    "Anub'arak nerubian crypt lord, massive insectoid spider-like body, dark chitinous armored carapace, multiple limbs, undead blue glow, ancient buried ruins environment",
};

interface ImagenPrediction {
  bytesBase64Encoded?: string;
  mimeType?: string;
}

interface ImagenResponse {
  predictions?: ImagenPrediction[];
  error?: { message?: string };
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

  const prompt = `Fantasy portrait artwork of ${heroDesc}. ${style.suffix}. No text, no watermark, no UI elements, portrait orientation, ultra high quality illustration.`;

  const apiKey = process.env["google-key"] ?? "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: "1:1" },
    }),
  });

  const data = (await res.json()) as ImagenResponse;

  if (!res.ok || data.error) {
    console.error("[portrait] Imagen API error:", data.error);
    return NextResponse.json({ error: data.error?.message ?? "图像生成失败" }, { status: 500 });
  }

  const prediction = data.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) {
    return NextResponse.json({ error: "未返回图像数据" }, { status: 500 });
  }

  return NextResponse.json({
    imageBase64: prediction.bytesBase64Encoded,
    mimeType: prediction.mimeType ?? "image/png",
    label: style.label,
  });
}
