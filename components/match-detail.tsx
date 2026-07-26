"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreatePrediction } from "@/hooks/use-predictions";
import { useMutation } from "@tanstack/react-query";
import { createMatchComment } from "@/actions/predictions";
import type { MatchWithTeams } from "@/actions/matches";
import type {
  getMatchComments,
  getMatchPredictionStats,
} from "@/actions/matches";
import { authClient } from "@/lib/auth-client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COMMENTS_PER_PAGE = 5;

type Stats = Awaited<ReturnType<typeof getMatchPredictionStats>>;
type Comments = Awaited<ReturnType<typeof getMatchComments>>;
type PredictionValue = "home" | "draw" | "away";

interface MatchDetailClientProps {
  match: MatchWithTeams;
  stats: Stats;
  initialComments: Comments;
}

function TeamLogo({ logo, name }: { logo: string | null; name: string }) {
  if (logo) {
    return (
      <div className="relative w-14 h-14 overflow-hidden">
        <Image
          src={logo}
          alt={name}
          fill
          sizes="56px"
          className="object-contain p-1"
        />
      </div>
    );
  }
  return (
    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
      {name.slice(0, 3).toUpperCase()}
    </div>
  );
}

function StatBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-muted-foreground min-w-18">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[12px] font-medium min-w-9 text-right">{pct}%</span>
    </div>
  );
}

export function MatchDetailClient({
  match,
  stats,
  initialComments,
}: MatchDetailClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<PredictionValue | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [justStamped, setJustStamped] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comments>(initialComments);
  const { data: session } = authClient.useSession();

  const totalCommentPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);
  const paginatedComments = comments.slice(
    (commentPage - 1) * COMMENTS_PER_PAGE,
    commentPage * COMMENTS_PER_PAGE,
  );

  const { mutate: createPrediction, isPending: predicting } =
    useCreatePrediction();

  const { mutate: submitComment, isPending: commenting } = useMutation({
    mutationFn: async () => createMatchComment(match.id, comment),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error ?? "Error al comentar");
        return;
      }
      setComments((prev) => [
        {
          id: crypto.randomUUID(),
          content: comment,
          createdAt: new Date(),
          matchId: match.id,
          userId: "",
          user: {
            id: "",
            name: session?.user?.name ?? "Vos",
            username: session?.user?.username ?? "",
            image: session?.user?.image ?? null,
          },
        },
        ...prev,
      ]);
      setComment("");
      toast.success("Comentario publicado");
    },
    onError: () => toast.error("Error inesperado"),
  });

  const isVoted = !!match.userPrediction;
  const isFinished = match.status === "finished";

  const options = [
    {
      value: "home" as PredictionValue,
      label: match.homeTeam.shortName ?? match.homeTeam.name,
      odds: match.homeOdds,
    },
    { value: "draw" as PredictionValue, label: "Empate", odds: match.drawOdds },
    {
      value: "away" as PredictionValue,
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
            toast.error(res.error ?? "Error al guardar");
            handleCancel();
            return;
          }
          setConfirming(false);
          setJustStamped(true);
          toast.success("¡Predicción guardada!");
          router.refresh();
        },
        onError: () => {
          toast.error("Error inesperado");
          handleCancel();
        },
      },
    );
  }

  const selectedOption = options.find((o) => o.value === selected);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative bg-card text-card-foreground rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4 font-mono">
            Liga Profesional
            {isFinished && (
              <span className="inline-flex items-center gap-1 ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 normal-case tracking-normal">
                <CheckCircle2 className="w-3 h-3" />
                Finalizado
              </span>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-5">
            <div className="flex flex-col items-center gap-2">
              <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} />
              <span className="text-[13px] font-medium text-center">
                {match.homeTeam.name}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              {isFinished ? (
                <span className="font-mono text-2xl font-medium tabular-nums">
                  {match.homeScore} - {match.awayScore}
                </span>
              ) : (
                <>
                  <span className="text-[13px] text-muted-foreground">vs</span>
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
              <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} />
              <span className="text-[13px] font-medium text-center">
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
                          disabled={predicting}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleConfirm} disabled={predicting}>
                          {predicting ? "Confirmando..." : "Confirmar"}
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
                      opt.value === match.userPrediction
                        ? "bg-primary/10 border-primary"
                        : "border-border/30 opacity-40",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        opt.value === match.userPrediction
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {opt.label}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-sm font-medium",
                        opt.value === match.userPrediction
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
        <div className="px-5 py-3 text-[11px] text-muted-foreground">
          {new Date(match.startsAt).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {stats.total > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Predicciones de la comunidad
            </p>
            <div className="flex flex-col gap-3">
              <StatBar
                label={match.homeTeam.name}
                pct={stats.home}
                color="var(--secondary)"
              />
              <StatBar label="Empate" pct={stats.draw} color="var(--muted-foreground)" />
              <StatBar
                label={match.awayTeam.name}
                pct={stats.away}
                color="var(--primary)"
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              {stats.total} predicciones en total
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Comentarios
          </p>

          <div className="flex gap-2">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribí un comentario..."
              maxLength={500}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && comment.trim()) {
                  submitComment();
                }
              }}
            />
            <Button
              onClick={() => submitComment()}
              disabled={!comment.trim() || commenting}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {comments.length === 0 && (
            <p className="text-[13px] text-muted-foreground text-center py-4">
              Sé el primero en comentar
            </p>
          )}

          <div className="flex flex-col gap-4">
            {paginatedComments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Link href={`/profile/${c.user.username}`}>
                  <div className="w-8 h-8 rounded-full bg-muted shrink-0 relative overflow-hidden flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {c.user.image ? (
                      <Image
                        src={c.user.image}
                        alt={c.user.name ?? ""}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      c.user.name?.slice(0, 2).toUpperCase()
                    )}
                  </div>
                </Link>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <Link
                      href={`/profile/${c.user.username}`}
                      className="text-[12px] font-medium hover:underline"
                    >
                      {c.user.name}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {c.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {totalCommentPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCommentPage((p) => Math.max(1, p - 1))}
                    className={cn(
                      "cursor-pointer",
                      commentPage === 1 && "pointer-events-none opacity-40",
                    )}
                  />
                </PaginationItem>

                {Array.from({ length: totalCommentPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      totalCommentPages > 5 &&
                      page !== 1 &&
                      page !== totalCommentPages &&
                      Math.abs(page - commentPage) > 1
                    ) {
                      if (page === 2 || page === totalCommentPages - 1) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCommentPage(page)}
                          isActive={commentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  },
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCommentPage((p) => Math.min(totalCommentPages, p + 1))
                    }
                    className={cn(
                      "cursor-pointer",
                      commentPage === totalCommentPages &&
                        "pointer-events-none opacity-40",
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
