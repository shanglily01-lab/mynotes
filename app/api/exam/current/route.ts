import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWeekStart } from "@/lib/subjects";
import { readText } from "@/lib/filestore";

export async function GET() {
  const weekStart = getWeekStart();

  const exam = await prisma.exam.findUnique({
    where: { weekStart },
    include: {
      questions: {
        include: { userAns: true },
        orderBy: { subject: "asc" },
      },
    },
  });

  if (!exam) return NextResponse.json({ exam: null });

  const questionsWithContent = await Promise.all(
    exam.questions.map(async (q: (typeof exam.questions)[number]) => {
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
      return { ...q, question, explain };
    })
  );

  return NextResponse.json({ exam: { ...exam, questions: questionsWithContent } });
}
