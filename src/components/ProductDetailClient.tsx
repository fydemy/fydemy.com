"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, ArrowUp, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useScrollLock } from "@/hooks/useScrollLock";
import CommentSection from "@/components/CommentSection";
import ProductForm from "@/components/ProductForm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function ProductDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { requireAuth, user } = useRequireAuth();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  useScrollLock(editing);

  const { data: product, isLoading } = trpc.products.getBySlug.useQuery({ slug });

  const toggleUpvote = trpc.products.toggleUpvote.useMutation({
    onSuccess: () => utils.products.getBySlug.invalidate({ slug }),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => router.push("/products"),
  });

  const isOwner = user && product && user.id === product.owner.id;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold">Product not found.</h2>
        <Link href="/products" className={buttonVariants({variant: "ghost"})}>
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 space-y-10">
      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white h-screen">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
          <div className="relative w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Product</h2>
              <Button onClick={() => setEditing(false)} variant="ghost" size="icon">
                <X />
              </Button>
            </div>
            <ProductForm
              defaultValues={{
                id: product.id,
                name: product.name,
                description: product.description,
                logoUrl: product.logoUrl,
                imageUrls: product.images.map((img) => img.url),
                tagIds: product.tags?.map(({ tag }) => tag.id) ?? [],
              }}
              onSuccess={(updatedSlug) => {
                setEditing(false);
                if (updatedSlug && updatedSlug !== slug) {
                  router.replace(`/products/${updatedSlug}`);
                } else {
                  utils.products.getBySlug.invalidate({ slug });
                }
              }}
            />
          </div>
          </div>
        </div>
      )}

      {/* Product header */}
      <div className="flex flex-col sm:flex-row gap-3">
        {product.logoUrl ? (
          <Image src={product.logoUrl} alt={product.name} width={56} height={56} className="object-cover aspect-square size-14" />
        ) : null}
        <div className="flex-1">
          <h1 className="font-semibold truncate">{product.name}</h1>
          <p className="text-sm text-muted-foreground">{product.description}</p>
          {product.tags && product.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex">
          {isOwner && (
            <>
              <Button onClick={() => setEditing(true)} variant="ghost" size="icon">
                <Pencil />
              </Button>
              <Button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this product?")) {
                    deleteProduct.mutate({ id: product.id });
                  }
                }}
                variant="ghost"
                size="icon"
              >
                <Trash2 />
              </Button>
            </>
          )}
          <Button
            onClick={() => requireAuth(() => toggleUpvote.mutate({ productId: product.id }))}
            disabled={toggleUpvote.isPending}
            variant="ghost"
          >
            <ArrowUp />
            {product.upvoteCount}
          </Button>
        </div>
      </div>

      {/* Gallery */}
      {product.images.length > 0 && (
        <ScrollArea className="w-full">
          <div className="flex w-max space-x-4 pb-2">
            {product.images.map((image) => (
              <Image
                key={image.id}
                src={image.url}
                alt={image.url}
                width={300}
                height={200}
                className="shrink-0 object-cover"
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Comments */}
      <CommentSection productId={product.id} isOwner={!!isOwner} ownerId={product.owner.id} />
    </div>
  );
}
