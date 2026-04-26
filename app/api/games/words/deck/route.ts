import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface VocabItem {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
}

const DECK_SIZE = 20;

export async function GET() {
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const records = await prisma.dailyEnglish.findMany({
      where: { date: { gte: cutoff } },
      orderBy: { date: "desc" },
      take: 30,
      select: { vocabulary: true, date: true },
    });

    const all: VocabItem[] = [];
    const seen = new Set<string>();
    for (const r of records) {
      try {
        const items = JSON.parse(r.vocabulary) as VocabItem[];
        for (const it of items) {
          if (!it.word || seen.has(it.word.toLowerCase())) continue;
          seen.add(it.word.toLowerCase());
          all.push(it);
        }
      } catch {
        continue;
      }
    }

    if (all.length < 4) {
      return NextResponse.json({
        items: [],
        message: "近 30 天词汇不足，请先去『每日英语』生成几天内容",
      });
    }

    // Shuffle and pick DECK_SIZE
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j]!, all[i]!];
    }
    const deck = all.slice(0, DECK_SIZE);

    // Pre-build distractors for each card so client doesn't need full pool
    const items = deck.map((card) => {
      const others = all.filter((x) => x.word !== card.word);
      const distractors: string[] = [];
      const distSet = new Set<string>();
      while (distractors.length < 3 && others.length > 0) {
        const idx = Math.floor(Math.random() * others.length);
        const cand = others[idx]!.meaning;
        if (cand !== card.meaning && !distSet.has(cand)) {
          distSet.add(cand);
          distractors.push(cand);
        } else {
          others.splice(idx, 1);
        }
        if (others.length === 0) break;
      }
      return { ...card, distractors };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[games/words/deck]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
