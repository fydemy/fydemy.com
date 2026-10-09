"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { SketchGlobe } from "@/components/sketch-globe";
import { FounderFlowDiagram } from "@/components/founder-flow-diagram";
import { LandingBenefitsGrid } from "@/components/landing-benefits-grid";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/optimized-image";
import { siteConfig } from "@/lib/seo";

export function GlobeLandingPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const hasSession = Boolean(session?.user);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicSiteHeader hideMarquee />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <div className="space-y-3 max-w-md">
          <h1 className="text-3xl font-semibold tracking-tighter md:text-4xl">
            Working room for ambitious founders.
          </h1>
          <p className="mx-auto text-muted-foreground">
            Made by Gen Z. Don't build alone. 😭
          </p>
        </div>

       <div className="bg-gradient-to-tl from-blue-600 to-transparent p-1 rounded-full">
        <Button
          onClick={() =>
            hasSession
              ? router.push("/app")
              : authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/app",
                })
          }
          className="rounded-full px-10 py-6"
        >
          <ArrowRight /> {hasSession ? "Dashboard" : "Apply Now"}
        </Button>
       </div>

        <div className="flex items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">Featured on</p>
          <a
            href={siteConfig.links.ntuArticle}
            target="_blank"
            rel="noreferrer"
            className="inline-block"
          >
            <Logo src="/logo/ntu.png" name="NTU" className="h-28 w-auto" />
          </a>
        </div>

        <SketchGlobe className="max-w-lg md:max-w-xl" />

        <LandingBenefitsGrid />

        <FounderFlowDiagram className="w-full max-w-3xl" />

       <div className="flex flex-col gap-6 md:flex-row mb-16 items-center justify-center">
        <div className="bg-gradient-to-tl from-purple-600 to-transparent p-1 rounded-full w-fit">
          <Link
            href={siteConfig.discordInviteUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              className: "rounded-full! px-10 py-6",
            })}
          >
            <ArrowRight /> Group
          </Link>
        </div>
          <div className="bg-gradient-to-tl from-purple-600 to-transparent p-1 rounded-full">
          <Link className={buttonVariants({ className: "rounded-full! px-10 py-6" })} target="_blank" rel="noreferrer" href="https://cal.com/nathanl/partnerships">
            Become a Partner
          </Link>
          </div>
       </div>

        <section className="w-full max-w-3xl space-y-6 text-left">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            FAQ
          </h2>
          <Accordion>
            <AccordionItem value="vc-funding">
              <AccordionTrigger>
                Does this program guarantee VC funding after 30 days?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p>
                  No, we don&apos;t guarantee funding. Getting funded depends
                  100% on your product&apos;s traction and execution.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="no-startup">
              <AccordionTrigger>
                I don&apos;t have a statup, but I'm looking for experience in working at startups. Can I join?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p>
                  Yes, just join our group and we&apos;ll help you find a startup to work at.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sector">
              <AccordionTrigger>
                Which sectors are you focusing on?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p>
                  We're accepting applications from all sectors. Including hardware, manufacturing, software, and more.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="path">
              <AccordionTrigger>
                Can I join all the options simultaneously?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p>
                  Yes!
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <div className="mt-16">
          <h2 className="text-sm text-muted-foreground">Supported by</h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {(
              [
                {
                  src: "/support/notion.svg",
                  name: "Notion",
                  href: siteConfig.links.notion,
                },
                {
                  src: "/support/boardy.jpeg",
                  name: "Boardy",
                  href: siteConfig.links.boardy,
                },
                {
                  src: "/support/liftoff.jpeg",
                  name: "Liftoff",
                  href: siteConfig.links.liftoff,
                },
              ] as const
            ).map((supporter) => (
              <a
                key={supporter.name}
                href={supporter.href}
                target="_blank"
                rel="noreferrer"
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
                className="inline-block select-none opacity-90 transition-opacity hover:opacity-100"
                title={supporter.name}
              >
                <Logo
                  src={supporter.src}
                  name={supporter.name}
                  className="h-10 w-auto"
                />
              </a>
            ))}
          </div>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
