// 批量预生成所有英雄画像，已存在的跳过
// 用法：node scripts/batch-generate-portraits.mjs [BASE_URL]
// 例如：node scripts/batch-generate-portraits.mjs http://localhost:3030

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

const STYLE_LABELS = ["史诗全身", "英雄特写", "战斗英姿", "沉思时刻", "暗黑氛围"];

async function getExisting(heroId) {
  const res = await fetch(`${BASE_URL}/api/story/portrait?heroId=${heroId}`);
  const data = await res.json();
  // portraits 是长度5数组，null表示未生成
  return (data.portraits ?? []).map((p) => p !== null);
}

async function generate(hero, styleIndex) {
  const res = await fetch(`${BASE_URL}/api/story/portrait`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      heroId: hero.id,
      heroName: hero.name,
      raceName: hero.race,
      styleIndex,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.version;
}

async function main() {
  console.log(`共 ${HEROES.length * 5} 张画像，检查已有记录...`);

  let skipped = 0;
  let done = 0;
  let failed = 0;

  for (const hero of HEROES) {
    const existing = await getExisting(hero.id);

    // 每个英雄的5张顺序生成（避免并发触发 rate limit）
    for (let i = 0; i < 5; i++) {
      const label = `${hero.name}[${STYLE_LABELS[i]}]`;
      if (existing[i]) {
        console.log(`[skip] ${label}`);
        skipped++;
        continue;
      }
      try {
        console.log(`[gen]  ${label} ...`);
        const version = await generate(hero, i);
        console.log(`[ok]   ${label} v${version}`);
        done++;
      } catch (err) {
        console.error(`[fail] ${label}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\n完成：生成 ${done}，跳过 ${skipped}，失败 ${failed}`);
}

main().catch(console.error);
