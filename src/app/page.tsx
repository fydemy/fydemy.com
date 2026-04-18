import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Discord } from "@/components/icon/discord";
import { Sparkle } from "lucide-react";
import { GitHub } from "@/components/icon/github";
import { Instagram } from "@/components/icon/instagram";
import { TikTok } from "@/components/icon/tiktok";
import { LinkedIn } from "@/components/icon/linkedin";
import TopProducts from "@/components/TopProducts";

export default function Home() {
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

      <TopProducts />

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
