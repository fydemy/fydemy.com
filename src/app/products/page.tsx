"use client";

import { useState } from "react";
import { Plus, X, Search, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import ProductCard from "@/components/ProductCard";
import ProductForm from "@/components/ProductForm";

export default function ProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const { requireAuth } = useRequireAuth();

  const { data: products, isLoading } = trpc.products.list.useQuery();

  const filtered = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmitClick = () => {
    requireAuth(() => setShowForm(true));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Discover Products</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {products?.length ?? 0} products ranked by community votes
          </p>
        </div>
        <button
          onClick={handleSubmitClick}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Submit
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-xl border border-zinc-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* Submit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Submit a Product</h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 hover:bg-zinc-100"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>
            <ProductForm onSuccess={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* Products list */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading products...</p>
        </div>
      ) : filtered?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-16 text-center">
          <p className="text-zinc-400">
            {search ? "No products match your search" : "No products yet. Be the first!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered?.map((product, index) => (
            <div key={product.id} className="flex items-start gap-3">
              <div className="flex h-8 w-6 shrink-0 items-center justify-start pt-5">
                <span className="text-sm font-bold text-zinc-300">#{index + 1}</span>
              </div>
              <div className="flex-1">
                <ProductCard product={product} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
