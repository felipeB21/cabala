"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useCareerLeaderboard, useMyCareer } from "@/hooks/use-career";
import { ClubCrest } from "@/components/career/club-crest";
import { StaggerFade, StaggerFadeItem } from "@/components/motion/stagger-fade";
import type { ClubTier } from "@/lib/career";

const RANK_STYLES = {
  1: { badge: "bg-primary/15 text-primary", label: "1°" },
  2: { badge: "bg-secondary/15 text-secondary", label: "2°" },
  3: { badge: "bg-destructive/15 text-destructive", label: "3°" },
};

export function CareerRanking() {
  const { data: careers } = useCareerLeaderboard(20);
  const { data: session } = authClient.useSession();
  const { data: myCareer } = useMyCareer();

  if (!careers || careers.length === 0) return null;

  const currentUserId =
    session?.user && myCareer ? session.user.id : undefined;

  const top3 = careers.slice(0, 3);
  const rest = careers.slice(3);
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="max-w-xl mx-auto px-4 w-full">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Mejores carreras
      </p>

      <div className="flex flex-col gap-6">
        {top3.length === 3 && (
          <div className="grid grid-cols-3 gap-2 items-end">
            {podium.map((entry, i) => {
              const rank = entry === top3[0] ? 1 : entry === top3[1] ? 2 : 3;
              const style = RANK_STYLES[rank as keyof typeof RANK_STYLES];
              const isYou = entry.userId === currentUserId;

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link
                    href={
                      entry.user.username
                        ? `/profile/${entry.user.username}`
                        : "#"
                    }
                    className={cn(
                      "flex flex-col items-center gap-2 bg-card border border-border/50 rounded-xl px-2 py-4 relative hover:shadow-md transition-shadow",
                      rank === 1 && "pt-6",
                      isYou && "ring-1 ring-primary/40",
                    )}
                  >
                    {rank === 1 && (
                      <motion.span
                        className="absolute -top-3 text-lg"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.2,
                          type: "spring",
                          stiffness: 300,
                          damping: 12,
                        }}
                      >
                        👑
                      </motion.span>
                    )}
                    <span
                      className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded-full",
                        style.badge,
                      )}
                    >
                      {style.label}
                    </span>
                    <ClubCrest
                      name={entry.club.name}
                      tier={entry.club.tier as ClubTier}
                      logo={entry.club.logo}
                      size={40}
                    />
                    <span className="text-[12px] font-medium text-center leading-tight truncate w-full">
                      {entry.jerseyName}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {entry.ovr} OVR
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {rest.length > 0 && (
          <StaggerFade className="flex flex-col gap-2">
            {rest.map((entry, i) => {
              const isYou = entry.userId === currentUserId;

              return (
                <StaggerFadeItem key={entry.userId}>
                  <Link
                    href={
                      entry.user.username
                        ? `/profile/${entry.user.username}`
                        : "#"
                    }
                    className={cn(
                      "flex items-center gap-3 bg-card border border-border/50 rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors",
                      isYou && "ring-1 ring-primary/40",
                    )}
                  >
                    <span className="text-[13px] font-medium text-muted-foreground min-w-5 text-center font-mono">
                      {i + 4}
                    </span>
                    <ClubCrest
                      name={entry.club.name}
                      tier={entry.club.tier as ClubTier}
                      logo={entry.club.logo}
                      size={34}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">
                        {entry.jerseyName}
                        {isYou && (
                          <span className="ml-1.5 text-[10px] font-medium text-primary">
                            vos
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {entry.club.name}
                      </p>
                    </div>
                    <span className="font-mono text-[14px] font-medium tabular-nums">
                      {entry.ovr}
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {" "}
                        OVR
                      </span>
                    </span>
                  </Link>
                </StaggerFadeItem>
              );
            })}
          </StaggerFade>
        )}
      </div>
    </div>
  );
}
