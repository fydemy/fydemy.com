import type { Metadata } from "next";
import localFont from "next/font/local";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PantryExperience } from "@/components/pantry/pantry-experience";

const aurelia = localFont({
  src: "../../../public/fonts/aurelia.woff2",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    absolute: "The Pantry",
  },
  description:
    "Three batch startups, three custom recipes, one spinning cup. Welcome to The Pantry, Fydemy's exclusive café.",
  openGraph: {
    title: "The Pantry",
    description:
      "Three batch startups, three custom recipes, one spinning cup. Welcome to The Pantry, Fydemy's exclusive café.",
  },
};

export default function PantryPage() {
  return (
    <div
      className={`${aurelia.className} flex min-h-screen flex-col bg-background text-base tracking-normal`}
    >
      <PublicSiteHeader hideMarquee />
      <main className="flex-1">
        <PantryExperience />
      </main>
      <PublicSiteFooter />
    </div>
  );
}
