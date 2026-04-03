import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SUBJECTS } from "@/lib/subjects";
import { readText } from "@/lib/filestore";

export async function GET() {
  const progress = await prisma.progress.findMany({
    orderBy: { weekStart: "desc" },
    take: 50,
  });

  const bySubject = await Promise.all(
    SUBJECTS.map(async (s) => {
      const history = await Promise.all(
        progress
          .filter((p) => p.subjectId === s.id)
          .map(async (p) => ({
            ...p,
            evaluation: p.evaluationPath ? await readText(p.evaluationPath) : null,
          }))
      );
      return {
        subjectId: s.id,
        subjectName: s.name,
        history,
      };
    })
  );

  return NextResponse.json({ progress: bySubject });
}
