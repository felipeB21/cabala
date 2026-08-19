"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Smile,
  Users,
  Heart,
  Ban,
  HeartPulse,
  Trophy as TrophyIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { SignIn } from "@/components/auth/sign-in";
import { ClubCrest } from "@/components/career/club-crest";
import {
  MatchEventOverlay,
  type MatchEventType,
} from "@/components/career/match-event-overlay";
import { PenaltyKickGame } from "@/components/career/penalty-kick";
import { StaggerFade, StaggerFadeItem } from "@/components/motion/stagger-fade";
import { playLevelUpSound, playWhistleSound } from "@/lib/sfx";
import { useAllCareerClubs, useSaveCareer } from "@/hooks/use-career";
import type {
  LocalCareer,
  LocalCareerClub,
  LocalCareerMatch,
  SimulateResult,
} from "@/hooks/use-local-career";
import {
  LOW_ENERGY_THRESHOLD,
  RETIREMENT_AGE,
  SEASON_LENGTH,
  type ClubTier,
  type PenaltyOutcome,
} from "@/lib/career";

interface CareerDashboardProps {
  career: LocalCareer;
  simulateNextMatch: (allClubs: LocalCareerClub[]) => SimulateResult | null;
  restMatch: (allClubs: LocalCareerClub[]) => LocalCareerMatch | null;
  resolvePenaltyOutcome: (
    outcome: PenaltyOutcome,
    allClubs: LocalCareerClub[],
  ) => LocalCareerMatch | null;
  resolveOffer: (clubId: string | null) => void;
  resolveLifeEvent: (choice: "A" | "B") => void;
  markSaved: () => void;
  resetCareer: () => void;
  // False while a local/server career conflict is still unresolved — the
  // debounced auto-save would otherwise overwrite the saved career before
  // the player has answered which one to keep.
  canAutoSave: boolean;
}

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Arquero",
  defender: "Defensor",
  midfielder: "Mediocampista",
  forward: "Delantero",
};

const NATIONALITY_LABELS: Record<string, string> = {
  argentina: "Argentina",
  brasil: "Brasil",
  espana: "España",
  inglaterra: "Inglaterra",
  italia: "Italia",
};

const CLUB_RESULT_LABELS: Record<string, string> = {
  win: "Victoria",
  draw: "Empate",
  loss: "Derrota",
};

function ovrColorClass(ovr: number) {
  if (ovr >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (ovr >= 60) return "text-secondary";
  return "text-muted-foreground";
}

function OvrDeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="w-3 h-3" />+{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-destructive">
        <TrendingDown className="w-3 h-3" />
        {delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
      <Minus className="w-3 h-3" />0
    </span>
  );
}

function ClubResultBadge({ result }: { result: string }) {
  const variant =
    result === "win" ? "default" : result === "loss" ? "destructive" : "secondary";

  return (
    <Badge variant={variant} className="text-[10px]">
      {CLUB_RESULT_LABELS[result] ?? result}
    </Badge>
  );
}

function StatBar({
  icon: Icon,
  value,
  label,
  min = 0,
  max = 100,
  highlight = false,
}: {
  icon?: typeof Zap;
  value: number;
  label: string;
  min?: number;
  max?: number;
  highlight?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = pct >= 60 ? "#3B6D11" : pct >= 30 ? "#B8891A" : "#9C3B2E";

  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      {!Icon && (
        <span
          className={cn(
            "text-[11px] w-20 shrink-0 truncate",
            highlight ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      )}
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground w-8 text-right">{value}</span>
      {Icon && <span className="sr-only">{label}</span>}
    </div>
  );
}

function SeasonProgress({ value }: { value: number }) {
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export function CareerDashboard({
  career,
  simulateNextMatch,
  restMatch,
  resolvePenaltyOutcome,
  resolveOffer,
  resolveLifeEvent,
  markSaved,
  resetCareer,
  canAutoSave,
}: CareerDashboardProps) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { mutate: saveCareer, isPending: isSaving } = useSaveCareer();
  const { data: allClubs, isPending: clubsPending } = useAllCareerClubs();
  const [lastResult, setLastResult] = useState<LocalCareerMatch | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<MatchEventType[]>([]);
  const prevTrophyCount = useRef(career.trophies.length);

  useEffect(() => {
    if (career.trophies.length > prevTrophyCount.current) {
      const newest = career.trophies[career.trophies.length - 1];
      toast.success(`🏆 ${newest.title}`);
      playLevelUpSound();
    }
    prevTrophyCount.current = career.trophies.length;
  }, [career.trophies]);

  const savePayload = useMemo(
    () => ({
      jerseyName: career.jerseyName,
      squadNumber: career.squadNumber,
      nationality: career.nationality,
      position: career.position,
      clubId: career.club.id,
      ovr: career.ovr,
      attributes: career.attributes,
      age: career.age,
      seasonNumber: career.seasonNumber,
      matchesPlayedInSeason: career.matchesPlayedInSeason,
      appearances: career.appearances,
      goals: career.goals,
      assists: career.assists,
      energy: career.energy,
      morale: career.morale,
      teamReputation: career.teamReputation,
      fanReputation: career.fanReputation,
      relationshipStatus: career.relationshipStatus,
      suspended: career.suspended,
      injuredMatchesRemaining: career.injuredMatchesRemaining,
      matches: career.matches,
      trophies: career.trophies,
      clubsHistory: career.clubsHistory,
    }),
    [career],
  );

  // Signature of what the server actually stores — deliberately excludes
  // `linkedToServer` (set by markSaved right after a save, which would
  // otherwise re-dirty the state and loop) and the pending offer/event/
  // penalty fields, which are local-only.
  const saveSignature = JSON.stringify(savePayload);
  const savedSignature = useRef<string | null>(null);
  // A payload the server rejected. Without this, every later state change
  // retries the same doomed payload and fires another error toast; the
  // manual button stays exempt so a retry is always available.
  const failedSignature = useRef<string | null>(null);

  // One automatic save per career, at retirement — the whole point of the
  // snapshot is the finished career on the leaderboard, and saving on every
  // state change meant a full upsert plus a delete-and-reinsert of the match
  // history after every single match. Mid-career progress lives in
  // localStorage; the manual button is there for anyone who wants a server
  // copy sooner. Silent on success, errors still surface.
  useEffect(() => {
    if (
      !career.retired ||
      !canAutoSave ||
      !session?.user ||
      savedSignature.current === saveSignature ||
      failedSignature.current === saveSignature
    ) {
      return;
    }

    saveCareer(savePayload, {
      onSuccess: (res) => {
        if (!res.success) {
          failedSignature.current = saveSignature;
          setSaveFailed(true);
          toast.error(res.error ?? "Error al guardar la carrera");
          return;
        }
        savedSignature.current = saveSignature;
        failedSignature.current = null;
        setSaveFailed(false);
        markSaved();
      },
      onError: () => {
        failedSignature.current = saveSignature;
        setSaveFailed(true);
      },
    });
  }, [
    career.retired,
    canAutoSave,
    session,
    saveSignature,
    savePayload,
    saveCareer,
    markSaved,
  ]);

  function mappedClubs(): LocalCareerClub[] {
    return (allClubs ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      tier: c.tier as ClubTier,
      logo: c.logo,
    }));
  }

  function applyMatchResult(match: LocalCareerMatch) {
    setLastResult(match);

    const events: MatchEventType[] = [];
    for (let i = 0; i < match.goals; i++) events.push("goal");
    for (let i = 0; i < match.assists; i++) events.push("assist");
    if (match.redCard) events.push("redCard");
    if (match.injured) events.push("injury");

    if (events.length > 0) {
      setPendingEvents(events);
    } else {
      toast.success(match.started ? "Fuiste titular" : "Fuiste suplente");
    }

    if (match.matchNumber === SEASON_LENGTH) {
      playLevelUpSound();
    }
  }

  function handleSimulate() {
    playWhistleSound();

    const result = simulateNextMatch(mappedClubs());
    if (!result || result.type === "penalty") return;

    applyMatchResult(result.match);
  }

  function handleRest() {
    const match = restMatch(mappedClubs());
    if (!match) return;

    toast.success("Descansaste este partido — recuperaste energía");
    applyMatchResult(match);
  }

  function handlePenaltyResolve(outcome: PenaltyOutcome) {
    const match = resolvePenaltyOutcome(outcome, mappedClubs());
    if (!match) return;

    applyMatchResult(match);
  }

  function handleSave() {
    saveCareer(savePayload, {
      onSuccess: (res) => {
        if (!res.success) {
          setSaveFailed(true);
          toast.error(res.error ?? "Error al guardar la carrera");
          return;
        }
        savedSignature.current = saveSignature;
        failedSignature.current = null;
        setSaveFailed(false);
        markSaved();
        toast.success("¡Carrera guardada!");
      },
      onError: () => {
        setSaveFailed(true);
        toast.error("Error inesperado. Intentá de nuevo.");
      },
    });
  }

  function handleNewCareer() {
    resetCareer();
  }

  const exhausted = career.energy < LOW_ENERGY_THRESHOLD;
  const seasonRolledOver = lastResult?.matchNumber === SEASON_LENGTH;
  const history = [...career.matches].reverse();
  const seasonProgress = (career.matchesPlayedInSeason / SEASON_LENGTH) * 100;

  const saveButton = !sessionPending && (
    <div>
      {session?.user ? (
        <div className="flex flex-col gap-1.5">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="secondary"
            className="w-full"
          >
            {isSaving
              ? "Guardando..."
              : career.linkedToServer
                ? "Actualizar carrera guardada"
                : "Guardar carrera"}
          </Button>
          {/* The automatic save only fires at retirement, so the player needs
              to know their progress is local until then — otherwise "did it
              save?" is unanswerable. */}
          <p className="text-[11px] text-muted-foreground text-center">
            {isSaving
              ? "Guardando..."
              : saveFailed
                ? "No se pudo guardar — tocá para reintentar"
                : career.retired
                  ? "Carrera guardada en tu cuenta"
                  : career.linkedToServer
                    ? "Guardada — se actualiza sola al retirarte"
                    : "Se guarda al retirarte, o tocá para guardar ahora"}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 bg-muted/50 rounded-lg px-3.5 py-3">
          <p className="text-[11px] text-muted-foreground">
            Iniciá sesión para guardar tu carrera y aparecer en el ranking.
          </p>
          <SignIn />
        </div>
      )}
    </div>
  );

  if (career.retired) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-5">
          <p className="text-3xl mb-1">🏆</p>
          <h1 className="font-heading text-base font-extrabold">
            Carrera retirada
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {career.jerseyName} colgó los botines a los {RETIREMENT_AGE} años
            con un OVR de{" "}
            <span className="font-semibold text-foreground">{career.ovr}</span>
            .
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6 text-sm">
          <span>⚽ {career.goals}</span>
          <span>🎯 {career.assists}</span>
          <span>📅 {career.appearances}</span>
        </div>

        <div className="flex flex-col gap-3">
          {saveButton}

          {!career.linkedToServer && (
            <p className="text-[11px] text-muted-foreground text-center">
              Todavía no guardaste esta carrera — se va a perder si empezás una
              nueva sin guardarla.
            </p>
          )}

          {confirmingReset ? (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-destructive text-center">
                Vas a reemplazar la carrera guardada de {career.jerseyName}. No
                se puede deshacer.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmingReset(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleNewCareer}>Sí, empezar de nuevo</Button>
              </div>
            </div>
          ) : (
            <Button
              // A saved career is about to be overwritten by the first
              // auto-save of the new one, so make that an explicit choice.
              onClick={() =>
                session?.user && career.linkedToServer
                  ? setConfirmingReset(true)
                  : handleNewCareer()
              }
              className="w-full"
            >
              Empezar nueva carrera
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {career.pendingPenalty && (
        <PenaltyKickGame
          keeper={career.pendingPenalty.keeper}
          onResolve={handlePenaltyResolve}
        />
      )}

      {pendingEvents.length > 0 && (
        <MatchEventOverlay
          events={pendingEvents}
          onDone={() => setPendingEvents([])}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <ClubCrest
              name={career.club.name}
              tier={career.club.tier}
              logo={career.club.logo}
              size={40}
            />
            <div className="min-w-0">
              <h1 className="font-heading text-base font-extrabold truncate">
                {career.jerseyName}{" "}
                <span className="text-muted-foreground font-medium">
                  #{career.squadNumber}
                </span>
              </h1>
              <p className="text-[12px] text-muted-foreground truncate">
                {POSITION_LABELS[career.position]} ·{" "}
                {NATIONALITY_LABELS[career.nationality] ?? career.nationality} ·{" "}
                {career.club.name}
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    OVR
                  </span>
                  <p
                    className={cn(
                      "font-mono text-2xl font-medium",
                      ovrColorClass(career.ovr),
                    )}
                  >
                    {career.ovr}
                  </p>
                </div>
                <div className="text-right text-[12px] text-muted-foreground">
                  <p>Partido {career.matchesPlayedInSeason}/{SEASON_LENGTH}</p>
                  <p>Temporada {career.seasonNumber} · {career.age} años</p>
                </div>
              </div>

              <SeasonProgress value={seasonProgress} />

              <div className="flex items-center gap-5 text-sm">
                <span>⚽ {career.goals}</span>
                <span>🎯 {career.assists}</span>
                <span>📅 {career.appearances}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <StatBar icon={Zap} value={career.energy} label="Energía" />
                <StatBar icon={Smile} value={career.morale} label="Ánimo" />
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">
                  Reputación
                </p>
                <div className="flex flex-col gap-1.5">
                  <StatBar
                    icon={Users}
                    value={career.teamReputation}
                    label="Vestuario"
                  />
                  <StatBar icon={Heart} value={career.fanReputation} label="Hinchada" />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {career.relationshipStatus === "en pareja" ? "💑 En pareja" : "🙋 Soltero/a"}
              </p>
            </CardContent>
          </Card>

          {career.trophies.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Vitrina de trofeos
                </p>
                <StaggerFade className="flex flex-col gap-2">
                  {career.trophies
                    .slice()
                    .reverse()
                    .map((trophy) => (
                      <StaggerFadeItem key={trophy.id}>
                        <div className="flex items-start gap-2.5 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5">
                          <TrophyIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold leading-tight">
                              {trophy.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {trophy.description}
                            </p>
                          </div>
                        </div>
                      </StaggerFadeItem>
                    ))}
                </StaggerFade>
              </CardContent>
            </Card>
          )}

          {career.suspended && !career.pendingOffers && !career.pendingLifeEvent && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3.5 py-2.5">
              <Ban className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-[12px] text-destructive">
                Suspendido por tarjeta roja — no vas a poder jugar el próximo partido.
              </p>
            </div>
          )}

          {career.injuredMatchesRemaining > 0 &&
            !career.pendingOffers &&
            !career.pendingLifeEvent && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3.5 py-2.5">
                <HeartPulse className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-[12px] text-destructive">
                  Lesionado — te quedan {career.injuredMatchesRemaining}{" "}
                  {career.injuredMatchesRemaining === 1 ? "partido" : "partidos"} afuera.
                </p>
              </div>
            )}

          {career.pendingLifeEvent ? (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <h2 className="font-heading text-sm font-bold">
                    {career.pendingLifeEvent.title}
                  </h2>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {career.pendingLifeEvent.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    className="h-auto py-2.5 flex-col items-start gap-0.5"
                    // No energy left to spend on it — the trade-off has to
                    // be affordable to be a real choice.
                    disabled={
                      career.energy + career.pendingLifeEvent.optionA.energyDelta < 0
                    }
                    onClick={() => resolveLifeEvent("A")}
                  >
                    <span>{career.pendingLifeEvent.optionA.label}</span>
                    <span className="text-[10px] font-normal opacity-70">
                      {career.pendingLifeEvent.optionA.energyDelta >= 0 ? "+" : ""}
                      {career.pendingLifeEvent.optionA.energyDelta} energía ·{" "}
                      {career.pendingLifeEvent.optionA.moraleDelta >= 0 ? "+" : ""}
                      {career.pendingLifeEvent.optionA.moraleDelta} ánimo
                    </span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-auto py-2.5 flex-col items-start gap-0.5"
                    disabled={
                      career.energy + career.pendingLifeEvent.optionB.energyDelta < 0
                    }
                    onClick={() => resolveLifeEvent("B")}
                  >
                    <span>{career.pendingLifeEvent.optionB.label}</span>
                    <span className="text-[10px] font-normal opacity-70">
                      {career.pendingLifeEvent.optionB.energyDelta >= 0 ? "+" : ""}
                      {career.pendingLifeEvent.optionB.energyDelta} energía ·{" "}
                      {career.pendingLifeEvent.optionB.moraleDelta >= 0 ? "+" : ""}
                      {career.pendingLifeEvent.optionB.moraleDelta} ánimo
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : career.pendingOffers ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] font-medium text-center">
                📩 Tenés ofertas de otros clubes
              </p>
              <div className="grid grid-cols-3 gap-2">
                {career.pendingOffers.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => resolveOffer(club.id)}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 px-2 py-3 text-center bg-background hover:bg-muted transition-colors"
                  >
                    <ClubCrest name={club.name} tier={club.tier} logo={club.logo} size={32} />
                    <span className="text-[10px] font-medium leading-tight">
                      {club.name}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => resolveOffer(null)}
                className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ClubCrest
                  name={career.club.name}
                  tier={career.club.tier}
                  logo={career.club.logo}
                  size={20}
                />
                Quedarme en {career.club.name}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                onClick={exhausted ? handleRest : handleSimulate}
                // The club list feeds `pickTransferOffers` at a season
                // rollover — simulating before it lands silently turns that
                // transfer window into a life event, with nothing to tell the
                // player they lost it.
                disabled={clubsPending}
                className="w-full"
              >
                {clubsPending
                  ? "Cargando clubes..."
                  : exhausted
                    ? "Descansar y recuperarte"
                    : "Simular próximo partido"}
              </Button>
              {exhausted && (
                <p className="text-[11px] text-destructive text-center">
                  Estás fundido ({career.energy} de energía) — el técnico no te
                  arriesga. Descansá este partido para recuperarte.
                </p>
              )}
            </div>
          )}

          {/* Always visible. A season rollover always sets either
              pendingOffers or a pendingLifeEvent, and with SEASON_LENGTH = 2
              that is every other match — hiding the save control there meant
              it was gone exactly when the player had just finished a season
              and wanted to save. */}
          {saveButton}

          {lastResult && pendingEvents.length === 0 && (
            <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3.5 py-2.5 text-[12px]">
              <span className="font-medium">
                {lastResult.started ? "Titular" : "Suplente"}
                {lastResult.started &&
                  lastResult.rating !== null &&
                  ` · ${(lastResult.rating / 10).toFixed(1)}`}
              </span>
              <div className="flex items-center gap-2">
                <OvrDeltaBadge delta={lastResult.ovrDelta} />
                <ClubResultBadge result={lastResult.clubResult} />
              </div>
            </div>
          )}

          {seasonRolledOver && (
            <p className="text-[12px] font-medium text-secondary text-center">
              ¡Nueva temporada! Ahora tenés {career.age} años.
            </p>
          )}
        </div>

        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Historial
          </p>
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {history.length === 0 && (
              <p className="text-[12px] text-muted-foreground">
                Todavía no jugaste ningún partido.
              </p>
            )}
            {history.slice(0, 30).map((m, i) => (
              <div
                key={`${m.seasonNumber}-${m.matchNumber}-${i}`}
                className="bg-card border border-border/50 rounded-lg px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium">
                    T{m.seasonNumber} · P{m.matchNumber}
                  </p>
                  <ClubResultBadge result={m.clubResult} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {m.redCard ? (
                    <span className="text-destructive">🟥 Expulsado</span>
                  ) : m.started ? (
                    <>
                      {(m.rating! / 10).toFixed(1)}
                      {m.goals > 0 && ` · ⚽${m.goals}`}
                      {m.assists > 0 && ` · 🎯${m.assists}`}
                    </>
                  ) : (
                    "Suplente"
                  )}
                  {" · "}
                  <OvrDeltaBadge delta={m.ovrDelta} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
