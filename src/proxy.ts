import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import { prisma } from "@/lib/prisma";
import { findApprovedApplicationForUser } from "@/lib/application-access";
import {
  canAccessApplicantWorkspace,
  canAccessWorkspace,
  isReviewer,
} from "@/lib/auth-helpers";

type SessionPayload = {
  user?: {
    id: string;
  };
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/app", "/workspace"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const { data: sessionData } = await betterFetch<SessionPayload>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  if (!sessionData?.user?.id) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/app/invites")) {
    const user = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      select: { role: true },
    });

    if (!user || !isReviewer(user.role)) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  if (pathname.startsWith("/workspace")) {
    const user = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      select: { id: true, email: true, role: true },
    });

    if (!user || !canAccessWorkspace(user.role)) {
      return NextResponse.redirect(new URL("/app", request.url));
    }

    if (canAccessApplicantWorkspace(user.role)) {
      const approved = await findApprovedApplicationForUser({
        id: user.id,
        email: user.email,
      });

      if (!approved) {
        return NextResponse.redirect(new URL("/app", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app", "/app/:path*", "/workspace", "/workspace/:path*"],
};
