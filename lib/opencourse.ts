import type { OpenResource } from "./subjects";

// 抓取公开资源页面正文，提取有效文本
async function fetchPageText(url: string, maxChars = 4000): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; self-growth-bot/1.0)",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();

    // 去掉 nav/header/footer/script/style 等干扰区域
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned.slice(0, maxChars);
  } catch {
    return "";
  }
}

export interface FetchedResource {
  title: string;
  url: string;
  description: string;
  content: string; // 抓取到的页面正文
}

// 抓取该学科所有公开资源的内容
export async function fetchOpenResources(
  resources: OpenResource[]
): Promise<FetchedResource[]> {
  if (resources.length === 0) return [];

  const results = await Promise.all(
    resources.map(async (r) => {
      const content = await fetchPageText(r.url);
      return { title: r.title, url: r.url, description: r.description, content };
    })
  );

  // 过滤掉抓取失败的
  return results.filter((r) => r.content.length > 100);
}
