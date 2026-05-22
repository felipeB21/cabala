"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserByUsername } from "@/actions/user";
import Image from "next/image";
import { Flame, Target, Trophy, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

type UserData = Awaited<ReturnType<typeof getUserByUsername>>;
type Prediction = NonNullable<UserData>["predictions"][number];

interface UserProfileClientProps {
  username: string;
  initialData: UserData;
}

function PredictionBadge({ prediction }: { prediction: Prediction }) {
  if (prediction.isCorrect === null) {
    return (
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
        Pendiente
      </span>
    );
  }

  if (prediction.isCorrect) {
    return (
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#EAF3DE] text-[#3B6D11] flex items-center gap-1">
        <Check className="w-3 h-3" />+{prediction.pointsWon} pts
      </span>
    );
  }

  return (
    <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#FCEBEB] text-[#A32D2D] flex items-center gap-1">
      <X className="w-3 h-3" />
      Incorrecto
    </span>
  );
}

function predictionLabel(
  pred: string,
  homeTeamName: string,
  awayTeamName: string,
) {
  if (pred === "home") return homeTeamName;
  if (pred === "away") return awayTeamName;
  return "Empate";
}

export default function UserProfileClient({
  username,
  initialData,
}: UserProfileClientProps) {
  const { data: user } = useQuery({
    queryKey: ["user", username],
    queryFn: () => getUserByUsername(username),
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
    initialData: initialData ?? undefined,
  });

  if (!user) {
    return (
      <div className="text-center p-4 text-sm text-muted-foreground">
        El usuario @{username} no existe.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="h-20 bg-muted rounded-xl mb-0" />

      <div className="flex justify-center">
        <div className="relative w-18 h-18 rounded-full border-3 border-background overflow-hidden -mt-9 bg-muted">
          {user.image ? (
            <Image
              src={user.image}
              alt={`@${user.username}`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-medium text-muted-foreground">
              {user.name?.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-2.5">
        <h1 className="text-lg font-extrabold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
        {user.bio && (
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
            {user.bio}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <div className="bg-muted/50 rounded-lg p-3.5 flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-[#EAF3DE] flex items-center justify-center">
            <Target className="w-4 h-4 text-[#3B6D11]" />
          </div>
          <span className="text-xl font-medium">
            {user.stats?.correctPredictions ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Aciertos
          </span>
        </div>

        <div className="bg-muted/50 rounded-lg p-3.5 flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-[#FAEEDA] flex items-center justify-center">
            <Trophy className="w-4 h-4 text-[#854F0B]" />
          </div>
          <span className="text-xl font-medium">
            {(user.stats?.points ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Puntos
          </span>
        </div>

        <div className="bg-muted/50 rounded-lg p-3.5 flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-[#FAECE7] flex items-center justify-center">
            <Flame className="w-4 h-4 text-[#993C1D]" />
          </div>
          <span className="text-xl font-medium">{user.stats?.streak ?? 0}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Racha
          </span>
        </div>
      </div>

      {user.predictions.length > 0 && (
        <>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-6 mb-3">
            Últimas predicciones
          </p>

          <div className="flex flex-col gap-2">
            {user.predictions.map((pred) => (
              <Link
                key={pred.id}
                href={`/matches/${pred.matchId}`}
                className="bg-background border border-border/50 rounded-lg px-3.5 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate">
                    {pred.match.homeTeam.name} vs {pred.match.awayTeam.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Prediccion:{" "}
                    <span className="font-extrabold">
                      {predictionLabel(
                        pred.prediction,
                        pred.match.homeTeam.name,
                        pred.match.awayTeam.name,
                      )}
                    </span>{" "}
                    ·{" "}
                    {formatDistanceToNow(new Date(pred.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                <PredictionBadge prediction={pred} />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
