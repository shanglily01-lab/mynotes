import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { SUBJECTS } from "../lib/subjects";

const prisma = new PrismaClient();

async function main() {
  for (const s of SUBJECTS) {
    await prisma.subject.upsert({
      where: { id: s.id },
      create: { id: s.id, name: s.name, icon: s.icon },
      update: { name: s.name, icon: s.icon },
    });
  }
  console.log("Seeded subjects:", SUBJECTS.map((s) => s.name).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
