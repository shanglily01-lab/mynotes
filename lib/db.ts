import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const client = new PrismaClient();

  // Auto-reconnect on server-closed connection (P1017) or init error
  return new Proxy(client, {
    get(target, prop) {
      const val = target[prop as keyof typeof target];
      if (typeof val !== "function") return val;
      if (typeof prop !== "string" || prop.startsWith("$")) return val;

      return new Proxy(val as object, {
        get(model, method) {
          const fn = model[method as keyof typeof model];
          if (typeof fn !== "function") return fn;
          return async (...args: unknown[]) => {
            try {
              return await (fn as (...a: unknown[]) => unknown).apply(model, args);
            } catch (e: unknown) {
              const code = (e as { code?: string }).code;
              if (code === "P1017" || code === "P1001") {
                await target.$disconnect().catch(() => {});
                await target.$connect();
                return await (fn as (...a: unknown[]) => unknown).apply(model, args);
              }
              throw e;
            }
          };
        },
      });
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
