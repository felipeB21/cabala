"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { ClubCrest } from "@/components/career/club-crest";
import type { ClubTier } from "@/lib/career";

export interface ConflictCareerSummary {
  jerseyName: string;
  squadNumber: number;
  ovr: number;
  age: number;
  matches: number;
  clubName: string;
  clubTier: ClubTier;
  clubLogo?: string | null;
}

interface CareerConflictDialogProps {
  saved: ConflictCareerSummary;
  local: ConflictCareerSummary;
  onKeepSaved: () => void;
  onKeepLocal: () => void;
}

// Shown when a career played without a session collides with one already
// saved to the account. Both are real progress and `saveCareer` upserts on
// `userId`, so picking for the player would silently destroy one of them.
export function CareerConflictDialog({
  saved,
  local,
  onKeepSaved,
  onKeepLocal,
}: CareerConflictDialogProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="text-center mb-5">
        <h1 className="font-heading text-base font-extrabold">
          Ya tenés una carrera guardada
        </h1>
        <p className="text-[12px] text-muted-foreground mt-1.5">
          Elegí con cuál seguís. La otra se va a perder.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <CareerOption
          career={saved}
          note="Guardada en tu cuenta"
          action="Continuar esta"
          onSelect={onKeepSaved}
        />
        <CareerOption
          career={local}
          note="Sin guardar, en este dispositivo"
          action="Seguir con esta"
          onSelect={onKeepLocal}
        />
      </div>
    </div>
  );
}

function CareerOption({
  career,
  note,
  action,
  onSelect,
}: {
  career: ConflictCareerSummary;
  note: string;
  action: string;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.99 }}
      className="text-left"
    >
      <Card className="transition-colors hover:border-primary">
        <CardContent className="flex items-center gap-3">
          <ClubCrest
            name={career.clubName}
            tier={career.clubTier}
            logo={career.clubLogo}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-extrabold truncate">
              {career.jerseyName}{" "}
              <span className="text-muted-foreground font-medium">
                #{career.squadNumber}
              </span>
            </p>
            <p className="font-mono text-[12px] text-muted-foreground mt-0.5">
              OVR {career.ovr} · {career.age} años · {career.matches}{" "}
              {career.matches === 1 ? "partido" : "partidos"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {career.clubName} · {note}
            </p>
          </div>
          <span className="text-[11px] font-medium text-primary shrink-0">
            {action}
          </span>
        </CardContent>
      </Card>
    </motion.button>
  );
}
