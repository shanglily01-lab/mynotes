import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWeekStart, SUBJECTS } from "@/lib/subjects";
import { generateEvaluation } from "@/lib/claude";
import { readText, writeText } from "@/lib/filestore";

interface AnswerPayload {
  examId: string;
  answers: { questionId: string; answer: string }[];
}

export async function POST(req: NextRequest) {
  const { examId, answers } = (await req.json()) as AnswerPayload;

  if (!examId || !Array.isArray(answers)) {
    return NextResponse.json({ ok: false, error: "Invalid params" }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: true },
  });

  if (!exam) {
    return NextResponse.json({ ok: false, error: "Exam not found" }, { status: 404 });
  }

  const wrongQuestions: { subject: string; question: string; explain: string }[] = [];
  const subjectScores: Record<string, { correct: number; total: number }> = {};

  for (const q of exam.questions) {
    const userAns = answers.find((a) => a.questionId === q.id);
    if (!userAns) continue;

    const correct = userAns.answer === q.answer;

    await prisma.userAnswer.upsert({
      where: { questionId: q.id },
      create: { questionId: q.id, answer: userAns.answer, correct },
      update: { answer: userAns.answer, correct },
    });

    if (!subjectScores[q.subject]) {
      subjectScores[q.subject] = { correct: 0, total: 0 };
    }
    subjectScores[q.subject].total++;
    if (correct) {
      subjectScores[q.subject].correct++;
    } else {
      const raw = await readText(q.contentPath);
      let question = "";
      let explain = "";
      try {
        const parsed = JSON.parse(raw) as { question: string; explain: string };
        question = parsed.question;
        explain = parsed.explain;
      } catch {
        question = raw;
      }
      wrongQuestions.push({ subject: q.subject, question, explain });
    }
  }

  const evaluations = await generateEvaluation(wrongQuestions);

  const weekStart = getWeekStart();
  for (const subject of SUBJECTS) {
    const score = subjectScores[subject.name];
    if (!score) continue;

    const evalText = evaluations[subject.name] ?? "";
    const fileId = `${subject.id}-${weekStart.toISOString().slice(0, 10)}`;
    const evaluationPath = evalText
      ? await writeText("progress", fileId, evalText)
      : null;

    await prisma.progress.upsert({
      where: { subjectId_weekStart: { subjectId: subject.id, weekStart } },
      create: {
        subjectId: subject.id,
        weekStart,
        score: score.correct,
        totalQ: score.total,
        evaluationPath,
      },
      update: {
        score: score.correct,
        totalQ: score.total,
        evaluationPath,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    scores: subjectScores,
    evaluations,
  });
}
