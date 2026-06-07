import { PrismaClient } from "@/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 ではドライバアダプタが必須(new PrismaClient() の引数なし呼び出しはエラー)。
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// dev のホットリロードで PrismaClient が増殖しないようにグローバルに保持する。
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
