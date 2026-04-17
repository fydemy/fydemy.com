"use client";

import { authClient } from "@/lib/auth-client";

export function useRequireAuth() {
  const { data: session, isPending } = authClient.useSession();

  const requireAuth = (action: () => void | Promise<void>) => {
    if (!session?.user) {
      authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.href,
      });
      return;
    }
    action();
  };

  return { requireAuth, session, user: session?.user ?? null, isPending };
}
