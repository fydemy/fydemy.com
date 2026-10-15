import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkInternalAuth } from "@/lib/internal-auth";

// Reads the database per request; there is nothing to prerender.
export const dynamic = "force-dynamic";

// Approved founders' emails for the gateway's reminder run. Internal only.
export async function GET() {
  const auth = checkInternalAuth((await headers()).get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const applications = await prisma.application.findMany({
    where: { status: "APPROVED" },
    select: { user: { select: { email: true } } },
  });

  const recipients = [
    ...new Set(
      applications
        .map((application) => application.user.email)
        .filter((email): email is string => Boolean(email)),
    ),
  ];

  return NextResponse.json({ recipients });
}
