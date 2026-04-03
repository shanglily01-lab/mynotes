import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const { itemId, done } = (await req.json()) as {
    itemId: string;
    done: boolean;
  };

  if (!itemId || typeof done !== "boolean") {
    return NextResponse.json({ ok: false, error: "Invalid params" }, { status: 400 });
  }

  const item = await prisma.planItem.update({
    where: { id: itemId },
    data: { done },
  });

  return NextResponse.json({ ok: true, item });
}
