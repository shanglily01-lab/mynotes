import { NextRequest } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env["google-key"] ?? "");

interface Message {
  role: "user" | "model";
  text: string;
  imageBase64?: string;
  imageMimeType?: string;
}

function buildParts(m: Message): Part[] {
  const parts: Part[] = [];
  if (m.imageBase64 && m.imageMimeType) {
    parts.push({ inlineData: { mimeType: m.imageMimeType, data: m.imageBase64 } });
  }
  parts.push({ text: m.text || " " });
  return parts;
}

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: Message[] };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction:
      "你是一个全能学习助手，帮助用户学习心理学、生物学、物理学、社会学、人工智能等学科。" +
      "回答要精炼、有深度，适当举例，使用中文回答。支持 Markdown 格式输出。",
    generationConfig: { maxOutputTokens: 4096 },
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: buildParts(m),
  }));

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) {
    return new Response("No message", { status: 400 });
  }

  const chat = model.startChat({ history });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(buildParts(lastMessage));
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
      } catch (err) {
        controller.enqueue(
          new TextEncoder().encode(`\n\n[Error: ${String(err)}]`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
