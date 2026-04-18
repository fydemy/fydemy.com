import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProfilePageClient from "@/components/ProfilePageClient";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, bio: true, image: true },
  });

  if (!user) {
    return { title: "User not found" };
  }

  const title = `${user.name} (@${username})`;
  const description = user.bio ?? `Check out ${user.name}'s products on LaunchPad.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(user.image && {
        images: [{ url: user.image, width: 256, height: 256, alt: user.name }],
      }),
    },
    twitter: {
      title,
      description,
      ...(user.image && { images: [user.image] }),
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  return <ProfilePageClient username={username} />;
}
