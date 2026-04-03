import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaHeartbeat: ReturnType<typeof setInterval> | undefined;
};

function createPrisma() {
  const client = new PrismaClient();

  // Keep connection alive — MySQL drops idle connections after ~60s
  if (!globalForPrisma.prismaHeartbeat) {
    globalForPrisma.prismaHeartbeat = setInterval(() => {
      client.$queryRaw`SELECT 1`.catch(() => {});
    }, 30_000);
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
