import { NextResponse } from "next/server";
import { generatePoemPuzzle } from "@/lib/claude";

export async function POST() {
  try {
    const puzzle = await generatePoemPuzzle();

    // Validate the AI response: each blank's charIdx must match the answer in lines[lineIdx]
    const valid = puzzle.blanks.every((b) => {
      const line = puzzle.lines[b.lineIdx];
      if (!line) return false;
      const stripped = line.replace(/[，。！？、；：""''《》「」「」（）]/g, "");
      return stripped[b.charIdx] === b.answer;
    });

    if (!valid) {
      // Retry once
      const retry = await generatePoemPuzzle();
      return NextResponse.json(retry);
    }

    return NextResponse.json(puzzle);
  } catch (err) {
    console.error("[games/poem/next]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
