"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Pencil,
  Check,
  X,
  User,
  Loader2,
  Camera,
  LogOut,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { uploadImage } from "@/lib/supabase";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const profileSchema = z.object({
  name: z.string().min(1, "Required").max(100),
  username: z
    .string()
    .min(2, "Min 2 characters")
    .max(30, "Max 30 characters")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only"),
  bio: z.string().max(200).optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePageClient({ username }: { username: string }) {
  const { user: currentUser } = useRequireAuth();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveError, setSaveError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading, error } = trpc.profile.getByUsername.useQuery({ username });

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.getByUsername.invalidate({ username });
      setEditing(false);
      setSaveError("");
    },
    onError: (e) => setSaveError(e.message),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  const startEditing = () => {
    if (!profile) return;
    reset({ name: profile.name, username: profile.username ?? "", bio: profile.bio ?? "" });
    setAvatarPreview(profile.image ?? "");
    setEditing(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: ProfileValues) => {
    setSaveError("");
    let imageUrl = profile?.image ?? "";

    if (avatarFile) {
      setUploadingAvatar(true);
      try {
        imageUrl = await uploadImage(avatarFile, "avatars", "avatars");
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Failed to upload avatar");
        setUploadingAvatar(false);
        return;
      }
      setUploadingAvatar(false);
    }

    updateProfile.mutate({ ...values, image: imageUrl });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold">User not found.</h2>
        <Link href="/products" className={buttonVariants({variant: "ghost"})}>
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 space-y-10">
      {/* Profile card */}
      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Avatar upload */}
            <div className="relative">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full"
              >
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="avatar" fill className="rounded-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-zinc-400" />
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Name</label>
                <Input {...register("name")} placeholder="John Doe" />
                {errors.name && <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Username</label>
                <Input {...register("username")} placeholder="john_doe" />
                {errors.username && <p className="mt-0.5 text-xs text-red-500">{errors.username.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Bio</label>
            <Textarea {...register("bio")} rows={2} placeholder="Tell us about yourself..." />
            {errors.bio && <p className="mt-0.5 text-xs text-red-500">{errors.bio.message}</p>}
          </div>

          {saveError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{saveError}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setEditing(false)} variant="ghost">
              <X />
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfile.isPending || uploadingAvatar} variant="default">
              {(updateProfile.isPending || uploadingAvatar) && <Loader2 className="animate-spin" />}
              <Check />
              Save
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-4">
          {profile.image ? (
            <Image src={profile.image} alt={profile.name} width={56} height={56} className="object-cover rounded-full" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-lg font-medium text-zinc-600">
              {profile.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="font-semibold">{profile.name}</h1>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                )}
              </div>
              {isOwnProfile && (
                <div className="flex items-center">
                  <Button
                    onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })}
                    variant="ghost"
                    size="icon"
                  >
                    <LogOut />
                  </Button>
                  <Button onClick={startEditing} variant="ghost">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      {profile.products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 pb-16 pt-8 text-center">
          <p className="text-sm text-zinc-400">
            {isOwnProfile ? "You haven't submitted any products yet." : "No products yet."}
          </p>
          {isOwnProfile && (
            <Link href="/products" className={buttonVariants()}>
              Submit your first product
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {profile.products?.map((product) => (
            <ProductCard
              key={product.id}
              product={{ ...product, score: product._count.upvotes, owner: profile }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
