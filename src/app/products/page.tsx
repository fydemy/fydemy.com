"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import ProductCard from "@/components/ProductCard";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import ProductSkeleton from "@/components/skeleton/ProductSkeleton";
import { Badge } from "@/components/ui/badge";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const { data: products, isLoading } = trpc.products.list.useQuery();
  const { data: tags = [] } = trpc.products.tags.useQuery();

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = products?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesTags =
      selectedTags.size === 0 ||
      p.tags?.some(({ tag }) => selectedTags.has(tag.id));
    return matchesSearch && matchesTags;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 space-y-6 pb-16 pt-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Products</h1>

        <InputGroup className="max-w-sm">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            placeholder="Search"
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.size > 0 && (
              <button type="button" onClick={() => setSelectedTags(new Set())}>
                <Badge variant="secondary"><X /> Clear</Badge>
              </button>
            )}
            {tags.map((tag) => (
              <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}>
                <Badge variant={selectedTags.has(tag.id) ? "default" : "secondary"}>{tag.name}</Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products list */}
      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <ProductSkeleton key={i} />)
        ) : filtered?.length === 0 ? (
          <p>
            {search || selectedTags.size > 0 ? "No products match your filters." : "No products yet. Be the first!"}
          </p>
        ) : (
          filtered?.map((product, index) => (
            <ProductCard key={product.id} product={product} idx={index} />
          ))
        )}
      </div>
    </div>
  );
}
