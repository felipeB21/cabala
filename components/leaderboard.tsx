"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Flame, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeaderboard } from "@/actions/user";
import { StaggerFade, StaggerFadeItem } from "@/components/motion/stagger-fade";

type LeaderboardEntry = Awaited<ReturnType<typeof getLeaderboard>>[number];

interface LeaderboardClientProps {
  users: LeaderboardEntry[];
}

function Avatar({
  user,
  size = 40,
}: {
  user: LeaderboardEntry["user"];
  size?: number;
}) {
  const initials = user.name?.slice(0, 2).toUpperCase() ?? "??";

  if (user.image) {
    return (
      <div
        className="rounded-full overflow-hidden shrink-0 relative bg-muted"
        style={{ width: size, height: size }}
      >
        <Image
          src={user.image}
          alt={user.name ?? ""}
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium text-muted-foreground"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

const RANK_STYLES = {
  1: { badge: "bg-primary/15 text-primary", label: "1°" },
  2: { badge: "bg-secondary/15 text-secondary", label: "2°" },
  3: { badge: "bg-destructive/15 text-destructive", label: "3°" },
};

export function LeaderboardClient({ users }: LeaderboardClientProps) {
  if (users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Todavía no hay predictores en el ranking
      </p>
    );
  }

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      {top3.length === 3 && (
        <div className="grid grid-cols-3 gap-2 items-end">
          {podium.map((entry, i) => {
            const rank = entry === top3[0] ? 1 : entry === top3[1] ? 2 : 3;
            const style = RANK_STYLES[rank as keyof typeof RANK_STYLES];

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/profile/${entry.user.username}`}
                  className={cn(
                    "flex flex-col items-center gap-2 bg-card border border-border/50 rounded-xl px-2 py-4 relative hover:shadow-md transition-shadow",
                    rank === 1 && "pt-6",
                  )}
                >
                  {rank === 1 && (
                    <motion.span
                      className="absolute -top-3 text-lg"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 12 }}
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
                  <Avatar user={entry.user} size={40} />
                  <span className="text-[12px] font-medium text-center leading-tight truncate w-full">
                    {entry.user.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {entry.points.toLocaleString()} pts
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <StaggerFade className="flex flex-col gap-2">
          {rest.map((entry, i) => (
            <StaggerFadeItem key={entry.userId}>
              <Link
                href={`/profile/${entry.user.username}`}
                className="flex items-center gap-3 bg-card border border-border/50 rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <span className="text-[13px] font-medium text-muted-foreground min-w-5 text-center font-mono">
                  {i + 4}
                </span>
                <Avatar user={entry.user} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">
                    {entry.user.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Target className="w-3 h-3" />
                      {entry.correctPredictions} aciertos
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Flame className="w-3 h-3" />
                      racha {entry.streak}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[14px] font-medium tabular-nums">
                  {entry.points.toLocaleString()}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {" "}
                    pts
                  </span>
                </span>
              </Link>
            </StaggerFadeItem>
          ))}
        </StaggerFade>
      )}
    </div>
  );
}
