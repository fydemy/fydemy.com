"use client";

import Link from "next/link";
import Image from "next/image";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { authClient } from "@/lib/auth-client";
import { Rocket, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, isPending } = useRequireAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/products" className="flex items-center gap-2 font-bold text-zinc-900">
          <Rocket className="h-5 w-5 text-orange-500" />
          <span>LaunchPad</span>
        </Link>

        <div className="flex items-center gap-3">
          {isPending ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/${(user as unknown as { username?: string }).username ?? user.email.split("@")[0]}`}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <span className="hidden sm:block">{user.name}</span>
              </Link>
              <button
                onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() =>
                authClient.signIn.social({
                  provider: "google",
                  callbackURL: window.location.href,
                })
              }
              className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
