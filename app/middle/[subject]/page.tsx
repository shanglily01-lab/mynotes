"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { getMiddleSubject } from "@/lib/middle-subjects";
import SchoolSubjectPage from "@/components/school/SubjectPage";

export default function MiddleSubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = use(params);
  const router = useRouter();
  const config = getMiddleSubject(subject);

  if (!config) {
    router.replace("/middle");
    return null;
  }

  return (
    <SchoolSubjectPage
      level="middle"
      subject={subject}
      config={config}
      backHref="/middle"
      backLabel="初中学习"
    />
  );
}
