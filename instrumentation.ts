export async function register() {
  // 只在 Node.js 运行时注册（排除 Edge Runtime）
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { default: cron } = await import("node-cron");

  // 每天 UTC 0点（北京时间 8点）拉取内容并生成当日计划
  cron.schedule("0 0 * * *", async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3030";
    console.log(`[cron] ${new Date().toISOString()} - starting daily fetch`);

    try {
      const fetchRes = await fetch(`${baseUrl}/api/content/fetch`, { method: "POST" });
      // Route returns SSE stream — drain it fully so the server-side work completes
      await fetchRes.text();
      console.log("[cron] content/fetch done");
    } catch (e) {
      console.error("[cron] content/fetch failed:", e);
    }

    try {
      const planRes = await fetch(`${baseUrl}/api/plan/generate`, { method: "POST" });
      const planData = (await planRes.json()) as { ok?: boolean; cached?: boolean };
      console.log("[cron] plan/generate done, cached:", planData.cached);
    } catch (e) {
      console.error("[cron] plan/generate failed:", e);
    }

    try {
      const engRes = await fetch(`${baseUrl}/api/english`, { method: "POST" });
      const engData = (await engRes.json()) as { ok?: boolean; topic?: string };
      console.log("[cron] english/generate done, topic:", engData.topic);
    } catch (e) {
      console.error("[cron] english/generate failed:", e);
    }
  });

  console.log("[cron] daily fetch scheduled at UTC 00:00");
}
