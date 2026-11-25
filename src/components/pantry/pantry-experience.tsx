"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { PANTRY_STARTUPS } from "./pantry-data";
import { PantryCup, PantryMiniCup } from "./pantry-cup";

/** clamp(0..1) smoothstep between two scroll milestones */
function smooth(edge0: number, edge1: number, p: number) {
  const t = Math.min(1, Math.max(0, (p - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Scroll timeline across the 380vh stage:
 *  p 0.00–0.20  dwell on musicmatcher  (sticker 0 front)
 *  p 0.20–0.40  spin −120°             (sticker 1 front)
 *  p 0.40–0.50  dwell on unvibe
 *  p 0.50–0.70  spin −120°             (sticker 2 front)
 *  p 0.70–1.00  dwell on infotik
 */
function rotationFor(p: number) {
  return -120 * smooth(0.2, 0.4, p) - 120 * smooth(0.5, 0.7, p);
}

function activeIndexFor(p: number) {
  if (p < 0.3) return 0;
  if (p < 0.6) return 1;
  return 2;
}

// Receipt-style jagged edges (top + bottom) — small, fine teeth.
// Teeth are sized in px so they stay consistent at any receipt width.
const TEAR_DEPTH = 10; // px
const TEAR_STEP = 16; // px between teeth

function tearClipFor(w: number, h: number, steps: number) {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    // Small irregular zigzag so it reads as torn paper, not a clean sawtooth.
    const topDip = i % 2 === 0 ? 0 : TEAR_DEPTH * (0.7 + ((i * 7) % 4) * 0.1);
    const bottomDip =
      i % 2 === 0 ? 0 : TEAR_DEPTH * (0.7 + ((i * 11) % 4) * 0.1);
    top.push(`${x.toFixed(1)}px ${topDip.toFixed(1)}px`);
    bottom.push(`${(w - x).toFixed(1)}px ${(h - bottomDip).toFixed(1)}px`);
  }
  return `polygon(${[...top, ...bottom].join(", ")})`;
}

/**
 * Measures the receipt and regenerates its jagged clip in px on resize.
 * The outline and the paper get separate polygons sized to their own boxes
 * (2px apart) but share a tooth count, so the 1px outline tracks every
 * tooth — including the bottom edge.
 */
function useTearClip() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [clips, setClips] = useState<{ outer?: string; inner?: string }>({});
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      // Even step count so both right-hand corners land on an up-tooth.
      const steps = Math.max(4, Math.round(w / TEAR_STEP / 2) * 2);
      setClips({
        outer: tearClipFor(w, h, steps),
        inner: tearClipFor(w - 2, h - 2, steps),
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, outerClip: clips.outer, innerClip: clips.inner };
}

function StagePanel({
  active,
  trackRef,
}: {
  active: number;
  trackRef: Ref<HTMLDivElement>;
}) {
  return (
    <div className="relative h-[320px] overflow-hidden md:h-[420px]">
      {/* vertically scrolling track — position is driven directly by scroll
          progress in PantryExperience, in sync with the cup rotation */}
      <div ref={trackRef} className="h-full will-change-transform">
        {PANTRY_STARTUPS.map((s, i) => (
          <article
            key={s.id}
            aria-hidden={i !== active}
            className="flex h-full flex-col justify-center"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center">
                <s.Logo className="size-9 drop-shadow-[0_1px_1px_rgba(15,23,42,0.24)]" />
              </span>
              <h2 className="text-3xl font-semibold lowercase tracking-tight">
                {s.name}
              </h2>
            </div>
            <p className="mt-2 max-w-sm text-base leading-relaxed tracking-normal text-stone-600">
              {s.tagline}
            </p>

            <div className="my-5 h-px w-full bg-stone-900/10" />

            <div className="flex items-baseline gap-3">
              <h3 className="text-lg font-semibold tracking-tight">
                {s.recipe.name}
              </h3>
              <span className="flex-1 border-b border-dotted border-stone-400" />
              <span className="text-lg font-semibold tracking-tight">
                {s.recipe.price}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* blurred vertical entries — slides blur as they enter/exit */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20 backdrop-blur-sm [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 backdrop-blur-sm [mask-image:linear-gradient(to_top,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent"
      />
    </div>
  );
}

function MenuBoard() {
  const { ref, outerClip, innerClip } = useTearClip();
  return (
    <section className="relative mx-auto max-w-2xl px-6 pb-28 lg:max-w-5xl">
      {/* black backing clipped with the same px polygon as the paper inside —
          the 1px padding lets it show through as a solid outline that
          follows every jagged tooth */}
      <div
        ref={ref}
        className="bg-black p-px"
        style={{
          clipPath: outerClip,
          filter: "drop-shadow(0 22px 28px rgba(41,37,36,0.18))",
        }}
      >
        <div
          className="relative overflow-hidden bg-[#fffcf7] px-6 pb-16 pt-14 sm:px-12"
          style={{ clipPath: innerClip }}
        >
          {/* thermal-paper stripe texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0 11px, rgba(41,37,36,0.03) 11px 12px)",
            }}
          />

          {/* side sprocket / strip marks */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-16 left-0 top-10 w-3 border-r border-dashed border-stone-300/80"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-16 right-0 top-10 w-3 border-l border-dashed border-stone-300/80"
          />

          <div className="relative">
            {/* items — stacked on mobile, side-by-side on wide screens */}
            <div className="space-y-10 lg:flex lg:space-y-0 lg:divide-x lg:divide-dashed lg:divide-stone-300">
              {PANTRY_STARTUPS.map((s, i) => (
                <article
                  key={s.id}
                  className="flex flex-col items-center lg:flex-1 lg:px-8 lg:first:pl-0 lg:last:pr-0"
                >
                  {i > 0 ? (
                    <div
                      aria-hidden
                      className="mb-10 w-full border-t border-dashed border-stone-300 lg:hidden"
                    />
                  ) : null}

                  <PantryMiniCup startup={s} />

                  <div className="mt-2 flex w-full items-baseline gap-3">
                    <span className="font-mono text-sm tracking-normal text-stone-500">
                      [{s.num}]
                    </span>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {s.recipe.name}
                    </h3>
                    <span className="flex-1 border-b border-dotted border-stone-400" />
                    <span className="text-lg font-semibold tracking-tight">
                      {s.recipe.price}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnershipSection() {
  return (
    <section className="px-6 pb-28 pt-2 text-center">
      <h2 className="text-3xl font-semibold tracking-tight">
        Pour with us next season
      </h2>
      <p className="mx-auto mt-3 max-w-xs text-base leading-relaxed tracking-normal text-stone-600">
        Want your startup&apos;s recipe on the next menu? Book a call with The
        Pantry team.
      </p>
      <a
        href="https://cal.com/fydemy"
        target="_blank"
        rel="noreferrer"
        className="group mt-7 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-base font-semibold tracking-tight text-white transition-colors hover:bg-stone-700"
      >
        Book via Cal.com
        <span
          aria-hidden
          className="transition-transform duration-300 group-hover:translate-x-0.5"
        >
          →
        </span>
      </a>
    </section>
  );
}

export function PantryExperience() {
  const stageRef = useRef<HTMLElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const update = () => {
      rafRef.current = 0;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      if (groupRef.current) {
        groupRef.current.style.transform = `rotateX(-20deg) rotateY(${rotationFor(
          p,
        )}deg)`;
      }
      // Panel slides in lockstep with the cup spin — same smoothstepped
      // milestones, so it eases smoothly into each dwell instead of snapping.
      if (trackRef.current) {
        const slide = smooth(0.2, 0.4, p) + smooth(0.5, 0.7, p);
        trackRef.current.style.transform = `translateY(${-slide * 100}%)`;
      }
      setActive((prev) => {
        const next = activeIndexFor(p);
        return prev === next ? prev : next;
      });
    };
    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="bg-background text-stone-900">
      <style>{`
        @keyframes pantry-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pantry-steam {
          0% { transform: translateY(6px) scaleY(0.75); opacity: 0; }
          30% { opacity: 0.35; }
          100% { transform: translateY(-56px) translateX(8px) scaleY(1.1); opacity: 0; }
        }
        .pantry-bob { animation: pantry-bob 5.5s ease-in-out infinite; }
        .pantry-steam-wisp { animation: pantry-steam 4.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pantry-bob, .pantry-steam-wisp { animation: none !important; }
        }
      `}</style>

      {/* hero — simple header with the startup list */}
      <section className="mx-auto max-w-xl px-6 pb-14 pt-20 sm:pt-24">
        <h1 className="text-center text-5xl font-semibold tracking-tight sm:text-6xl">
          The Pantry
        </h1>
        <ul className="mt-10 space-y-4">
          {PANTRY_STARTUPS.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <span className="inline-flex size-6 shrink-0 items-center justify-center">
                <s.Logo className="size-6 drop-shadow-[0_1px_1px_rgba(15,23,42,0.22)]" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                {s.recipe.name}
              </span>
              <span className="shrink-0 text-sm tracking-normal text-stone-500">
                by {s.name}
              </span>
              <span
                aria-hidden
                className="flex-1 border-b border-dotted border-stone-400"
              />
              <span className="text-lg font-semibold tracking-tight">
                {s.recipe.price}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* scroll-driven stage */}
      <section ref={stageRef} className="relative h-[380vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-2 px-6 md:grid-cols-2 md:gap-8">
            <div className="order-3 md:order-1">
              <StagePanel active={active} trackRef={trackRef} />
            </div>
            {/* fixed-height cell on small screens so the cup stays fully
                visible and vertically centered at the top of the stage */}
            <div className="order-1 flex h-[250px] items-center justify-center sm:h-[330px] md:order-2 md:h-auto">
              <div className="scale-[0.58] sm:scale-75 md:scale-90 lg:scale-100">
                <PantryCup
                  groupRef={groupRef}
                  liquid={PANTRY_STARTUPS[active]?.recipe.liquid}
                />
              </div>
            </div>

            {/* progress dots — below the cup on small screens, right edge on md+ */}
            <div className="order-2 flex justify-center gap-2.5 md:absolute md:right-8 md:top-1/2 md:-translate-y-1/2 md:flex-col">
              {PANTRY_STARTUPS.map((s, i) => (
                <span
                  key={s.id}
                  className={`size-2 rounded-full transition-colors duration-300 ${
                    i === active ? "bg-stone-900" : "bg-stone-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* the full menu, receipt style */}
      <MenuBoard />

      <PartnershipSection />
    </div>
  );
}
