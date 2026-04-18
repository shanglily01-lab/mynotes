"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { getPrimarySubject } from "@/lib/primary-subjects";
import SchoolSubjectPage from "@/components/school/SubjectPage";

export default function PrimarySubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = use(params);
  const router = useRouter();
  const config = getPrimarySubject(subject);

  if (!config) {
    router.replace("/primary");
    return null;
  }

  return (
    <SchoolSubjectPage
      level="primary"
      subject={subject}
      config={config}
      backHref="/primary"
      backLabel="小学学习"
    />
  );
}
