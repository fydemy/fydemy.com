"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { buttonVariants } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/skeleton/ProductSkeleton";

export default function TopProducts() {
  const { data: products, isLoading } = trpc.products.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  const top3 = products?.slice(0, 3) ?? [];

  if (top3.length === 0){
    return (
      <div className="py-24 text-center space-y-4">
        <h2>No products yet. Be the first!</h2>
        <Link href="/products" className={buttonVariants()}>
          Add Products →
        </Link>
    </div>
    )
  }

  return (
    <div className="space-y-6">
      {top3.map((product, idx) => (
        <ProductCard key={product.id} product={product} idx={idx} />
      ))}
      <div className="flex justify-end">
        <Link href="/products" className={buttonVariants({ className: "w-full sm:w-fit" })}>
          View all →
        </Link>
      </div>
    </div>
  );
}
