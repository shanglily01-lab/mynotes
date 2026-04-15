import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const [,, sqlFile] = process.argv;
const prisma = new PrismaClient();
const sql = readFileSync(sqlFile, "utf-8");

const stmts = sql.split(";").map(s => s.trim()).filter(Boolean);
for (const stmt of stmts) {
  await prisma.$executeRawUnsafe(stmt);
  console.log("OK:", stmt.slice(0, 80));
}

await prisma.$disconnect();
console.log("Done.");
