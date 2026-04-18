import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { Discord } from "@/components/icon/discord";
import { Sparkle } from "lucide-react";
import { GitHub } from "@/components/icon/github";
import { Instagram } from "@/components/icon/instagram";
import { TikTok } from "@/components/icon/tiktok";
import { LinkedIn } from "@/components/icon/linkedin";

async function getTopProducts() {
  const products = await prisma.product.findMany({
    include: {
      owner: { select: { id: true, name: true, username: true, image: true } },
      images: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
      _count: { select: { upvotes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return products
    .map((p) => ({ ...p, score: p._count.upvotes }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export default async function Home() {
  const topProducts = await getTopProducts();

  return (
    <div className="mx-auto max-w-4xl px-4 space-y-10 py-16">
      <div className="space-y-4 max-w-sm mx-auto">
        <h1 className="text-2xl text-balance text-2xl sm:text-3xl font-bold text-center">
          A tech<span className="hidden sm:inline">nology</span> space for validation & RnD 🚀
        </h1>
        <div className="flex items-center justify-center gap-2">
          <Link href="https://discord.gg/7FBpTEXqVj" className={buttonVariants({ className: "w-fit", variant: "ghost" })}>
           <Discord /> Community
          </Link>
          <Link href="https://luma.com/fydemy" className={buttonVariants({ className: "w-fit", variant: "ghost" })}>
           <Sparkle className="fill-black"/> Events
          </Link>
        </div>
      </div>

      {topProducts.length > 0 && (
         <div className="space-y-6">
          {topProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} idx={idx} />
          ))}
          <div className="flex justify-end">
            <Link href="/products" className={buttonVariants({ className: "w-full sm:w-fit" })}>
              View all →
            </Link>
          </div>
        </div>
      )}

      <footer className="absolute bottom-2 left-2">
        <Link href="https://github.com/fydemy" className={buttonVariants({ className: "w-fit", variant: "ghost" })}>
          <GitHub /> Github
        </Link>
        <Link href="https://instagram.com/fydemycom" className={buttonVariants({ className: "w-fit", variant: "ghost" })}>
          <Instagram /> Instagram
        </Link>
        <Link href="https://tiktok.com/@fydemy" className={buttonVariants({ className: "w-fit", variant: "ghost" })}>
          <TikTok /> TikTok
        </Link>
        <Link href="https://linkedin.com/company/fydemy" className={buttonVariants({ className: "w-fit", variant: "ghost" })}>
          <LinkedIn /> LinkedIn
        </Link>
      </footer>
    </div>
  );
}
