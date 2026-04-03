import Parser from "rss-parser";

type CustomItem = {
  "content:encoded"?: string;
  "content:encodedSnippet"?: string;
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; self-growth-bot/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["content:encoded", "content:encoded"],
      ["content:encodedSnippet", "content:encodedSnippet"],
    ],
  },
});

export interface RssItem {
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  source: string;
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; self-growth-bot/1.0)" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    // 去掉 script/style/head，保留正文
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<head[\s\S]*?<\/head>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return stripped.slice(0, 3000);
  } catch {
    return "";
  }
}

export async function fetchRssFeed(
  url: string,
  sourceName: string
): Promise<RssItem[]> {
  try {
    const feed = await parser.parseURL(url);
    const items = await Promise.all(
      feed.items.slice(0, 10).map(async (item) => {
        const raw =
          item["content:encoded"] ||
          item["content:encodedSnippet"] ||
          item.content ||
          item.contentSnippet ||
          item.summary ||
          "";

        const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

        // 内容不足 200 字时抓原文页面
        const articleUrl = (item.link ?? item.guid ?? "").slice(0, 1000);
        let finalText = text;
        if (text.length < 200 && articleUrl.startsWith("http")) {
          const pageText = await fetchPageText(articleUrl);
          if (pageText.length > text.length) finalText = pageText;
        }

        return {
          title: (item.title ?? "").slice(0, 500),
          content: finalText.slice(0, 3000),
          url: articleUrl,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          source: sourceName,
        };
      })
    );
    return items.filter((i) => i.url && i.title);
  } catch (err) {
    console.error(`RSS fetch failed [${sourceName}]: ${err}`);
    return [];
  }
}
