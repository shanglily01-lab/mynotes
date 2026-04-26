import { NextResponse } from "next/server";
import { verifyIdiom, suggestNextIdiom } from "@/lib/claude";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: "check" | "hint";
      candidate?: string;
      mustStartWith?: string;
    };

    if (body.action === "hint") {
      const must = (body.mustStartWith ?? "").trim();
      if (!must) return NextResponse.json({ error: "missing mustStartWith" }, { status: 400 });
      const hint = await suggestNextIdiom(must);
      return NextResponse.json({ hint });
    }

    const cand = (body.candidate ?? "").trim();
    const must = (body.mustStartWith ?? "").trim();
    if (!cand) return NextResponse.json({ error: "missing candidate" }, { status: 400 });

    const result = await verifyIdiom(cand, must);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[games/idiom/check]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
