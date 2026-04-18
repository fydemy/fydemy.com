import type { Metadata } from "next";
import { JetBrains_Mono, Merriweather } from "next/font/google";
import "./globals.css";
import TRPCLayout from "@/components/provider/trpc";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

const merriweatherHeading = Merriweather({subsets:['latin'],variable:'--font-heading'});

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/fav.svg",
  },
  title: {
    default: "Fydemy — Tech RnD community",
    template: "%s | Fydemy",
  },
  description: "A tech RnD community for validation and research.",
  openGraph: {
    siteName: "Fydemy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(jetbrainsMono.variable, merriweatherHeading.variable)}>
      <body className="antialiased">
        <TRPCLayout>
          <Navbar />
          <main>{children}</main>
        </TRPCLayout>
      </body>
    </html>
  );
}
