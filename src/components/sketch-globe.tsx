"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SketchFlag } from "@/components/sketch-flag";
import { LAND_RINGS, type LandRing } from "@/lib/globe-lands";
import { cn } from "@/lib/utils";

const CX = 200;
const CY = 200;
const R = 148;

const MARKERS = [
  { id: "in", label: "India", lat: 22, lng: 79 },
  { id: "us", label: "United States", lat: 39, lng: -98 },
  { id: "arab", label: "Arabia", lat: 24, lng: 46 },
  { id: "id", label: "Indonesia", lat: -2, lng: 118 },
  { id: "sg", label: "Singapore", lat: 1.3, lng: 104 },
  { id: "tr", label: "Türkiye", lat: 39, lng: 35 },
  { id: "kr", label: "South Korea", lat: 36.5, lng: 128 },
  { id: "uk", label: "United Kingdom", lat: 54, lng: -2 },
] as const;

type Projected = { x: number; y: number; z: number };

function project(
  lat: number,
  lng: number,
  rotation: number,
  radius = R,
  cx = CX,
  cy = CY,
): Projected {
  const phi = (lat * Math.PI) / 180;
  const lambda = ((lng + rotation) * Math.PI) / 180;
  const x = radius * Math.cos(phi) * Math.sin(lambda);
  const y = -radius * Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(lambda);
  return { x: cx + x, y: cy + y, z };
}

function graticuleMeridians(rotation: number) {
  return [-90, -60, -30, 0, 30, 60, 90].map((lng) => {
    const points: string[] = [];
    let drawing = false;
    for (let lat = -85; lat <= 85; lat += 3) {
      const p = project(lat, lng, rotation);
      if (p.z > -0.05) {
        points.push(`${drawing ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
        drawing = true;
      } else {
        drawing = false;
      }
    }
    return { lng, d: points.join(" ") };
  });
}

function graticuleParallels(rotation: number) {
  return [-60, -30, 0, 30, 60].map((lat) => {
    const points: string[] = [];
    let drawing = false;
    for (let lng = -180; lng <= 180; lng += 3) {
      const p = project(lat, lng, rotation);
      if (p.z > 0.02) {
        points.push(`${drawing ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
        drawing = true;
      } else {
        drawing = false;
      }
    }
    return { lat, d: points.join(" ") };
  });
}

function projectSurface(
  lat: number,
  lng: number,
  rotation: number,
): Projected & { ux: number; uy: number } {
  const point = project(lat, lng, rotation);
  const dx = point.x - CX;
  const dy = point.y - CY;
  const len = Math.hypot(dx, dy) || 1;
  return { ...point, ux: dx / len, uy: dy / len };
}

function projectFlag(
  lat: number,
  lng: number,
  rotation: number,
  scale: number,
) {
  const surface = projectSurface(lat, lng, rotation);
  const pinLength = 22 + scale * 6;
  const flagHeight = 20 * scale;
  const pinEndX = surface.x + surface.ux * pinLength;
  const pinEndY = surface.y + surface.uy * pinLength;
  const flagX = pinEndX - 14 * scale;
  const flagY = pinEndY - flagHeight;

  return {
    ...surface,
    pinEndX,
    pinEndY,
    flagX,
    flagY,
    scale,
  };
}

function visibleLandSegments(ring: LandRing, rotation: number) {
  const projected = ring.map(([lat, lng]) => project(lat, lng, rotation));
  const segments: { d: string; avgZ: number }[] = [];
  let current: Projected[] = [];

  const flush = () => {
    if (current.length < 3) {
      current = [];
      return;
    }
    const avgZ = current.reduce((sum, p) => sum + p.z, 0) / current.length;
    const d = current
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    segments.push({ d: `${d} Z`, avgZ });
    current = [];
  };

  for (const point of projected) {
    if (point.z > 0.04) {
      current.push(point);
    } else {
      flush();
    }
  }
  flush();

  return segments;
}

const SPIN_PER_FRAME = 0.17;
const DRAG_DEGREES_PER_PX = 0.45;

export function SketchGlobe({ className }: { className?: string }) {
  const [rotation, setRotation] = useState(-20);
  const [dragging, setDragging] = useState(false);
  const rotationRef = useRef(-20);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      rotationRef.current = 18;
      setRotation(18);
      return;
    }

    let frame = 0;
    let raf = 0;

    const tick = () => {
      frame += 1;
      if (!draggingRef.current && frame % 2 === 0) {
        rotationRef.current += SPIN_PER_FRAME * 2;
        setRotation(rotationRef.current);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function isDesktopPointer(event: React.PointerEvent) {
    return event.pointerType === "mouse" || event.pointerType === "pen";
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDesktopPointer(event)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    lastXRef.current = event.clientX;
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const delta = event.clientX - lastXRef.current;
    lastXRef.current = event.clientX;
    rotationRef.current += delta * DRAG_DEGREES_PER_PX;
    setRotation(rotationRef.current);
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    draggingRef.current = false;
    setDragging(false);
  }

  const meridians = useMemo(() => graticuleMeridians(rotation), [rotation]);
  const parallels = useMemo(() => graticuleParallels(rotation), [rotation]);

  const landSegments = useMemo(() => {
    return LAND_RINGS.flatMap((ring, ringIndex) =>
      visibleLandSegments(ring, rotation).map((segment, segmentIndex) => ({
        ...segment,
        key: `${ringIndex}-${segmentIndex}`,
      })),
    ).sort((a, b) => a.avgZ - b.avgZ);
  }, [rotation]);

  const flags = useMemo(
    () =>
      MARKERS.map((marker) => ({
        ...marker,
        ...projectFlag(marker.lat, marker.lng, rotation, 0.85),
      }))
        .filter((m) => m.z > 0.12)
        .sort((a, b) => a.z - b.z),
    [rotation],
  );

  return (
    <div
      className={cn(
        "relative mx-auto aspect-square w-full max-w-md select-none",
        "md:cursor-grab",
        dragging && "md:cursor-grabbing",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg
        viewBox="0 0 400 400"
        className="h-full w-full text-foreground"
        role="img"
        aria-label="Rotating sketch globe with country flags"
      >
        <defs>
          <clipPath id="globe-clip">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
          <radialGradient
            id="globe-ocean"
            cx="38%"
            cy="32%"
            r="68%"
            fx="34%"
            fy="28%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.03" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.07" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.16" />
          </radialGradient>
          <radialGradient
            id="globe-limb"
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="70%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
          </radialGradient>
          <radialGradient
            id="globe-spec"
            cx="32%"
            cy="28%"
            r="42%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft outer atmosphere ring */}
        <circle
          cx={CX}
          cy={CY}
          r={R + 8}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.08"
        />
        <circle
          cx={CX}
          cy={CY}
          r={R + 3}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity="0.14"
          strokeDasharray="1.5 4"
        />

        <g clipPath="url(#globe-clip)">
          <circle cx={CX} cy={CY} r={R} fill="url(#globe-ocean)" />
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.15"
            opacity="0.55"
          />

          {parallels.map(({ lat, d }) =>
            d ? (
              <path
                key={`lat-${lat}`}
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth={lat === 0 ? 0.55 : 0.4}
                opacity={lat === 0 ? 0.22 : 0.12}
                strokeDasharray={lat === 0 ? "3 5" : "1.5 6"}
                strokeLinecap="round"
              />
            ) : null,
          )}

          {meridians.map(({ lng, d }) =>
            d ? (
              <path
                key={`lng-${lng}`}
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth={lng === 0 ? 0.55 : 0.4}
                opacity={lng === 0 ? 0.2 : 0.11}
                strokeDasharray={lng === 0 ? "3 5" : "1.5 6"}
                strokeLinecap="round"
              />
            ) : null,
          )}

          {landSegments.map((land) => (
            <g key={land.key}>
              <path
                d={land.d}
                className="fill-foreground/[0.11]"
                stroke="none"
              />
              {/* Offset ghost stroke — sketch double-pass */}
              <path
                d={land.d}
                fill="none"
                className="stroke-foreground/15"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                transform="translate(0.55 0.65)"
              />
              <path
                d={land.d}
                fill="none"
                className="stroke-foreground/55"
                strokeWidth="1.05"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="7 2.5 1.5 3.5"
              />
            </g>
          ))}

          <circle cx={CX} cy={CY} r={R} fill="url(#globe-limb)" />
          <circle cx={CX} cy={CY} r={R} fill="url(#globe-spec)" />
        </g>

        <g aria-hidden>
          {flags.map((marker) => (
            <g key={marker.id}>
              <line
                x1={marker.x}
                y1={marker.y}
                x2={marker.pinEndX}
                y2={marker.pinEndY}
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.55"
              />
              <rect
                x={marker.flagX - 2}
                y={marker.flagY - 2}
                width={28 * marker.scale + 4}
                height={20 * marker.scale + 4}
                rx={3}
                className="fill-background"
              />
              <g
                transform={`translate(${marker.flagX} ${marker.flagY}) scale(${marker.scale})`}
              >
                <SketchFlag id={marker.id} />
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
