"use client";

import { useState, use, useRef } from "react";
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
  ChevronUp,
  MessageSquare,
  Loader2,
  Camera,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { uploadImage } from "@/lib/supabase";
import { formatDistanceToNow } from "@/lib/utils";

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

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
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
      <div className="py-24 text-center">
        <p className="text-zinc-500">User not found</p>
        <Link href="/products" className="mt-4 inline-block text-orange-500 hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Profile card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-start gap-4">
              {/* Avatar upload */}
              <div className="relative">
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-50 hover:border-orange-400"
                >
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="avatar"
                      fill
                      className="rounded-full object-cover"
                    />
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
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Display Name</label>
                  <input
                    {...register("name")}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                  {errors.name && <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Username</label>
                  <div className="flex items-center rounded-lg border border-zinc-300 px-3 py-1.5 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
                    <span className="text-sm text-zinc-400">@</span>
                    <input
                      {...register("username")}
                      className="flex-1 bg-transparent pl-0.5 text-sm outline-none"
                    />
                  </div>
                  {errors.username && <p className="mt-0.5 text-xs text-red-500">{errors.username.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Bio</label>
              <textarea
                {...register("bio")}
                rows={2}
                placeholder="Tell us about yourself..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              {errors.bio && <p className="mt-0.5 text-xs text-red-500">{errors.bio.message}</p>}
            </div>

            {saveError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{saveError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProfile.isPending || uploadingAvatar}
                className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {(updateProfile.isPending || uploadingAvatar) && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <Check className="h-4 w-4" />
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-100">
              {profile.image ? (
                <Image src={profile.image} alt={profile.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-8 w-8 text-zinc-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl font-bold text-zinc-900">{profile.name}</h1>
                  <p className="text-sm text-zinc-500">@{profile.username}</p>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Profile
                  </button>
                )}
              </div>
              {profile.bio && (
                <p className="mt-2 text-sm text-zinc-600">{profile.bio}</p>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                Joined {formatDistanceToNow(new Date(profile.createdAt))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Products */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Products
          <span className="ml-2 text-base font-normal text-zinc-400">
            ({profile.products.length})
          </span>
        </h2>

        {profile.products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center">
            <p className="text-sm text-zinc-400">
              {isOwnProfile ? "You haven't submitted any products yet." : "No products yet."}
            </p>
            {isOwnProfile && (
              <Link
                href="/products"
                className="mt-3 inline-block rounded-xl bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
              >
                Submit your first product
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {profile.products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <Image
                  src={product.logoUrl}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-zinc-900">{product.name}</h3>
                  <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">{product.description}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <ChevronUp className="h-3.5 w-3.5" />
                      {product._count.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {product._count.comments}
                    </span>
                    <span>{formatDistanceToNow(new Date(product.createdAt))}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
