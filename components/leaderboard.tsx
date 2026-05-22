"use client";

import Image from "next/image";
import Link from "next/link";
import { Flame, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeaderboard } from "@/actions/user";

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
  1: { badge: "bg-[#FAEEDA] text-[#854F0B]", label: "1°" },
  2: { badge: "bg-[#F1EFE8] text-[#5F5E5A]", label: "2°" },
  3: { badge: "bg-[#FAECE7] text-[#993C1D]", label: "3°" },
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
          {podium.map((entry) => {
            const rank = entry === top3[0] ? 1 : entry === top3[1] ? 2 : 3;
            const style = RANK_STYLES[rank as keyof typeof RANK_STYLES];

            return (
              <Link
                key={entry.userId}
                href={`/profile/${entry.user.username}`}
                className={cn(
                  "flex flex-col items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-2 py-4 relative hover:bg-muted transition-colors",
                  rank === 1 && "pt-6",
                )}
              >
                {rank === 1 && (
                  <span className="absolute -top-3 text-lg">👑</span>
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
                <span className="text-[11px] text-muted-foreground">
                  {entry.points.toLocaleString()} pts
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          {rest.map((entry, i) => (
            <Link
              key={entry.userId}
              href={`/profile/${entry.user.username}`}
              className="flex items-center gap-3 bg-background border border-border/50 rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <span className="text-[13px] font-medium text-muted-foreground min-w-5 text-center">
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
              <span className="text-[14px] font-medium tabular-nums">
                {entry.points.toLocaleString()}
                <span className="text-[11px] font-normal text-muted-foreground">
                  {" "}
                  pts
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
