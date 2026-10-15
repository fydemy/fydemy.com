import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/seo";
import { assignFounderRole } from "@/lib/gateway";
import { findApprovedApplicationForUser } from "@/lib/community-access";

export async function POST() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    return NextResponse.json({ needAuth: true }, { status: 401 });
  }

  const discord = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "discord" },
  });

  if (!discord?.accountId) {
    return NextResponse.json({ needDiscord: true });
  }

  const approved = await findApprovedApplicationForUser({
    id: session.user.id,
    email: session.user.email,
  });

  if (!approved) {
    return NextResponse.json({ url: siteConfig.discordInviteUrl });
  }

  let accessToken = "";
  try {
    const tokens = await auth.api.getAccessToken({
      headers: requestHeaders,
      body: { providerId: "discord" },
    });
    accessToken = tokens.accessToken ?? "";
  } catch (error) {
    console.error("[discord] getAccessToken failed", error);
  }

  // The gateway owns the guild id, so it returns the community url too.
  const result = await assignFounderRole({
    discordUserId: discord.accountId,
    accessToken,
    fallbackUrl: siteConfig.discordInviteUrl,
  });

  if (!result.ok && !accessToken) {
    return NextResponse.json({ needDiscord: true });
  }

  return NextResponse.json({ url: result.url });
}
