import Link from "next/link";
import { HS_SUBJECTS } from "@/lib/hs-subjects";

export default function GaokaoPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/highschool" className="text-[#9a9590] hover:text-[#5a5550] text-[13px]">
          高中学习
        </Link>
        <span className="text-[#d8d4ca]">/</span>
        <span
          className="text-[15px] font-bold text-[#1c1a16]"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          高考专题
        </span>
      </div>

      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-[#1c1a16] mb-2"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          高考专题
        </h1>
        <p className="text-[#5a5550] text-[15px] leading-relaxed">
          按学科查看 <span className="font-semibold text-[#003087]">2023-2025 年高考真题仿真练习</span>，
          以及 <span className="font-semibold text-[#8b1a2a]">2026 年高考预测试卷</span>。
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {HS_SUBJECTS.map((s) => (
          <Link
            key={s.id}
            href={`/highschool/gaokao/${s.id}`}
            className="block border border-[#d8d4ca] bg-white hover:border-[#003087] active:bg-[#f5f2eb] transition-colors group"
          >
            <div className="h-1.5 w-full" style={{ backgroundColor: s.color }} />
            <div className="px-5 py-5">
              <div
                className="text-xl font-bold mb-1"
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  color: s.color,
                }}
              >
                {s.name}
              </div>
              <p className="text-[12px] text-[#9a9590]">真题仿真 · 2026 预测</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-[#e4e0d8] space-y-2">
        <p className="text-[12px] text-[#9a9590]">
          · 真题仿真：AI 参照 2023-2025 年全国卷与新高考卷的命题风格、难度、题型分布生成
        </p>
        <p className="text-[12px] text-[#9a9590]">
          · 2026 预测：结合近 3 年命题趋势，给出命题方向分析与一套预测题
        </p>
      </div>
    </div>
  );
}
