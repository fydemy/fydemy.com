"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUp, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Button } from "./ui/button";

type Product = {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  logoUrl?: string | null;
  score: number;
  _count: { upvotes: number; comments: number };
  owner: { name: string; username: string | null };
  tags?: { tag: { id: string; name: string } }[];
};

export default function ProductCard({ product, idx }: { product: Product, idx?: number }) {
  const { requireAuth } = useRequireAuth();
  const utils = trpc.useUtils();

  const toggleUpvote = trpc.products.toggleUpvote.useMutation({
    onSuccess: () => utils.products.list.invalidate(),
  });

  return (
    <div className="flex gap-3 flex-col sm:flex-row">
      {product.logoUrl ? (
        <Link href={`/products/${product.slug ?? product.id}`} className="shrink-0">
          <Image
            src={product.logoUrl}
            alt={product.name}
            width={56}
            height={56}
            className="object-cover"
          />
        </Link>
      ) : null}

      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug ?? product.id}`}>
          <h2 className="truncate font-semibold">
           {idx !== undefined ? `${idx + 1}.` : ""} {product.name}
          </h2>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
      </div>

      <div>
        <Button variant="ghost">
          <MessageCircle />
          {product._count.comments}
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            requireAuth(() =>
              toggleUpvote.mutate({ productId: product.id })
            )
          }
          disabled={toggleUpvote.isPending}
        >
          <ArrowUp  />
          <span>{product._count.upvotes}</span>
        </Button>
      </div>
    </div>
  );
}
