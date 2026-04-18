"use client";

import Link from "next/link";
import Image from "next/image";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useScrollLock } from "@/hooks/useScrollLock";
import { authClient } from "@/lib/auth-client";
import { Rocket, X, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import ProductForm from "./ProductForm";

export default function Navbar() {
  const [showForm, setShowForm] = useState(false);
  const { user, isPending, requireAuth } = useRequireAuth();
  useScrollLock(showForm);
  const handleSubmitClick = () => {
    requireAuth(() => setShowForm(true));
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-sm">
      <div className="mx-auto flex h-18 max-w-4xl items-center justify-between px-4">
        <Link href="/">
          <Image src="/logo.svg" alt="logo" width={100} height={100} />
        </Link>

      {/* Submit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white h-screen">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
          <div className="relative w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Product</h2>
              <Button
                onClick={() => setShowForm(false)}
                variant="ghost"
                size="icon"
              >
                <X />
              </Button>
            </div>
            <ProductForm onSuccess={() => setShowForm(false)} />
          </div>
          </div>
        </div>
      )}

        {isPending ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200" />
        ) : user ? (
          <div className="flex items-center gap-4">
            <Button onClick={handleSubmitClick}>
              <Plus /> Add
            </Button>
            <Link
              href={`/${(user as unknown as { username?: string }).username ?? user.email.split("@")[0]}`}
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={30}
                  height={30}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
                  {user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </Link>
          </div>
        ) : (
          <Button
            onClick={() =>
              authClient.signIn.social({
                provider: "google",
                callbackURL: window.location.href,
              })
            }
          >
            Sign in
          </Button>
        )}
      </div>
    </nav>
  );
}
