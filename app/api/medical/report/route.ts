import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env["google-key"] ?? "");

const TYPE_LABELS: Record<string, string> = {
  checkup:      "体检报告",
  lab:          "化验单",
  imaging:      "影像报告",
  prescription: "处方单",
  other:        "其他病历",
};

const SYSTEM_PROMPT = `你是一位专业的健康管理顾问。以下是用户按时间顺序排列的医疗记录及各份文件的AI分析摘要：

{RECORDS}

请根据以上信息生成一份完整的健康管理报告，包含：

## 1. 健康状况总体评估
综合所有记录，评估目前健康总体水平。

## 2. 关键指标趋势分析
识别各项可追踪的指标（血压、血糖、血脂、体重等），分析其历史变化趋势，标明改善或需警惕的项目。

## 3. 重点健康问题
列出需要重点关注的健康问题，按优先级排序。

## 4. 改善建议
针对发现的问题，给出具体的生活方式、饮食、运动等方面的调整建议。

## 5. 后续随访计划
建议需要复查的项目及时间节点。

请用结构化的 Markdown 格式输出，语言通俗易懂，重要数据或异常值请用加粗标出。
注意：本报告仅供参考，不构成医疗诊断，如有健康问题请咨询医生。`;

export async function POST() {
  const records = await prisma.medicalRecord.findMany({
    where: { aiSummary: { not: null } },
    orderBy: { recordDate: "asc" },
  });

  if (records.length === 0) {
    return NextResponse.json(
      { error: "暂无已分析的记录，请先上传并 AI 分析医疗文件" },
      { status: 400 }
    );
  }

  const recordsText = records
    .map((r) => {
      const date = new Date(r.recordDate).toISOString().slice(0, 10);
      const typeLabel = TYPE_LABELS[r.type] ?? r.type;
      return `### ${date} — ${typeLabel}：${r.title}\n${r.aiSummary}`;
    })
    .join("\n\n---\n\n");

  const prompt = SYSTEM_PROMPT.replace("{RECORDS}", recordsText);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { maxOutputTokens: 8192 },
  });

  const result = await model.generateContent(prompt);
  const report = result.response.text();

  return NextResponse.json({ report, recordCount: records.length });
}
