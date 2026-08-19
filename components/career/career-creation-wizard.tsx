"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCareerClubs } from "@/hooks/use-career";
import type { NewCareerInput } from "@/hooks/use-local-career";
import type { CareerPosition, ClubTier } from "@/lib/career";
import { ClubCrest } from "@/components/career/club-crest";
import { CountryFlag } from "@/components/career/country-flag";
import { JerseyPreview } from "@/components/career/jersey-preview";
import { playClickSound } from "@/lib/sfx";

const NATIONALITIES = [
  { value: "argentina", label: "Argentina" },
  { value: "brasil", label: "Brasil" },
  { value: "espana", label: "España" },
  { value: "inglaterra", label: "Inglaterra" },
  { value: "italia", label: "Italia" },
];

const POSITIONS: { value: CareerPosition; label: string }[] = [
  { value: "goalkeeper", label: "Arquero" },
  { value: "defender", label: "Defensor" },
  { value: "midfielder", label: "Mediocampista" },
  { value: "forward", label: "Delantero" },
];

// Still drives which clubs get offered (one candidate per tier, so the three
// options aren't all the same calibre) and the simulation — but the tier
// itself is never surfaced to the player, who just picks a club by name.
const TIER_ORDER: ClubTier[] = ["strong", "mid", "weak"];

interface FormState {
  jerseyName: string;
  squadNumber: string;
  nationality: string;
  position: CareerPosition | "";
}

interface CareerCreationWizardProps {
  onCreate: (input: NewCareerInput) => void;
}

const stepVariants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

export function CareerCreationWizard({ onCreate }: CareerCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    jerseyName: "",
    squadNumber: "",
    nationality: "",
    position: "",
  });
  const [selectedTier, setSelectedTier] = useState<ClubTier | null>(null);
  const [confirming, setConfirming] = useState(false);

  const { data: clubs } = useCareerClubs(form.nationality);
  const [candidates, setCandidates] = useState<Partial<
    Record<ClubTier, NonNullable<typeof clubs>[number]>
  > | null>(null);

  useEffect(() => {
    if (!clubs || clubs.length === 0) return;

    // Math.random() makes this inherently impure, so it can't live in a
    // render-time computation (useMemo) — it has to be an effect. Runs once
    // per resolved `clubs` query (i.e. once per nationality selection), not
    // re-rolled on every render.
    const picks: Partial<Record<ClubTier, (typeof clubs)[number]>> = {};
    for (const tier of TIER_ORDER) {
      const tierClubs = clubs.filter((c) => c.tier === tier);
      if (tierClubs.length > 0) {
        picks[tier] = tierClubs[Math.floor(Math.random() * tierClubs.length)];
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCandidates(picks);
  }, [clubs]);

  const squadNumberValue = Number(form.squadNumber);
  const isSquadNumberValid =
    Number.isInteger(squadNumberValue) &&
    squadNumberValue >= 1 &&
    squadNumberValue <= 99;

  const canAdvanceStep1 =
    form.jerseyName.trim().length > 0 &&
    isSquadNumberValid &&
    !!form.nationality;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  }

  function goToStep(next: number) {
    playClickSound();
    setStep(next);
  }

  function handleSelectTier(tier: ClubTier) {
    playClickSound();
    setSelectedTier(tier);
    setConfirming(true);
  }

  function handleCancel() {
    setSelectedTier(null);
    setConfirming(false);
  }

  function handleConfirm() {
    if (!selectedTier || !form.position || !candidates) return;
    const club = candidates[selectedTier];
    if (!club) return;

    onCreate({
      jerseyName: form.jerseyName.trim().toUpperCase().slice(0, 12),
      squadNumber: squadNumberValue,
      nationality: form.nationality,
      position: form.position,
      club: {
        id: club.id,
        name: club.name,
        tier: club.tier as ClubTier,
        logo: club.logo,
      },
    });
  }

  const selectedClub = selectedTier ? candidates?.[selectedTier] : undefined;
  const selectedPositionLabel = POSITIONS.find(
    (p) => p.value === form.position,
  )?.label;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="text-center mb-5">
        <h1 className="font-heading text-lg font-extrabold">Modo Carrera</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Creá tu jugador. No necesitás cuenta para jugar.
        </p>
      </div>

      <JerseyPreview
        jerseyName={form.jerseyName || "JUGADOR"}
        squadNumber={form.squadNumber || "0"}
        crestUrl={step === 3 ? selectedClub?.logo : undefined}
        className="mb-5 scale-90"
      />

      <AnimatePresence mode="wait" initial={false}>
        {step === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Identidad</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="jerseyName">Nombre en la camiseta</Label>
                  <Input
                    id="jerseyName"
                    type="text"
                    value={form.jerseyName}
                    onChange={handleChange}
                    placeholder="EJ: MESSI"
                    maxLength={12}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="squadNumber">Dorsal</Label>
                  <Input
                    id="squadNumber"
                    type="number"
                    value={form.squadNumber}
                    onChange={handleChange}
                    placeholder="1-99"
                    min={1}
                    max={99}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Nacionalidad</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {NATIONALITIES.map((nat) => (
                      <button
                        key={nat.value}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setForm((prev) => ({
                            ...prev,
                            nationality: nat.value,
                          }));
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-[11px] font-medium transition-colors",
                          "hover:bg-muted",
                          form.nationality === nat.value
                            ? "bg-primary/10 border-primary"
                            : "bg-background border-border/60",
                        )}
                      >
                        <CountryFlag nationality={nat.value} width={28} />
                        {nat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => goToStep(2)}
                  disabled={!canAdvanceStep1}
                  className="w-full mt-2"
                >
                  Siguiente
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Posición</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-2">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setForm((prev) => ({ ...prev, position: pos.value }));
                      }}
                      className={cn(
                        "rounded-lg border px-2 py-3 text-[12px] font-medium transition-colors",
                        "hover:bg-muted",
                        form.position === pos.value
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border/60",
                      )}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
                {form.position === "goalkeeper" && (
                  <p className="text-[11px] text-muted-foreground">
                    Los arqueros no pueden convertir goles.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button variant="secondary" onClick={() => goToStep(1)}>
                    Atrás
                  </Button>
                  <Button
                    onClick={() => goToStep(3)}
                    disabled={!form.position}
                  >
                    Siguiente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Club</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <p className="text-[11px] text-muted-foreground -mt-2">
                  Elegí entre estas tres opciones para tu nacionalidad
                </p>

                {candidates && (
                  <div className="grid grid-cols-3 gap-2">
                    {TIER_ORDER.map((tier) => {
                      const club = candidates[tier];
                      if (!club) return null;

                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => handleSelectTier(tier)}
                          disabled={confirming}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors",
                            "hover:bg-muted",
                            selectedTier === tier
                              ? "bg-primary/10 border-primary"
                              : "bg-background border-border/60",
                          )}
                        >
                          <ClubCrest
                            name={club.name}
                            tier={tier}
                            logo={club.logo}
                            size={32}
                          />
                          <span className="text-[10px] font-medium leading-tight">
                            {club.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <AnimatePresence>
                  {confirming && selectedClub && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-muted/50 rounded-lg border border-border/60 p-3 flex flex-col gap-2.5">
                        <p className="text-[12px] text-muted-foreground text-center">
                          {form.jerseyName.toUpperCase()} · #{form.squadNumber}{" "}
                          · {selectedPositionLabel} ·{" "}
                          <span className="font-medium text-foreground">
                            {selectedClub.name}
                          </span>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="secondary" onClick={handleCancel}>
                            Cancelar
                          </Button>
                          <Button onClick={handleConfirm}>Confirmar</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!confirming && (
                  <Button variant="secondary" onClick={() => goToStep(2)}>
                    Atrás
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
