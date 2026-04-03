import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SUBJECTS } from "@/lib/subjects";
import { fetchRssFeed } from "@/lib/rss";
import { summarizeArticle } from "@/lib/claude";
import { writeText, readText } from "@/lib/filestore";

const hasAI = !!process.env["google-key"];

async function getSummary(title: string, content: string): Promise<string> {
  const textToSummarize = content || title;
  const fallback = textToSummarize.slice(0, 300);
  if (!hasAI) return fallback;
  try {
    return await summarizeArticle(title, textToSummarize);
  } catch (err) {
    console.error("Summarize failed:", err);
    return fallback;
  }
}

export async function POST() {
  const results: Record<string, number> = {};

  for (const subject of SUBJECTS) {
    let count = 0;
    for (const feed of subject.rssFeeds) {
      const items = await fetchRssFeed(feed.url, feed.name);

      for (const item of items) {
        if (!item.url || !item.title) continue;

        const existing = await prisma.article.findUnique({
          where: { url: item.url },
          select: { id: true, summaryPath: true },
        });

        if (existing) {
          // 摘要文件为空时补充
          const existingText = await readText(existing.summaryPath);
          if (!existingText) {
            const summary = await getSummary(item.title, item.content);
            await writeText("articles", existing.id, summary);
            count++;
          }
          continue;
        }

        // 新文章：先创建记录拿到 id，再写文件
        const article = await prisma.article.create({
          data: {
            subjectId: subject.id,
            title: item.title,
            summaryPath: "",
            url: item.url,
            source: item.source,
            publishedAt: item.publishedAt,
          },
        });

        const summary = await getSummary(item.title, item.content);
        const summaryPath = await writeText("articles", article.id, summary);

        await prisma.article.update({
          where: { id: article.id },
          data: { summaryPath },
        });

        count++;
      }
    }
    results[subject.id] = count;
  }

  return NextResponse.json({ ok: true, inserted: results });
}
