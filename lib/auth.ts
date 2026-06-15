import { prisma } from "@/lib/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    line: {
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
      // LINE はメールを返さないことがあるためプレースホルダを生成する。
      mapProfileToUser: (profile) => ({
        email: profile.email ?? `${profile.sub}@line.placeholder.local`,
      }),
    },
  },
  databaseHooks: {
    account: {
      create: {
        // 初回ログイン時、ADMIN_LINE_ID と一致するアカウントは自動で承認+管理者にする。
        after: async (account) => {
          const adminLineId = process.env.ADMIN_LINE_ID;
          if (
            adminLineId &&
            account.providerId === "line" &&
            account.accountId === adminLineId
          ) {
            await prisma.user.update({
              where: { id: account.userId },
              data: { approved: true, admin: true, applied: true },
            });
          }
        },
      },
    },
  },
});
