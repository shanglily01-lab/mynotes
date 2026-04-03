import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaHeartbeat: ReturnType<typeof setInterval> | undefined;
};

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient();
}

export const prisma = globalForPrisma.prisma;

// Keep connection alive — MySQL drops idle connections after wait_timeout (~60s by default)
if (!globalForPrisma.prismaHeartbeat) {
  globalForPrisma.prismaHeartbeat = setInterval(() => {
    const client = globalForPrisma.prisma;
    if (client) client.$queryRaw`SELECT 1`.catch(() => {});
  }, 30_000);
}
