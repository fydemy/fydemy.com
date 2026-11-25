import type { Ref } from "react";
import { PANTRY_STARTUPS, type PantryStartup } from "./pantry-data";

/**
 * High-detail takeaway coffee cup built from 48 CSS 3D trapezoid panels.
 * Smooth directional studio lighting, a multi-ring rolled paper lip,
 * a minimalist matte-ribbed sleeve with cast shadow, and layered
 * beverage crema/microfoam surfaces.
 */

const N = 48;
const HEIGHT = 300;
const SLANT = 4.2; // degrees — realistic takeaway cup taper

// Calibrated for R_mid = 88px (R_top ≈ 99px, R_bot ≈ 77px) with 1px+ overlap.
const BODY_W = 15;
const BODY_DX = 1.6;
const SLEEVE_W = 15;
const SLEEVE_DX = 0.7;

const ANGLES = Array.from({ length: N }, (_, i) => (i * 360) / N);

const panelBase = {
  position: "absolute",
  left: 0,
  top: 0,
  backfaceVisibility: "hidden",
} as const;

/**
 * Studio cylinder shading: key light front-left (-35°), soft fill on
 * the right rim (+110°), deep core shadow toward the rear.
 */
function bodyShadeFor(angle: number) {
  const keyRad = ((angle + 34) * Math.PI) / 180;
  const rimRad = ((angle - 115) * Math.PI) / 180;
  const key = Math.pow((Math.cos(keyRad) + 1) / 2, 1.35);
  const spec = Math.pow(Math.max(0, Math.cos(keyRad)), 9);
  const rim = Math.pow((Math.cos(rimRad) + 1) / 2, 2.2) * 0.25;
  const t = Math.min(1, key * 0.82 + rim + spec * 0.22);

  const r = Math.round(224 + t * 30); // 224 → 254
  const g = Math.round(218 + t * 31); // 218 → 249
  const b = Math.round(207 + t * 34); // 207 → 241
  return `rgb(${r}, ${g}, ${b})`;
}

function sleevePaletteFor(angle: number) {
  const keyRad = ((angle + 34) * Math.PI) / 180;
  const rimRad = ((angle - 115) * Math.PI) / 180;
  const key = Math.pow((Math.cos(keyRad) + 1) / 2, 1.25);
  const rim = Math.pow((Math.cos(rimRad) + 1) / 2, 2.4) * 0.22;
  const t = Math.min(1, key * 0.86 + rim);

  // Warm natural kraft-stone matte palette
  const hiR = Math.round(182 + t * 36);
  const hiG = Math.round(150 + t * 32);
  const hiB = Math.round(114 + t * 28);
  const loR = Math.round(166 + t * 34);
  const loG = Math.round(135 + t * 30);
  const loB = Math.round(101 + t * 26);

  return {
    hi: `rgb(${hiR}, ${hiG}, ${hiB})`,
    lo: `rgb(${loR}, ${loG}, ${loB})`,
  };
}

function BodySegments() {
  return (
    <>
      {ANGLES.map((angle) => {
        const base = bodyShadeFor(angle);
        return (
          <div
            key={angle}
            style={{
              ...panelBase,
              width: BODY_W,
              height: HEIGHT,
              marginLeft: -BODY_W / 2,
              transform: `rotateY(${angle}deg) translateZ(88px) rotateX(-${SLANT}deg)`,
              clipPath: `polygon(0 0, ${BODY_W}px 0, ${BODY_W - BODY_DX}px 100%, ${BODY_DX}px 100%)`,
              background: [
                // Crisp ambient-occlusion crease directly under the rolled lip
                "linear-gradient(180deg, rgba(42,32,22,0.22) 0px, rgba(42,32,22,0.06) 9px, rgba(255,255,255,0) 24px, rgba(35,28,20,0.03) 68%, rgba(35,28,20,0.14) 100%)",
                // Soft cast shadow just below the sleeve bottom edge (y ≈ 206/300 = 68.7%)
                "linear-gradient(180deg, transparent 67%, rgba(42,30,18,0.16) 69%, rgba(42,30,18,0.05) 73%, transparent 78%)",
                base,
              ].join(", "),
            }}
          />
        );
      })}
    </>
  );
}

// Centered vertically on the 300px cup body.
const SLEEVE_HEIGHT = 112;
const SLEEVE_TOP = (HEIGHT - SLEEVE_HEIGHT) / 2; // y=94
const STICKER_H = 54;
const STICKER_TOP = (HEIGHT - STICKER_H) / 2; // y=123
const STICKER_ARC_STEPS = 9; // curved clear vinyl strips hugging the sleeve
const STICKER_ARC_SPAN = 84; // degrees across the front of the sleeve
const STICKER_STEP_ANGLE = STICKER_ARC_SPAN / (STICKER_ARC_STEPS - 1);
const STICKER_STRIP_W = 19;
const STICKER_CONTENT_W = 124;

function Sleeve() {
  return (
    <>
      {ANGLES.map((angle) => {
        const { hi, lo } = sleevePaletteFor(angle);
        return (
          <div
            key={angle}
            style={{
              ...panelBase,
              top: SLEEVE_TOP,
              width: SLEEVE_W,
              height: SLEEVE_HEIGHT,
              marginLeft: -SLEEVE_W / 2,
              transform: `rotateY(${angle}deg) translateZ(90.6px) rotateX(-${SLANT}deg)`,
              clipPath: `polygon(0 0, ${SLEEVE_W}px 0, ${SLEEVE_W - SLEEVE_DX}px 100%, ${SLEEVE_DX}px 100%)`,
              background: [
                // Top & bottom beveled sleeve edges
                "linear-gradient(180deg, rgba(255,250,242,0.42) 0px, rgba(255,250,242,0.12) 2px, transparent 5px, transparent calc(100% - 5px), rgba(52,36,20,0.28) calc(100% - 1.5px), rgba(32,20,10,0.42) 100%)",
                // Fine modern micro-fluted kraft texture
                `repeating-linear-gradient(90deg, ${hi} 0 2.5px, ${lo} 2.5px 4px)`,
              ].join(", "),
            }}
          />
        );
      })}
    </>
  );
}

function RolledLip() {
  return (
    <>
      {/* lower underside of the rolled lip */}
      <div
        style={{
          ...panelBase,
          width: 214,
          height: 214,
          marginLeft: -107,
          marginTop: -107,
          borderRadius: "50%",
          transform: "rotateX(90deg) translateZ(0px)",
          background:
            "radial-gradient(circle, transparent 0 94px, #c4b9a6 94px 98px, #d8cfc0 98px 104px, #bdb29e 104px 107px)",
        }}
      />
      {/* mid-bead of the rolled paper rim */}
      <div
        style={{
          ...panelBase,
          width: 216,
          height: 216,
          marginLeft: -108,
          marginTop: -108,
          borderRadius: "50%",
          transform: "rotateX(90deg) translateZ(2.5px)",
          background:
            "radial-gradient(circle, transparent 0 94px, #dfd7c8 94px 97px, #f7f4ec 97px 105px, #d5cbb9 105px 108px)",
        }}
      />
      {/* top specular highlight on the rolled lip */}
      <div
        style={{
          ...panelBase,
          width: 214,
          height: 214,
          marginLeft: -107,
          marginTop: -107,
          borderRadius: "50%",
          transform: "rotateX(90deg) translateZ(4.5px)",
          background:
            "radial-gradient(circle, transparent 0 95px, #eee8dc 95px 98px, #ffffff 98px 103px, #eae3d5 103px 107px)",
        }}
      />
      {/* inner white paper cup wall visible above the beverage */}
      <div
        style={{
          ...panelBase,
          width: 194,
          height: 194,
          marginLeft: -97,
          marginTop: -97,
          borderRadius: "50%",
          transform: "rotateX(90deg) translateZ(-3px)",
          background:
            "radial-gradient(circle at 46% 38%, #e9e2d6 0%, #dcd3c4 58%, #c2b7a4 88%, #ab9f8b 100%)",
        }}
      />
    </>
  );
}

const LIQUID_SURFACES: Record<PantryStartup["recipe"]["liquid"], string> = {
  kopisusu: [
    // Soft glossy reflection & milk-swirl microfoam
    "radial-gradient(ellipse 46% 24% at 36% 28%, rgba(255,252,246,0.52) 0%, rgba(255,252,246,0.10) 58%, transparent 78%)",
    "radial-gradient(ellipse 36% 28% at 62% 58%, rgba(242,216,182,0.52) 0%, rgba(220,180,136,0.18) 54%, transparent 76%)",
    "radial-gradient(circle at 38% 64%, rgba(250,234,210,0.34) 0%, transparent 32%)",
    // Espresso + palm sugar body + darker meniscus edge
    "radial-gradient(circle at 50% 50%, #c08c58 0%, #a36f3f 38%, #774b26 70%, #4d2c12 89%, #2f1909 100%)",
  ].join(", "),
  pandan: [
    "radial-gradient(ellipse 46% 24% at 36% 28%, rgba(255,255,250,0.55) 0%, rgba(255,255,250,0.12) 58%, transparent 78%)",
    "radial-gradient(ellipse 40% 30% at 60% 56%, rgba(190,218,162,0.50) 0%, rgba(154,186,128,0.18) 56%, transparent 78%)",
    "radial-gradient(circle at 40% 62%, rgba(244,240,224,0.38) 0%, transparent 34%)",
    "radial-gradient(circle at 50% 50%, #a88a62 0%, #896d49 42%, #634d30 74%, #3f301c 92%, #291e10 100%)",
  ].join(", "),
  matcha: [
    "radial-gradient(ellipse 46% 24% at 36% 28%, rgba(255,255,250,0.55) 0%, rgba(255,255,250,0.12) 58%, transparent 78%)",
    "radial-gradient(ellipse 38% 30% at 58% 58%, rgba(226,240,202,0.58) 0%, rgba(192,216,158,0.22) 55%, transparent 78%)",
    "radial-gradient(circle at 38% 62%, rgba(242,248,228,0.36) 0%, transparent 32%)",
    "radial-gradient(circle at 50% 50%, #86ab5c 0%, #6b8e44 42%, #4f6d2e 74%, #354c1e 92%, #233312 100%)",
  ].join(", "),
};

function CoffeeTop({
  liquid = "kopisusu",
}: {
  liquid?: PantryStartup["recipe"]["liquid"];
}) {
  return (
    <>
      <RolledLip />
      {/* recessed beverage surface inside the cup */}
      <div
        style={{
          ...panelBase,
          width: 186,
          height: 186,
          marginLeft: -93,
          marginTop: -93,
          borderRadius: "50%",
          transform: "rotateX(90deg) translateZ(-9px)",
          background: LIQUID_SURFACES[liquid],
          boxShadow:
            "inset 0 0 12px rgba(24,14,6,0.58), inset 0 2px 6px rgba(0,0,0,0.35)",
        }}
      />
    </>
  );
}

/**
 * Transparent glossy vinyl sticker wrapped smoothly around the curved sleeve:
 * 9 curved clear-acetate film strips hug the cylinder radius (`91.3px`) with
 * specular gloss & edge highlights, while the transparent-background logo and
 * full wordmark float flush in front with zero white box or clipping.
 */
function CurvedGlossySticker({
  startup,
  baseAngle,
}: {
  startup: PantryStartup;
  baseAngle: number;
}) {
  return (
    <>
      {Array.from({ length: STICKER_ARC_STEPS }, (_, idx) => {
        const offsetAngle =
          (idx - (STICKER_ARC_STEPS - 1) / 2) * STICKER_STEP_ANGLE;
        const isLeft = idx === 0;
        const isRight = idx === STICKER_ARC_STEPS - 1;
        // Gloss highlight sweeps from front-left to front-right across the vinyl film
        const glossPos = (idx / (STICKER_ARC_STEPS - 1)) * 100;
        return (
          <div
            key={idx}
            style={{
              ...panelBase,
              top: STICKER_TOP,
              width: STICKER_STRIP_W,
              height: STICKER_H,
              marginLeft: -STICKER_STRIP_W / 2,
              transform: `rotateY(${baseAngle + offsetAngle}deg) translateZ(91.4px) rotateX(-${SLANT}deg)`,
              borderTop: "1px solid rgba(255,255,255,0.58)",
              borderBottom: "1px solid rgba(255,255,255,0.30)",
              borderLeft: isLeft
                ? "1px solid rgba(255,255,255,0.50)"
                : undefined,
              borderRight: isRight
                ? "1px solid rgba(255,255,255,0.42)"
                : undefined,
              borderTopLeftRadius: isLeft ? 14 : 0,
              borderBottomLeftRadius: isLeft ? 14 : 0,
              borderTopRightRadius: isRight ? 14 : 0,
              borderBottomRightRadius: isRight ? 14 : 0,
              background: [
                // Crisp diagonal vinyl gloss sheen across the transparent film
                `linear-gradient(122deg, rgba(255,255,255,0.34) ${Math.max(0, glossPos - 25)}%, rgba(255,255,255,0.06) ${glossPos}%, rgba(255,255,255,0.22) ${Math.min(100, glossPos + 28)}%)`,
                // Subtle translucent clear film tint so the kraft sleeve shows cleanly through
                "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 55%, rgba(24,18,12,0.06) 100%)",
              ].join(", "),
              boxShadow: "0 1px 4px rgba(24,16,8,0.14)",
            }}
          />
        );
      })}

      {/* Transparent logo + wordmark centered cleanly on the glossy film */}
      <div
        style={{
          ...panelBase,
          top: STICKER_TOP,
          width: STICKER_CONTENT_W,
          height: STICKER_H,
          marginLeft: -STICKER_CONTENT_W / 2,
          transform: `rotateY(${baseAngle}deg) translateZ(92.8px) rotateX(-${SLANT}deg)`,
        }}
      >
        <div className="relative flex size-full items-center justify-center gap-2 overflow-visible px-2">
          <startup.Logo className="size-7 shrink-0 drop-shadow-[0_1px_2px_rgba(24,16,8,0.42)]" />
          <span className="whitespace-nowrap text-[12px] font-bold lowercase tracking-tight text-stone-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]">
            {startup.name}
          </span>
        </div>
      </div>
    </>
  );
}

function Stickers() {
  return (
    <>
      {PANTRY_STARTUPS.map((s, i) => (
        <CurvedGlossySticker key={s.id} startup={s} baseAngle={i * 120} />
      ))}
    </>
  );
}

export function PantryCup({
  groupRef,
  liquid = "kopisusu",
}: {
  groupRef: Ref<HTMLDivElement>;
  liquid?: PantryStartup["recipe"]["liquid"];
}) {
  return (
    <div
      className="relative mx-auto h-[430px] w-[320px] select-none"
      style={{ perspective: "1200px" }}
      aria-hidden
    >
      {/* steam — light, soft wisps */}
      <div className="absolute left-1/2 top-2">
        {[0, 1].map((i) => (
          <span
            key={i}
            className="pantry-steam-wisp absolute h-14 w-1.5 rounded-full bg-gradient-to-t from-transparent via-stone-300/40 to-transparent blur-[4px]"
            style={{
              left: -8 + i * 16,
              top: 0,
              animationDelay: `${i * 2.1}s`,
            }}
          />
        ))}
      </div>

      {/* bobbing wrapper — independent of the scroll-driven rotation */}
      <div
        className="pantry-bob absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          ref={groupRef}
          className="absolute left-1/2 top-[74px] size-0"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(-20deg) rotateY(0deg)",
          }}
        >
          {/* recessed bottom cap */}
          <div
            style={{
              ...panelBase,
              top: HEIGHT,
              width: 154,
              height: 154,
              marginLeft: -77,
              marginTop: -77,
              borderRadius: "50%",
              transform: "rotateX(90deg)",
              background:
                "radial-gradient(circle, #d4ccbd 0 58px, #ded7c9 58px 72px, #c4baa9 72px 77px)",
            }}
          />

          <BodySegments />
          <Sleeve />
          <Stickers />
          <CoffeeTop liquid={liquid} />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact realistic takeaway cup preview for each startup recipe card —
 * shows the matching drink surface and full horizontal logo + wordmark.
 */
export function PantryMiniCup({ startup }: { startup: PantryStartup }) {
  const index = PANTRY_STARTUPS.findIndex((s) => s.id === startup.id);
  const rotY = -(index >= 0 ? index : 0) * 120;

  return (
    <div
      className="relative mx-auto h-[196px] w-[168px] select-none overflow-visible"
      aria-hidden
    >
      <div
        className="absolute left-1/2 top-1/2 h-[430px] w-[320px] -translate-x-1/2 -translate-y-1/2 scale-[0.44]"
        style={{ perspective: "1200px" }}
      >
        <div
          className="absolute left-1/2 top-[74px] size-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(-20deg) rotateY(${rotY}deg)`,
          }}
        >
          <div
            style={{
              ...panelBase,
              top: HEIGHT,
              width: 154,
              height: 154,
              marginLeft: -77,
              marginTop: -77,
              borderRadius: "50%",
              transform: "rotateX(90deg)",
              background:
                "radial-gradient(circle, #d4ccbd 0 58px, #ded7c9 58px 72px, #c4baa9 72px 77px)",
            }}
          />
          <BodySegments />
          <Sleeve />
          <Stickers />
          <CoffeeTop liquid={startup.recipe.liquid} />
        </div>
      </div>
    </div>
  );
}
