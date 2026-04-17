import { betterAuth } from "better-auth";
import { prisma } from "./prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        input: false,
      },
      bio: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const base = user.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_");

          const existing = await prisma.user.findFirst({
            where: { username: { startsWith: base } },
            orderBy: { createdAt: "desc" },
          });

          const username = existing ? `${base}_${Date.now().toString(36)}` : base;

          return { data: { ...user, username } };
        },
      },
    },
  },
});
