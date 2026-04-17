"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronUp,
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import CommentSection from "@/components/CommentSection";
import ProductForm from "@/components/ProductForm";
import { formatDistanceToNow } from "@/lib/utils";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { requireAuth, user } = useRequireAuth();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: product, isLoading } = trpc.products.getById.useQuery({ id });

  const toggleUpvote = trpc.products.toggleUpvote.useMutation({
    onSuccess: () => utils.products.getById.invalidate({ id }),
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
      <div className="py-24 text-center">
        <p className="text-zinc-500">Product not found</p>
        <Link href="/products" className="mt-4 inline-block text-orange-500 hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Edit Product</h2>
              <button onClick={() => setEditing(false)} className="rounded-lg p-1 hover:bg-zinc-100">
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>
            <ProductForm
              defaultValues={{
                id: product.id,
                name: product.name,
                description: product.description,
                logoUrl: product.logoUrl,
                imageUrls: product.images.map((img) => img.url),
              }}
              onSuccess={() => setEditing(false)}
            />
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-zinc-900">Delete Product?</h2>
            <p className="mt-2 text-sm text-zinc-500">
              This action cannot be undone. All comments and upvotes will be permanently removed.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl border border-zinc-200 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProduct.mutate({ id: product.id })}
                disabled={deleteProduct.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteProduct.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product header */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Image
            src={product.logoUrl}
            alt={product.name}
            width={72}
            height={72}
            className="rounded-2xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-zinc-900">{product.name}</h1>
              {isOwner && (
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-zinc-600">{product.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Link
                href={`/${product.owner.username ?? product.owner.name}`}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-500"
              >
                <User className="h-4 w-4" />
                <span>{product.owner.name}</span>
              </Link>
              <span className="text-xs text-zinc-400">
                {formatDistanceToNow(new Date(product.createdAt))}
              </span>
            </div>
          </div>
        </div>

        {/* Upvote */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => requireAuth(() => toggleUpvote.mutate({ productId: product.id }))}
            disabled={toggleUpvote.isPending}
            className={`flex items-center gap-2 rounded-xl border px-5 py-2 text-sm font-semibold transition ${
              product.hasUpvoted
                ? "border-orange-400 bg-orange-50 text-orange-500"
                : "border-zinc-200 text-zinc-700 hover:border-orange-400 hover:text-orange-500"
            } disabled:opacity-60`}
          >
            <ChevronUp className="h-5 w-5" />
            {product.hasUpvoted ? "Upvoted" : "Upvote"} · {product.upvoteCount}
          </button>
        </div>
      </div>

      {/* Gallery */}
      {product.images.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
          <div className="relative aspect-video">
            <Image
              src={product.images[galleryIndex].url}
              alt={`${product.name} screenshot ${galleryIndex + 1}`}
              fill
              className="object-contain"
            />
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIndex((i) => (i - 1 + product.images.length) % product.images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGalleryIndex((i) => (i + 1) % product.images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 p-3">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setGalleryIndex(i)}
                  className={`relative h-14 w-20 overflow-hidden rounded-lg border-2 transition ${
                    i === galleryIndex ? "border-orange-400" : "border-transparent"
                  }`}
                >
                  <Image src={img.url} alt={`thumb ${i}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <CommentSection productId={product.id} />
    </div>
  );
}
