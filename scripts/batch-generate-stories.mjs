// 批量预生成所有英雄故事，已存在的跳过
// 用法：node scripts/batch-generate-stories.mjs [BASE_URL]
// 例如：node scripts/batch-generate-stories.mjs http://localhost:3030

const BASE_URL = process.argv[2] ?? "http://localhost:3030";

const HEROES = [
  { id: "arthas",    name: "阿尔萨斯",   race: "人族联盟" },
  { id: "jaina",     name: "吉安娜",     race: "人族联盟" },
  { id: "uther",     name: "乌瑟尔",     race: "人族联盟" },
  { id: "muradin",   name: "穆拉丁",     race: "人族联盟" },
  { id: "illidan",   name: "伊利丹",     race: "暗夜精灵" },
  { id: "tyrande",   name: "泰兰德",     race: "暗夜精灵" },
  { id: "malfurion", name: "马法里昂",   race: "暗夜精灵" },
  { id: "maiev",     name: "玛薇",       race: "暗夜精灵" },
  { id: "thrall",    name: "萨尔",       race: "兽人部落" },
  { id: "grom",      name: "格罗玛什",   race: "兽人部落" },
  { id: "cairne",    name: "卡因",       race: "兽人部落" },
  { id: "rexxar",    name: "雷克萨",     race: "兽人部落" },
  { id: "arthas_dk", name: "阿尔萨斯",   race: "亡灵天灾" },
  { id: "sylvanas",  name: "希尔瓦娜斯", race: "亡灵天灾" },
  { id: "kelthuzad", name: "科尔苏斯",   race: "亡灵天灾" },
  { id: "anubarak",  name: "安纳祖",     race: "亡灵天灾" },
];

const STORY_TYPES = ["origin", "campaign", "tragedy", "legacy"];

async function exists(heroId, storyType) {
  const res = await fetch(`${BASE_URL}/api/story?heroId=${heroId}&storyType=${storyType}`);
  const data = await res.json();
  return !!data.story;
}

async function generate(hero, storyType) {
  const res = await fetch(`${BASE_URL}/api/story`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heroId: hero.id, heroName: hero.name, raceName: hero.race, storyType }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.version;
}

async function main() {
  const tasks = [];
  for (const hero of HEROES) {
    for (const type of STORY_TYPES) {
      tasks.push({ hero, type });
    }
  }

  console.log(`共 ${tasks.length} 篇故事，检查已有记录...`);

  let skipped = 0;
  let done = 0;
  let failed = 0;

  // 每次并发 3 个，避免 API 过载
  const CONCURRENCY = 3;
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const batch = tasks.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async ({ hero, type }) => {
      const label = `${hero.name}[${type}]`;
      try {
        const alreadyExists = await exists(hero.id, type);
        if (alreadyExists) {
          console.log(`[skip] ${label}`);
          skipped++;
          return;
        }
        console.log(`[gen]  ${label} ...`);
        const version = await generate(hero, type);
        console.log(`[ok]   ${label} v${version}`);
        done++;
      } catch (err) {
        console.error(`[fail] ${label}: ${err.message}`);
        failed++;
      }
    }));
  }

  console.log(`\n完成：生成 ${done}，跳过 ${skipped}，失败 ${failed}`);
}

main().catch(console.error);
