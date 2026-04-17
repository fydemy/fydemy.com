"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronUp, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Product = {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  score: number;
  _count: { upvotes: number; comments: number };
  owner: { name: string; username: string | null };
};

export default function ProductCard({ product }: { product: Product }) {
  const { requireAuth, user } = useRequireAuth();
  const utils = trpc.useUtils();

  const toggleUpvote = trpc.products.toggleUpvote.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  });

  return (
    <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <Link href={`/products/${product.id}`} className="shrink-0">
        <Image
          src={product.logoUrl}
          alt={product.name}
          width={56}
          height={56}
          className="rounded-xl object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/products/${product.id}`}>
          <h2 className="truncate font-semibold text-zinc-900 hover:text-orange-500">
            {product.name}
          </h2>
        </Link>
        <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">{product.description}</p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400">
          <span>by {product.owner.name}</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {product._count.comments}
          </span>
        </div>
      </div>

      <button
        onClick={() =>
          requireAuth(() =>
            toggleUpvote.mutate({ productId: product.id })
          )
        }
        disabled={toggleUpvote.isPending}
        className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-orange-400 hover:text-orange-500 disabled:opacity-60"
      >
        <ChevronUp className="h-5 w-5" />
        <span>{product._count.upvotes}</span>
      </button>
    </div>
  );
}
