import type { ComponentType } from "react";

export interface PantryRecipe {
  name: string;
  price: string;
  liquid: "kopisusu" | "pandan" | "matcha";
}

export interface PantryStartup {
  id: string;
  num: string;
  name: string;
  tagline: string;
  /** brand color used on the die-cut sticker */
  color: string;
  /** readable ink on top of `color` */
  ink: string;
  stickerTilt: number;
  recipe: PantryRecipe;
  Logo: ComponentType<{ className?: string }>;
}

function StartupLogo({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- sized via className at every call site
    <img
      src={src}
      alt={alt}
      className={`object-contain ${className ?? ""}`}
      draggable={false}
    />
  );
}

function MusicMatcherLogo({ className }: { className?: string }) {
  return (
    <StartupLogo
      src="/pantry/logos/musicmatcher.png"
      alt="Music Matcher"
      className={className}
    />
  );
}

function UnvibeLogo({ className }: { className?: string }) {
  return (
    <StartupLogo
      src="/pantry/logos/unvibe.png"
      alt="Unvibe"
      className={className}
    />
  );
}

function InfotikLogo({ className }: { className?: string }) {
  return (
    <StartupLogo
      src="/pantry/logos/infotik.png"
      alt="Infotik"
      className={className}
    />
  );
}

/**
 * Batch S3 signatures — sourced from application_rows.csv:
 * Music Matcher, Unvibe, Infotik — paired with everyday Indonesian café staples.
 */
export const PANTRY_STARTUPS: PantryStartup[] = [
  {
    id: "musicmatcher",
    num: "01",
    name: "musicmatcher",
    tagline:
      "Unbiased AI music streaming that matches on your actions and psychology — not the chart.",
    color: "#12b981",
    ink: "#ffffff",
    stickerTilt: -4,
    Logo: MusicMatcherLogo,
    recipe: {
      name: "Es Kopi Susu Gula Aren",
      price: "28K",
      liquid: "kopisusu",
    },
  },
  {
    id: "unvibe",
    num: "02",
    name: "unvibe",
    tagline:
      "A Mac-first learning layer that helps builders understand AI-generated code before they ship it.",
    color: "#7d52d1",
    ink: "#ffffff",
    stickerTilt: 3,
    Logo: UnvibeLogo,
    recipe: {
      name: "Kopi Pandan Latte",
      price: "30K",
      liquid: "pandan",
    },
  },
  {
    id: "infotik",
    num: "03",
    name: "infotik",
    tagline:
      "Educational short-form that turns mindless doomscrolling into fact-checked microlearning.",
    color: "#0f172a",
    ink: "#5bc0de",
    stickerTilt: -3,
    Logo: InfotikLogo,
    recipe: {
      name: "Es Matcha Susu",
      price: "32K",
      liquid: "matcha",
    },
  },
];
