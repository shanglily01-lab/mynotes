import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { writeMarkdown, readMarkdown } from "@/lib/filestore";

export const maxDuration = 120;

const genAI = new GoogleGenerativeAI(process.env["google-key"] ?? "");

const HERO_LORE: Record<string, string> = {
  arthas:    "阿尔萨斯·米奈希尔，洛丹伦王子，圣骑士，后堕落成巫妖王麾下的死亡骑士",
  jaina:     "吉安娜·普罗德摩尔，天才女法师，洛丹伦领主之女，后成为塞拉摩领主",
  uther:     "乌瑟尔·光明使者，银色之手骑士团创始人，最伟大的圣骑士之一",
  muradin:   "穆拉丁·铜须，矮人探险家，托林·铜须之弟，与阿尔萨斯共同前往诺森德",
  illidan:   "伊利丹·怒风，被称为'背叛者'，恶魔猎手先驱，夜精灵与恶魔力量的融合者",
  tyrande:   "泰兰德·耳语风，月之女神月神爱露恩的大祭司，暗夜精灵的精神领袖",
  malfurion: "马法里昂·怒风，德鲁伊先祖，自然力量的守护者，将暗夜精灵从混乱中带领出来",
  maiev:     "玛薇·影歌，暗影猎手，伊利丹的狱卒，执法者与复仇者",
  thrall:    "萨尔，真名戈尔·萨格，兽人族大酋长，元素萨满，在人类囚笼中成长的兽人英雄",
  grom:      "格罗玛什·地狱咆哮，血刃战士首领，曾饮下恶魔之血，后斩杀马诺洛斯完成救赎",
  cairne:    "卡因·血蹄，牛头人酋长，智慧与力量的化身，与萨尔缔结盟约共建卡利姆多",
  rexxar:    "雷克萨，半兽人流浪英雄，与熊莫沙相依为命，守护新部落抵御吉安娜军队",
  arthas_dk: "阿尔萨斯（死亡骑士），沦为巫妖王的骑士，率领亡灵天灾横扫洛丹伦，屠城斯坦索姆",
  sylvanas:  "希尔瓦娜斯·风行者，银月城的游侠将领，被阿尔萨斯杀死后化为幽魂，后成为被遗忘者女王",
  kelthuzad: "科尔苏斯，巫妖王第一使徒，曾为达拉然法师，出卖灵魂换取亡灵力量，建立天灾军团",
  anubarak:  "安纳祖，虫族领主，古老的永恒国度君主，被巫妖王复活为亡灵仆从",
};

const VARIATION_HINTS = [
  "从童年创伤与内心恐惧的角度切入",
  "聚焦于与至亲之人的情感羁绊与决裂",
  "以一场决定命运的孤独之夜为核心",
  "探索英雄内心的矛盾与自我怀疑",
  "从敌人或旁观者的视角审视这位英雄",
  "以英雄生命中最后悔的一个决定为主线",
  "聚焦于荣耀背后不为人知的代价",
  "从信仰崩塌与重建的维度展开叙述",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const heroId = searchParams.get("heroId");
  const storyType = searchParams.get("storyType");
  if (!heroId || !storyType) return NextResponse.json({ story: null });

  const record = await prisma.heroStory.findUnique({
    where: { heroId_storyType: { heroId, storyType } },
  });
  if (!record?.filePath) return NextResponse.json({ story: null, version: 0 });

  const story = await readMarkdown(record.filePath);
  return NextResponse.json({ story: story || null, version: record.version });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    heroId?: string;
    heroName?: string;
    raceName?: string;
    storyType?: string;
  };

  const { heroId, heroName, raceName, storyType = "origin" } = body;
  if (!heroId || !heroName || !raceName) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const lore = HERO_LORE[heroId] ?? `${raceName}的英雄${heroName}`;

  const storyTypeMap: Record<string, string> = {
    origin:   "出身与成长背景，以及走上英雄之路的契机",
    campaign: "在魔兽争霸三：混乱之治和冰封王座战役中的关键时刻与史诗冒险",
    tragedy:  "命运的悲剧与转折，内心挣扎与最终的抉择",
    legacy:   "对整个魔兽世界历史的深远影响与历史地位",
  };

  const focus = storyTypeMap[storyType] ?? storyTypeMap["origin"];

  // Get current version to add variation hint on regeneration
  const existing = await prisma.heroStory.findUnique({
    where: { heroId_storyType: { heroId, storyType } },
  });
  const nextVersion = (existing?.version ?? 0) + 1;
  const variationHint = nextVersion > 1
    ? `\n- 这是第${nextVersion}个版本，请${VARIATION_HINTS[(nextVersion - 2) % VARIATION_HINTS.length]}，风格与结构要与之前版本明显不同`
    : "";

  const prompt = `你是一位擅长魔兽世界故事的中文作家。请为以下英雄撰写一篇完整的中文故事（2500-3000字）。

英雄：${heroName}（${raceName}）
背景：${lore}
故事焦点：${focus}

要求：
- 以第三人称叙事，语言优美、有感染力、富有史诗感
- 详细展开故事情节，有场景描写、对话、内心独白
- 融入魔兽争霸三的经典战役场景与台词氛围
- 涵盖英雄的成长经历、核心性格特征与标志性能力
- 分多个段落，每段有明确的叙事推进
- 结尾要有力量感或深远余韵
- 不要加标题，直接进入正文
- 必须写满2500字以上，不要提前结束${variationHint}`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generationConfig: any = { maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 } };
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig });
    const result = await model.generateContent(prompt);
    const story = result.response.text();

    // Save to file and DB
    const fileId = `${heroId}-${storyType}`;
    const filePath = await writeMarkdown("hero-stories", fileId, story);
    await prisma.heroStory.upsert({
      where: { heroId_storyType: { heroId, storyType } },
      create: { heroId, storyType, filePath, version: nextVersion },
      update: { filePath, version: nextVersion },
    });

    return NextResponse.json({ story, version: nextVersion });
  } catch (err) {
    console.error("[story] AI generation failed:", err);
    return NextResponse.json({ error: "生成失败，请稍后重试" }, { status: 500 });
  }
}
