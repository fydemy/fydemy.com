import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProductDetailClient from "@/components/ProductDetailClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: {
      name: true,
      description: true,
      logoUrl: true,
      owner: { select: { name: true } },
    },
  });

  if (!product) {
    return { title: "Product not found" };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      ...(product.logoUrl && {
        images: [{ url: product.logoUrl, width: 256, height: 256, alt: product.name }],
      }),
    },
    twitter: {
      title: product.name,
      description: product.description,
      ...(product.logoUrl && { images: [product.logoUrl] }),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
