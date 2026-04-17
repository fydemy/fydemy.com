"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/supabase";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const schema = z.object({
  name: z.string().min(1, "Required").max(100),
  description: z.string().min(1, "Required").max(500),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onSuccess?: () => void;
  defaultValues?: {
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    imageUrls: string[];
  };
};

export default function ProductForm({ onSuccess, defaultValues }: Props) {
  const { requireAuth } = useRequireAuth();
  const utils = trpc.useUtils();

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
    onSuccess: () => {
      utils.products.list.invalidate();
      onSuccess?.();
    },
  });

  const update = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      if (defaultValues?.id) utils.products.getById.invalidate({ id: defaultValues.id });
      onSuccess?.();
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

        let finalLogoUrl = defaultValues?.logoUrl ?? "";
        if (logoFile) {
          finalLogoUrl = await uploadImage(logoFile, "products", "logos");
        }

        if (!finalLogoUrl) {
          setError("Please upload a logo");
          setUploading(false);
          return;
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
          });
        } else {
          await create.mutateAsync({
            name: values.name,
            description: values.description,
            logoUrl: finalLogoUrl,
            imageUrls,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Logo */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Logo <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4">
          <div
            onClick={() => logoInputRef.current?.click()}
            className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 hover:border-orange-400"
          >
            {logoPreview ? (
              <Image src={logoPreview} alt="logo" width={80} height={80} className="h-full w-full object-cover" />
            ) : (
              <Upload className="h-6 w-6 text-zinc-400" />
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
          <p className="text-xs text-zinc-500">Square image, at least 256×256</p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          placeholder="My Awesome Product"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="What does your product do?"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Gallery */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Gallery Photos <span className="text-zinc-400">(up to 3)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {galleryPreviews.map((src, i) => (
            <div key={i} className="relative h-24 w-32 overflow-hidden rounded-lg">
              <Image src={src} alt={`gallery ${i}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeGallery(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {galleryPreviews.length < 3 && (
            <div
              onClick={() => galleryInputRef.current?.click()}
              className="flex h-24 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 hover:border-orange-400"
            >
              <Upload className="h-5 w-5 text-zinc-400" />
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

      <button
        type="submit"
        disabled={uploading || create.isPending || update.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {(uploading || create.isPending || update.isPending) && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {defaultValues?.id ? "Save Changes" : "Submit Product"}
      </button>
    </form>
  );
}
