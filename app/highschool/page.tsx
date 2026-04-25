import Link from "next/link";
import { HS_SUBJECTS } from "@/lib/hs-subjects";

export default function HighSchoolPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-[#1c1a16] mb-2"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          高中学习助手
        </h1>
        <p className="text-[#5a5550] text-[15px]">
          选择学科，查阅知识体系或上传错题进行 AI 诊断
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {HS_SUBJECTS.map((s) => (
          <Link
            key={s.id}
            href={`/highschool/${s.id}`}
            className="block border border-[#d8d4ca] bg-white hover:border-[#003087] transition-colors group"
          >
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: s.color }}
            />
            <div className="px-5 py-5">
              <div
                className="text-xl font-bold mb-1 group-hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  color: s.color,
                }}
              >
                {s.name}
              </div>
              <p className="text-[12px] text-[#9a9590]">知识体系 · 错题诊断</p>
            </div>
          </Link>
        ))}
      </div>

      {/* 高考专题入口 */}
      <div className="mt-8">
        <Link
          href="/highschool/gaokao"
          className="block border border-[#d8d4ca] bg-white hover:border-[#003087] active:bg-[#f5f2eb] transition-colors group"
          style={{ borderLeftWidth: 3, borderLeftColor: "#8b1a2a" }}
        >
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p
                className="text-[15px] font-bold text-[#1c1a16] mb-0.5"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                高考专题
              </p>
              <p className="text-[12px] text-[#9a9590]">
                2023-2025 真题仿真 · 2026 高考预测卷
              </p>
            </div>
            <span className="text-[#8b1a2a] text-[18px] group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </Link>
      </div>

      <div className="mt-10 pt-6 border-t border-[#e4e0d8]">
        <p className="text-[12px] text-[#9a9590]">
          上传错题图片，AI 将诊断薄弱知识点，给出具体原理和二次结论辅导
        </p>
      </div>
    </div>
  );
}
