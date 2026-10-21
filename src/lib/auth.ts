import { betterAuth } from "better-auth";
import { applyPendingInvite } from "./invites";
import { prisma } from "./prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "discord"],
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      scope: ["identify", "email", "guilds.join"],
      prompt: "consent",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (!user.id || !user.email) return;
          try {
            await applyPendingInvite({ id: user.id, email: user.email });
          } catch (error) {
            console.error("[invite] failed to apply pending invite", error);
          }
        },
      },
    },
  },
});
