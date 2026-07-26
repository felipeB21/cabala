"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchWithTeams } from "@/actions/matches";
import { useCreatePrediction } from "@/hooks/use-predictions";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

type PredictionValue = "home" | "draw" | "away";

interface PredictionOption {
  value: PredictionValue;
  label: string;
  odds: number;
}

interface MatchCardProps {
  match: MatchWithTeams;
}

const COMPETITION_LABELS: Record<string, string> = {
  liga: "Liga Profesional",
  libertadores: "Copa Libertadores",
  sudamericana: "Copa Sudamericana",
};

export function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<PredictionValue | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [justStamped, setJustStamped] = useState(false);

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
            toast.error(res.error ?? "Error al guardar la predicción");
            handleCancel();
            return;
          }
          setConfirming(false);
          setJustStamped(true);
          toast.success("¡Predicción guardada!");
          router.refresh();
        },
        onError: () => {
          toast.error("Error inesperado. Intentá de nuevo.");
          handleCancel();
        },
      },
    );
  }

  const selectedOption = options.find((o) => o.value === selected);

  return (
    <div className="relative bg-card text-card-foreground rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4 font-mono">
          {COMPETITION_LABELS[match.competition] ?? match.competition}
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
              <span className="font-mono text-xl font-medium tabular-nums">
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

        {!isVoted && !isFinished && (
          <>
            <p className="text-[11px] text-muted-foreground text-center mb-2">
              ¿Quién ganará?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {options.map((opt) => (
                <motion.button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  disabled={confirming}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-colors",
                    "hover:bg-muted",
                    selected === opt.value
                      ? "bg-primary/10 border-primary"
                      : "bg-background border-border/60",
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      selected === opt.value
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {opt.label}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-sm font-medium",
                      selected === opt.value ? "text-primary" : "text-foreground",
                    )}
                  >
                    {(opt.odds / 100).toFixed(1)}×
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {opt.odds} pts
                  </span>
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {confirming && selectedOption && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 bg-muted/50 rounded-xl border border-border/60 p-3 flex flex-col gap-2.5">
                    <p className="text-[13px] text-muted-foreground text-center">
                      Vas a predecir:{" "}
                      <span className="font-medium text-foreground">
                        {selectedOption.label} · {selectedOption.odds} pts
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isPending}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleConfirm} disabled={isPending}>
                        {isPending ? "Confirmando..." : "Confirmar"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {isVoted && (
          <div className="relative flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              {options.map((opt) => (
                <div
                  key={opt.value}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5",
                    opt.value === userPrediction
                      ? "bg-primary/10 border-primary"
                      : "border-border/30 opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      opt.value === userPrediction
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {opt.label}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-sm font-medium",
                      opt.value === userPrediction
                        ? "text-primary"
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
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Predicción confirmada
            </div>

            <AnimatePresence>
              {justStamped && (
                <motion.div
                  initial={{ opacity: 0, scale: 2.2, rotate: -16 }}
                  animate={{ opacity: 1, scale: 1, rotate: -8 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  onAnimationComplete={() => {
                    setTimeout(() => setJustStamped(false), 700);
                  }}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <span className="font-heading font-extrabold text-2xl text-destructive/90 border-4 border-destructive/90 rounded-lg px-4 py-1.5 rotate-[-8deg] select-none">
                    ¡VA CÁBALA!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {isFinished && !isVoted && (
          <p className="text-[12px] text-muted-foreground text-center">
            Este partido ya terminó
          </p>
        )}
      </div>

      <div className="ticket-perforation" />

      <Link
        href={`/matches/${match.slug}`}
        className="flex items-center justify-between px-5 py-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>
          {new Date(match.startsAt).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
          })}
        </span>
        <span>Ver partido completo →</span>
      </Link>
    </div>
  );
}
