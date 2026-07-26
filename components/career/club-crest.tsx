import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ClubTier } from "@/lib/career";

interface ClubCrestProps {
  name: string;
  tier?: ClubTier;
  logo?: string | null;
  size?: number;
  className?: string;
}

const TIER_PALETTE: Record<ClubTier, { bg: string; fg: string }> = {
  strong: { bg: "#FAEEDA", fg: "#854F0B" },
  mid: { bg: "#E7F0FA", fg: "#1D4E99" },
  weak: { bg: "#F1EFE8", fg: "#5F5E5A" },
};

const FALLBACK_PALETTE = [
  { bg: "#EAF3DE", fg: "#3B6D11" },
  { bg: "#FAECE7", fg: "#993C1D" },
  { bg: "#F1E7FA", fg: "#6B1D99" },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initialsOf(name: string): string {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function ClubCrest({
  name,
  tier,
  logo,
  size = 40,
  className,
}: ClubCrestProps) {
  if (logo) {
    return (
      <div
        className={cn("relative shrink-0", className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={logo}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-contain"
        />
      </div>
    );
  }

  const palette = tier
    ? TIER_PALETTE[tier]
    : FALLBACK_PALETTE[hashString(name) % FALLBACK_PALETTE.length];

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 font-bold",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: palette.bg,
        color: palette.fg,
        fontSize: size * 0.38,
      }}
    >
      {initialsOf(name)}
    </div>
  );
}
