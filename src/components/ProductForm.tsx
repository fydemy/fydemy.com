"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { X,  Loader2, Frame, Images } from "lucide-react";
import { uploadImage } from "@/lib/supabase";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const schema = z.object({
  name: z.string().min(1, "Required").max(100),
  description: z.string().min(1, "Required").max(500),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onSuccess?: (slug?: string) => void;
  defaultValues?: {
    id: string;
    name: string;
    description: string;
    logoUrl?: string | null;
    imageUrls: string[];
    tagIds?: string[];
  };
};

export default function ProductForm({ onSuccess, defaultValues }: Props) {
  const { requireAuth } = useRequireAuth();
  const utils = trpc.useUtils();

  const { data: allTags = [] } = trpc.products.tags.useQuery();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(defaultValues?.tagIds ?? []);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(defaultValues?.logoUrl ?? "");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(defaultValues?.imageUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultValues?.name ?? "", description: defaultValues?.description ?? "" },
  });

  const create = trpc.products.create.useMutation({
    onSuccess: (data) => {
      utils.products.list.invalidate();
      onSuccess?.(data.slug ?? undefined);
    },
  });

  const update = trpc.products.update.useMutation({
    onSuccess: (data) => {
      utils.products.list.invalidate();
      onSuccess?.(data.slug ?? undefined);
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 3 - galleryPreviews.length;
    const selected = files.slice(0, remaining);
    setGalleryFiles((prev) => [...prev, ...selected]);
    setGalleryPreviews((prev) => [
      ...prev,
      ...selected.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeGallery = (index: number) => {
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (values: FormValues) => {
    requireAuth(async () => {
      try {
        setUploading(true);
        setError("");

        let finalLogoUrl: string | undefined = defaultValues?.logoUrl ?? undefined;
        if (logoFile) {
          finalLogoUrl = await uploadImage(logoFile, "products", "logos");
        }

        const existingUrls = defaultValues?.imageUrls ?? [];
        const newUploadedUrls = await Promise.all(
          galleryFiles.map((f) => uploadImage(f, "products", "gallery"))
        );
        const imageUrls = [
          ...galleryPreviews
            .filter((p) => existingUrls.includes(p))
            .map((p) => p),
          ...newUploadedUrls,
        ].slice(0, 3);

        if (defaultValues?.id) {
          await update.mutateAsync({
            id: defaultValues.id,
            name: values.name,
            description: values.description,
            logoUrl: finalLogoUrl,
            imageUrls,
            tagIds: selectedTagIds,
          });
        } else {
          await create.mutateAsync({
            name: values.name,
            description: values.description,
            logoUrl: finalLogoUrl,
            imageUrls,
            tagIds: selectedTagIds,
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setUploading(false);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Logo */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Logo
        </label>
          <div
            onClick={() => logoInputRef.current?.click()}
            className={`flex size-20 cursor-pointer items-center justify-center overflow-hidden ${logoPreview ? "" : "border"}`}
          >
            {logoPreview ? (
              <Image src={logoPreview} alt="logo" width={56} height={56} className="h-full w-full object-cover" />
            ) : (
              <Frame />
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
      </div>


      {/* Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Name&nbsp;*
        </label>
        <Input
          {...register("name")}
          placeholder="My Awesome Product"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Description&nbsp;*
        </label>
        <Textarea
          {...register("description")}
          rows={3}
          placeholder="What does your product do?"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Tags <span className="text-muted-foreground font-normal">(up to 5)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
              >
                <Badge variant={selected ? "default" : "outline"}>
                  {tag.name}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gallery */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Gallery &uarr;3
        </label>
        <div className="flex flex-wrap gap-3">
          {galleryPreviews.map((src, i) => (
            <div key={i} className="relative size-20 aspect-square overflow-hidden">
              <Image src={src} alt={`gallery ${i}`} fill className="object-cover" />
              <Button
                type="button"
                onClick={() => removeGallery(i)}
                size="icon-xs"
                variant="outline"
                className="absolute right-1 top-1"
              >
                <X />
              </Button>
            </div>
          ))}
          {galleryPreviews.length < 3 && (
            <div
              onClick={() => galleryInputRef.current?.click()}
              className="flex size-20 aspect-square cursor-pointer items-center justify-center border"
            >
              <Images />
            </div>
          )}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleGalleryChange}
          />
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <Button
        className="float-end"
        disabled={uploading || create.isPending || update.isPending}
      >
        {(uploading || create.isPending || update.isPending) && (
          <Loader2 className="animate-spin" />
        )}
        {defaultValues?.id ? "Save Changes" : "Submit"}
      </Button>
    </form>
  );
}
