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
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(msg: string) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ msg })}\n\n`));
      }

      const results: Record<string, number> = {};

      try {
        for (const subject of SUBJECTS) {
          let count = 0;
          send(`[${subject.name}] 开始拉取...`);

          for (const feed of subject.rssFeeds) {
            send(`[${subject.name}] 正在抓取 ${feed.name}`);
            const items = await fetchRssFeed(feed.url, feed.name);
            send(`[${subject.name}] ${feed.name} 获取 ${items.length} 条`);

            for (const item of items) {
              if (!item.url || !item.title) continue;

              const existing = await prisma.article.findUnique({
                where: { url: item.url },
                select: { id: true, summaryPath: true },
              });

              if (existing) {
                const existingText = await readText(existing.summaryPath);
                if (!existingText) {
                  send(`[${subject.name}] 补充摘要: ${item.title.slice(0, 40)}...`);
                  const summary = await getSummary(item.title, item.content);
                  await writeText("articles", existing.id, summary);
                  count++;
                }
                continue;
              }

              send(`[${subject.name}] 新文章: ${item.title.slice(0, 40)}...`);
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
          send(`[${subject.name}] 完成，新增/更新 ${count} 篇`);
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, inserted: results })}\n\n`)
        );
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
