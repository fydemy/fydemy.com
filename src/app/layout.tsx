import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Merriweather } from "next/font/google";
import "./globals.css";
import TRPCLayout from "@/components/provider/trpc";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

const merriweatherHeading = Merriweather({subsets:['latin'],variable:'--font-heading'});

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LaunchPad — Discover great products",
  description: "Discover, submit, and vote on the best new products.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-mono", jetbrainsMono.variable, merriweatherHeading.variable)}>
      <body className={`${geist.variable} min-h-screen bg-zinc-50 antialiased`}>
        <TRPCLayout>
          <Navbar />
          <main>{children}</main>
        </TRPCLayout>
      </body>
    </html>
  );
}
