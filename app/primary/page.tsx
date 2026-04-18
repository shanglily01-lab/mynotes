import Link from "next/link";
import { PRIMARY_SUBJECTS } from "@/lib/primary-subjects";

export default function PrimaryPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">深圳市课程标准</p>
      <h1 className="text-3xl font-bold text-[#1c1a16] mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
        小学学习
      </h1>
      <p className="text-[13px] text-[#5a5550] mb-8">AI 生成知识体系 · 错题拍照诊断 · 考试重点归纳</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {PRIMARY_SUBJECTS.map((s) => (
          <Link
            key={s.id}
            href={`/primary/${s.id}`}
            className="group border border-[#d8d4ca] bg-white hover:border-current hover:shadow-sm transition-all p-5 flex flex-col gap-3"
            style={{ "--subject-color": s.color } as React.CSSProperties}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <div>
              <p className="text-[16px] font-bold text-[#1c1a16]" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
                {s.name}
              </p>
            </div>
            <p
              className="text-[11px] font-medium mt-auto opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: s.color }}
            >
              进入学习 →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
