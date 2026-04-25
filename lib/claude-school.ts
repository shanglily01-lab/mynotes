import { GoogleGenerativeAI } from "@google/generative-ai";
import { ask } from "./claude";
import type { HSAnalysisResult } from "./claude";

const MODEL = "gemini-2.5-flash";

function getGenAI(): GoogleGenerativeAI {
  const key = process.env["google-key"];
  if (!key) throw new Error("google-key env var not set");
  return new GoogleGenerativeAI(key);
}

const clean = (s: string) =>
  s.replace(/^```(?:markdown)?\n?/i, "").replace(/\n?```$/i, "").trim();

// Subjects that use LaTeX in each level
const PRIMARY_LATEX = new Set<string>(); // no LaTeX for primary
const MIDDLE_LATEX = new Set(["math", "physics", "chemistry", "biology"]);

// Chapter coverage per subject per level
const PRIMARY_CHAPTERS: Record<string, string> = {
  chinese:  "拼音与识字、阅读理解（记叙文/说明文）、古诗词积累与背诵、习作写作（记叙文/应用文）、口语交际与综合学习",
  math:     "整数四则运算、小数与分数运算、百分数与比、几何图形（平面图形面积/立体图形体积/周长）、统计与概率、解决问题策略",
  english:  "字母与单词拼读、基础句型（be动词/一般现在时/过去时/将来时）、阅读短文理解、简单书面表达、听说训练",
  science:  "生命世界（植物/动物/人体/微生物）、物质世界（物质变化/力与运动/声光热电磁）、地球与宇宙、技术与工程",
  ethics:   "个人成长与家庭生活、学校与社会规则、中华优秀文化与历史、国家认知与公民责任、环境与可持续发展",
};

const MIDDLE_CHAPTERS: Record<string, string> = {
  chinese:   "现代文阅读（记叙文/说明文/议论文）、古诗词鉴赏（中考40篇必背）、文言文阅读与翻译、综合性学习、写作（记叙文/议论文）",
  math:      "有理数与实数、代数式与方程（一次/二次/方程组）、函数（一次/二次/反比例）、几何（全等三角形/相似/圆）、统计与概率",
  english:   "词汇与短语、核心语法（时态/从句/情态动词/非谓语）、阅读理解、书面表达（应用文/话题作文）",
  physics:   "机械运动与力（牛顿定律）、压强与浮力、功和机械能、声学与光学、热学、电路基础（欧姆定律）、电磁学",
  chemistry: "化学基本概念（化学式/方程式/化合价）、空气与氧气、水与氢气、碳及化合物、金属、酸碱盐、化学与生活",
  biology:   "细胞与生命活动、植物（光合/蒸腾）、动物多样性与行为、人体系统（消化/循环/呼吸/神经）、遗传与进化、生态系统",
  history:   "中国古代史（先秦/秦汉/三国/隋唐/宋元/明清）、中国近代史（1840-1949）、中国现代史（1949至今）、世界古代与近现代史",
  geography: "地球与地图、自然地理（气候/地形/水文/自然带）、中国地理（四大地区/省级/人文与自然）、世界地理（大洲大洋/区域）",
  ethics:    "宪法与法律常识、国情教育（改革开放/新时代中国）、道德修养与心理健康、开放视野（文化多样性/国际理解）",
};

// Exam context per subject per level (深圳)
const PRIMARY_EXAM: Record<string, string> = {
  chinese:  "小学语文期末100分：基础知识（字词句30分）、阅读理解（30-40分）、习作写作（30-40分）",
  math:     "小学数学期末100分：计算能力（30-40分）、概念理解（20-30分）、解决问题（30-40分）",
  english:  "小学英语期末100分：听力理解（25分）、词汇语法（25分）、阅读理解（25分）、书面表达（25分）",
  science:  "小学科学期末100分：科学概念理解与应用、科学探究方法、日常科学现象解释",
  ethics:   "小学道德与法治期末100分：知识理解、生活实践应用、品德行为判断",
};

const MIDDLE_EXAM: Record<string, string> = {
  chinese:   "深圳中考语文120分：古诗文默写（18分）、阅读理解（42分，含现代文+文言文+古诗词）、综合性学习（10分）、写作（50分）",
  math:      "深圳中考数学120分：选择题（6×4=24分）、填空题（6×4=24分）、解答题（72分，函数/几何/统计为压轴）",
  english:   "深圳中考英语120分：听说（50分）、语言知识运用（20分）、阅读理解（30分）、写作（20分）",
  physics:   "深圳中考物理75分：选择题（4×3=12分）、填空题（30分）、实验探究（15分）、计算题（18分）",
  chemistry: "深圳中考化学75分：选择题（4×3=12分）、填空题（30分）、实验探究（15分）、计算分析（18分）",
  biology:   "深圳中考生物50分：选择题（20分）、非选择题（30分，遗传/生理/生态为重点）",
  history:   "深圳中考历史50分：选择题（24分）、综合题（26分），近代史中国史为高频考点",
  geography: "深圳中考地理50分：选择题（30分）、综合题（20分），中国地理与自然地理为核心",
  ethics:    "深圳中考道德与法治50分：选择题（20分）、非选择题（30分），宪法/时政/国情为高频",
};

// Advanced focus per subject per level
const PRIMARY_ADV_FOCUS: Record<string, string> = {
  chinese:  "阅读理解深层方法（中心思想提炼/段落结构分析/修辞手法）、写作技巧提升（开头结尾/细节描写）、古诗词理解与赏析方法",
  math:     "计算技巧与速算方法、解题思路培养（画图/列表/找规律）、综合应用题策略、常见错误深度分析",
  english:  "词汇扩展策略与记忆方法、阅读推断与理解技巧、写作逻辑结构与常用表达、语法难点辨析",
  science:  "科学探究方法与实验设计思维、跨学科联系（物理/化学/生物/地理）、科学现象的深层解释、创新思维训练",
  ethics:   "法律知识综合应用、时事热点与课本知识结合、辩证思维与价值判断、考试答题技巧",
};

const MIDDLE_ADV_FOCUS: Record<string, string> = {
  chinese:   "阅读深层分析（作者意图/文本结构/语言风格）、议论文写作论证方法、文言文难句与特殊句式、中考高分答题框架",
  math:      "数学思想方法（数形结合/分类讨论/待定系数/换元）、压轴题分析策略（函数+几何综合）、各章节深度联系",
  english:   "长难句分析、阅读推断题策略、写作高分句型与逻辑架构、语法难点辨析（时态/从句/虚拟语气）",
  physics:   "物理公式本质理解与推导、综合题分析（多物体/多过程）、实验设计逻辑、中考压轴计算题解题技巧",
  chemistry: "化学反应本质（电子得失/有机无机）、推断题解题策略、实验方案设计与评价、计算题技巧",
  biology:   "生命现象分子机制、遗传题概率计算与解题框架、实验对照设计、生态定量分析",
  history:   "历史因果关系分析与时间线梳理、史论结合答题方法、中考材料分析题框架、重大历史事件深度解读",
  geography: "地图判读与综合分析、自然与人文地理联系、区域对比分析方法、中考综合题答题框架",
  ethics:    "时政热点与课本知识结合策略、法律推理与案例分析、中考非选择题答题规范、价值判断与辩证思维",
};

export async function generateSchoolMaterialBasic(
  level: "primary" | "middle",
  subject: string,
  subjectName: string
): Promise<string> {
  const chapters = (level === "primary" ? PRIMARY_CHAPTERS : MIDDLE_CHAPTERS)[subject] ?? subjectName;
  const examCtx = (level === "primary" ? PRIMARY_EXAM : MIDDLE_EXAM)[subject] ?? `${subjectName}考试范围`;
  const latexSet = level === "primary" ? PRIMARY_LATEX : MIDDLE_LATEX;
  const isStem = latexSet.has(subject);
  const levelLabel = level === "primary" ? "小学" : "初中";
  const examLabel = level === "primary" ? "期末考试" : "深圳中考";

  const latexReq = isStem
    ? `- **所有数学公式和符号必须使用 LaTeX 语法**：行内公式用 $...$，独立公式用 $$...$$
  - 分数用 \\frac{}{}，根号用 \\sqrt{}，上标 ^{}，下标 _{}，乘号用 \\times 或 \\cdot`
    : `- 禁止使用 LaTeX 或数学符号语法（$、$$、\\frac 等），只使用纯文字和标准 Markdown`;

  const formulaLine = isStem
    ? `**公式/定理：** 完整写出公式，用 LaTeX 格式`
    : `**核心规则/方法：** 完整表述（纯文字）`;

  const conclusionLine = isStem
    ? `- 结论1（可含行内公式）` : `- 结论1（附简要说明）`;

  const text = await ask(
    `你是一位经验丰富的${levelLabel}${subjectName}教师，请生成《${levelLabel}${subjectName}——基础知识体系》完整 Markdown 文档，语言简洁易懂，适合${levelLabel}生学习。

章节覆盖范围：${chapters}
${examLabel}分值结构：${examCtx}

【要求】
- 按教材章节顺序组织，每个章节覆盖全部核心考点，不遗漏
- 每个知识点包含：核心概念 → 规则/方法 → 重要结论 → 考试考点 → 常见错误
- 【考试考点】是核心要求：必须注明该知识点在考试中的题型、分值权重、近年命题角度
${latexReq}
- 语言适合${levelLabel}生水平，清晰简洁，不要过于复杂
- 只输出 Markdown 正文，不加代码块包裹

【格式模板（每个知识点严格遵守）】

## 章节：[章节名]

### [知识点名称]

**核心概念：** 1-2句话精准定义。

${formulaLine}

**重要结论：**
${conclusionLine}
- 结论2

**考试考点：**
- 题型：常以何种形式考查，分值区间
- 频率：高频/中频/低频
- 命题角度：1-2个典型出题角度

**常见错误：** 1-2个易错点及辨析方法。

---
（每章不少于3个知识点）`,
    14000
  );

  return clean(text);
}

export async function generateSchoolMaterialAdvanced(
  level: "primary" | "middle",
  subject: string,
  subjectName: string
): Promise<string> {
  const chapters = (level === "primary" ? PRIMARY_CHAPTERS : MIDDLE_CHAPTERS)[subject] ?? subjectName;
  const examCtx = (level === "primary" ? PRIMARY_EXAM : MIDDLE_EXAM)[subject] ?? `${subjectName}考试范围`;
  const advFocus = (level === "primary" ? PRIMARY_ADV_FOCUS : MIDDLE_ADV_FOCUS)[subject] ?? `${subjectName}深层理解`;
  const latexSet = level === "primary" ? PRIMARY_LATEX : MIDDLE_LATEX;
  const isStem = latexSet.has(subject);
  const levelLabel = level === "primary" ? "小学" : "初中";
  const examLabel = level === "primary" ? "期末考试" : "深圳中考";

  const latexReq = isStem
    ? `- **所有数学公式和符号必须使用 LaTeX 语法**：行内公式用 $...$，独立公式用 $$...$$
  - 分数用 \\frac{}{}，根号用 \\sqrt{}，上标 ^{}，下标 _{}，向量 \\vec{}，乘号用 \\times`
    : `- 禁止使用 LaTeX 或数学符号语法（$、$$、\\frac 等），只使用纯文字和标准 Markdown`;

  const derivationLine = isStem
    ? `**推导/证明：**（关键推导步骤，用 LaTeX 公式）

$$推导公式$$`
    : `**深层分析：**（深层原因或典型例子说明）`;

  const text = await ask(
    `你是一位资深${levelLabel}${subjectName}教师，请生成《${levelLabel}${subjectName}——进阶深度拓展》Markdown 文档，面向希望深入理解和拿高分的学生。

章节范围：${chapters}
深度拓展重点：${advFocus}
${examLabel}分值结构：${examCtx}

【要求】
- 不重复基础知识，聚焦深层理解和进阶技巧
- 重点：深层原因/规律 → 各章节联系 → 解题进阶技巧 → 考试命题规律与满分策略
${latexReq}
- 语言适合${levelLabel}生水平，深入但清晰
- 只输出 Markdown 正文，不加代码块包裹

【格式模板】

## [专题名]

### [深度主题]

**本质理解：** 深层原因或核心规律。

${derivationLine}

**进阶技巧：**
- 技巧1（难度：中等/较难）
- 技巧2

**综合应用：** 如何在综合题/压轴题中运用，典型场景描述。

**考试命题规律：** 该专题在考试中的出题形式、难度、典型问法，如何拿满分。

**易错深析：** 深层原因分析，如何避免。

---
（覆盖5-8个核心深度专题）`,
    14000
  );

  return clean(text);
}

export async function analyzeSchoolWrongAnswer(
  level: "primary" | "middle",
  subjectName: string,
  imageBase64: string,
  mimeType: string
): Promise<HSAnalysisResult> {
  const levelLabel = level === "primary" ? "小学" : "初中";
  const model = getGenAI().getGenerativeModel({
    model: MODEL,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generationConfig: {
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
    } as any,
  });

  const prompt = `你是一位专业的${levelLabel}${subjectName}老师，请仔细分析图中的错题，诊断学生的薄弱知识点并给出针对性辅导。

请严格按以下 JSON 格式返回，不要其他文字：
{
  "correctAnswer": "正确答案选项（如 A、B、C、D 或具体答案；若为非选择题则写出关键结论）",
  "answerExplanation": "详细解析：逐步说明为什么这个答案是正确的，以及其他选项错在哪里（3-6句，逻辑清晰）",
  "questionSummary": "用一句话概括这道题考查的核心内容",
  "chapter": "所属章节",
  "knowledgePoints": [
    {
      "name": "薄弱知识点名称",
      "weakness": "学生在这个知识点上可能的薄弱之处",
      "level": "核心"
    }
  ],
  "rootCause": "根因分析：详细说明学生答错的深层原因（2-4句）",
  "principles": [
    "与本题直接相关的原理或规则，写出完整表述"
  ],
  "conclusions": [
    "本题涉及的重要结论或解题规律（具体、可直接应用）"
  ],
  "studyPlan": "针对性学习建议：应重点复习哪些内容、推荐做哪类练习（3-5句，实用具体）"
}

要求：
- knowledgePoints 列出1-3个最核心的薄弱点，level 只能是"核心""重点""基础"之一
- principles 列出2-4条完整可用的规则表述
- conclusions 列出2-4条具体可用的结论
- 语言适合${levelLabel}生水平，简洁明了
- 如果图片中看不清题目，基于可辨识的内容尽力分析`;

  const result = await model.generateContent([
    { inlineData: { mimeType, data: imageBase64 } },
    prompt,
  ]);

  const text = result.response.text();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON in response");
    return JSON.parse(jsonMatch[0]) as HSAnalysisResult;
  } catch (err) {
    console.error("analyzeSchoolWrongAnswer parse error:", err, text.slice(0, 200));
    throw err;
  }
}

// ============ 中考专题：仿真 2023-2025 + 2026 预测 ============

const ZHONGKAO_LATEX = new Set(["math", "physics", "chemistry", "biology"]);

const ZHONGKAO_QUESTION_PROFILE: Record<string, string> = {
  chinese:   "1 道现代文阅读小题、1 道古诗鉴赏题、1 道文言文翻译题、1 道语言文字运用题、1 道作文（仅给题目和审题立意提示）",
  math:      "3 道选择题（含 1 道压轴）、1 道填空题、2 道解答题（含 1 道函数综合或几何压轴）",
  english:   "1 篇阅读理解（含 4 题）、1 道完形填空（5 题）、1 道语法填空（5 空）、1 道书面表达题",
  physics:   "2 道选择题、1 道填空题、1 道实验探究、2 道计算题（含 1 道压轴综合题）",
  chemistry: "3 道选择题、1 道工艺流程或实验探究题、1 道推断题、1 道计算题",
  biology:   "3 道选择题、2 道非选择题（含 1 道遗传或生命调节综合）",
  history:   "3 道选择题、1 道材料综合题（覆盖中国史和世界史）",
  geography: "3 道选择题、1 道综合分析题（含中国地理和世界地理）",
  ethics:    "3 道选择题、1 道辨析题、1 道综合探究题（含时政热点）",
};

function zhongkaoLatexReq(subject: string): string {
  const stem = ZHONGKAO_LATEX.has(subject);
  return stem
    ? `- **数学/物理/化学公式必须用 LaTeX**：行内 $...$，独立 $$...$$，分数 \\frac{}{}, 根号 \\sqrt{}, 上下标 ^{}_{}`
    : `- 禁止 LaTeX 语法（$、$$、\\frac 等），只用纯文字`;
}

const cleanZK = (s: string) =>
  s.replace(/^```(?:markdown)?\n?/i, "").replace(/\n?```$/i, "").trim();

// 中考真题仿真
export async function generateZhongkaoReal(
  subject: string,
  subjectName: string
): Promise<string> {
  const examCtx = MIDDLE_EXAM[subject] ?? `${subjectName}中考考查范围`;
  const profile = ZHONGKAO_QUESTION_PROFILE[subject] ?? "5-7 道代表性题目";
  const latexReq = zhongkaoLatexReq(subject);

  const text = await ask(
    `你是一位资深中考命题研究专家，精通近 3 年（2023、2024、2025）深圳与全国主要省市中考的命题规律。
请仿照 2023-2025 年中考${subjectName}的真实命题风格、难度、题型分布，生成一份《${subjectName}中考真题仿真练习卷（节选）》Markdown。

【试卷结构参考】${examCtx}
【本套卷题目构成】${profile}

【严格要求】
- 仿真：每道题的命题角度、设问方式、难度阶梯、综合考点必须高度贴近真实中考
- 风格：题干语言简洁规范，与真题保持一致；不要出现"假设""比方说"这种口语化表达
${latexReq}
- 必须遵守"题目-答案分隔"格式（前端要解析），不要使用其他变体写法

【严格输出格式（每道题严格遵守）】

> **本套卷参照 2023-2025 年中考${subjectName}命题风格仿真生成，可用于初三冲刺训练。**

## 第 1 题（题型，X 分）

题干内容（含图表用文字描述代替）

A. ……
B. ……
C. ……
D. ……

【答案与解析】

**答案：** B

**解析：** 详细分步解析（3-6 句），点明关键知识点和易错处。

---

## 第 2 题（题型，X 分）

……

【答案与解析】

**答案：** ……

**解析：** ……

---

（按上述格式继续，覆盖${profile}的全部题量）

注意：
- 每道题必须以 \`## 第 N 题（题型，X 分）\` 开头
- 每道题答案部分必须以独立一行 \`【答案与解析】\` 起始
- 题与题之间用 \`---\` 分隔
- 不要在文档开头加代码块包裹`,
    14000
  );

  return cleanZK(text);
}

// 中考预测试卷
export async function generateZhongkaoPredict(
  subject: string,
  subjectName: string,
  year: number
): Promise<string> {
  const examCtx = MIDDLE_EXAM[subject] ?? `${subjectName}中考考查范围`;
  const profile = ZHONGKAO_QUESTION_PROFILE[subject] ?? "5-7 道代表性题目";
  const latexReq = zhongkaoLatexReq(subject);

  const text = await ask(
    `你是一位深耕中考命题研究 15 年的${subjectName}权威专家，请预测 ${year} 年中考${subjectName}的命题方向，并生成一份《${year} 年${subjectName}中考预测卷（节选）》Markdown。

【试卷结构参考】${examCtx}
【本套卷题目构成】${profile}
【近 3 年趋势】
- 2023 年：基础题与情景化结合
- 2024 年：跨章节综合题占比上升，注重实际应用
- 2025 年：实验/数据/真实情景题占比继续扩大，强调思维深度

【严格要求】
- 第一部分：先用 200-400 字分析 ${year} 年${subjectName}最可能的命题方向、新增热点、易考章节、需重点防范的题型
- 第二部分：按真实中考标准生成预测题，每道题须配合"为什么这样命题"的简短点评（嵌在解析里）
- 难度匹配中考实际，不要过简或过难
${latexReq}

【严格输出格式（前端要解析）】

# ${year} 年${subjectName}中考预测卷

## 命题趋势分析

（200-400 字趋势分析，包含：今年最可能新增的考查角度、最有可能保留的命题特征、需要重点防范的难点、复习冲刺建议）

---

## 第 1 题（题型，X 分）

题干……

A. ……
B. ……
C. ……
D. ……

【答案与解析】

**答案：** ……

**解析：** 详细解析（包含为什么这样命题的判断依据）

---

## 第 2 题
……

注意：
- 命题趋势分析在所有题目之前，作为整套卷的开篇
- 每道题严格按照 \`## 第 N 题（题型，X 分）\` + \`【答案与解析】\` 格式
- 题与题之间用 \`---\` 分隔
- 不要用代码块包裹`,
    16000
  );

  return cleanZK(text);
}
