"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchWithTeams } from "@/actions/matches";
import { useCreatePrediction } from "@/hooks/use-predictions";
import Image from "next/image";
import { useRouter } from "next/navigation";

type PredictionValue = "home" | "draw" | "away";

interface PredictionOption {
  value: PredictionValue;
  label: string;
  odds: number;
}

interface MatchCardProps {
  match: MatchWithTeams;
}

export function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<PredictionValue | null>(null);
  const [confirming, setConfirming] = useState(false);

  const { mutate: createPrediction, isPending } = useCreatePrediction();

  const userPrediction = match.userPrediction;
  const isVoted = !!userPrediction;
  const isFinished = match.status === "finished";

  const options: PredictionOption[] = [
    {
      value: "home",
      label: match.homeTeam.shortName ?? match.homeTeam.name,
      odds: match.homeOdds,
    },
    { value: "draw", label: "Empate", odds: match.drawOdds },
    {
      value: "away",
      label: match.awayTeam.shortName ?? match.awayTeam.name,
      odds: match.awayOdds,
    },
  ];

  function handleSelect(value: PredictionValue) {
    if (isVoted || isFinished) return;
    setSelected(value);
    setConfirming(true);
  }

  function handleCancel() {
    setSelected(null);
    setConfirming(false);
  }

  function handleConfirm() {
    if (!selected) return;
    createPrediction(
      { matchId: match.id, prediction: selected },
      {
        onSuccess: (res) => {
          if (!res.success) {
            handleCancel();
            return;
          }
          setConfirming(false);
          router.refresh();
        },
        onError: () => handleCancel(),
      },
    );
  }

  const selectedOption = options.find((o) => o.value === selected);

  return (
    <div className="bg-background rounded-xl border border-border/50 p-5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
        <Trophy className="w-3 h-3" />
        Liga Profesional
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-5">
        <div className="flex flex-col items-center gap-2">
          {match.homeTeam.logo ? (
            <Image
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              width={100}
              height={100}
              className="w-11 h-11"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              {match.homeTeam.shortName ??
                match.homeTeam.name.slice(0, 3).toUpperCase()}
            </div>
          )}
          <span className="text-[13px] font-medium text-center leading-tight">
            {match.homeTeam.name}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          {isFinished ? (
            <span className="text-xl font-medium tabular-nums">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <>
              <span className="text-[13px] font-medium text-muted-foreground">
                vs
              </span>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(match.startsAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          {match.awayTeam.logo ? (
            <Image
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              width={100}
              height={100}
              className="w-11 h-11"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              {match.awayTeam.shortName ??
                match.awayTeam.name.slice(0, 3).toUpperCase()}
            </div>
          )}
          <span className="text-[13px] font-medium text-center leading-tight">
            {match.awayTeam.name}
          </span>
        </div>
      </div>

      <div className="h-px bg-border/50 mb-4" />

      {!isVoted && !isFinished && (
        <>
          <p className="text-[11px] text-muted-foreground text-center uppercase tracking-wider mb-2">
            ¿Quién ganará?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                disabled={confirming}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border border-border/50 px-2 py-2.5 transition-all",
                  "hover:bg-muted hover:border-border",
                  selected === opt.value
                    ? "bg-blue-50 border-blue-400 dark:bg-blue-950 dark:border-blue-600"
                    : "bg-background",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    selected === opt.value
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground",
                  )}
                >
                  {opt.label}
                </span>
                <span
                  className={cn(
                    "text-base font-medium",
                    selected === opt.value
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-foreground",
                  )}
                >
                  {(opt.odds / 100).toFixed(1)}×
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {opt.odds} pts
                </span>
              </button>
            ))}
          </div>

          {confirming && selectedOption && (
            <div className="mt-3 bg-muted/50 rounded-lg border border-border/50 p-3 flex flex-col gap-2.5">
              <p className="text-[13px] text-muted-foreground text-center">
                Vas a predecir:{" "}
                <span className="font-medium text-foreground">
                  {selectedOption.label} · {selectedOption.odds} pts
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="rounded-lg border border-border/50 py-2 text-[13px] text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="rounded-lg bg-blue-600 py-2 text-[13px] font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {isPending ? "Confirmando..." : "Confirmar"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isVoted && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            {options.map((opt) => (
              <div
                key={opt.value}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5",
                  opt.value === userPrediction
                    ? "bg-blue-50 border-blue-400 dark:bg-blue-950 dark:border-blue-600"
                    : "border-border/30 opacity-40",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    opt.value === userPrediction
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground",
                  )}
                >
                  {opt.label}
                </span>
                <span
                  className={cn(
                    "text-base font-medium",
                    opt.value === userPrediction
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-foreground",
                  )}
                >
                  {(opt.odds / 100).toFixed(1)}×
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {opt.odds} pts
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Predicción confirmada
          </div>
        </div>
      )}

      {isFinished && !isVoted && (
        <p className="text-[12px] text-muted-foreground text-center">
          Este partido ya terminó
        </p>
      )}
    </div>
  );
}
