"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useMyCareer } from "@/hooks/use-career";
import { useLocalCareer, type LocalCareer } from "@/hooks/use-local-career";
import { getCareerMatchHistory } from "@/actions/career";
import { CareerCreationWizard } from "@/components/career/career-creation-wizard";
import { CareerDashboard } from "@/components/career/career-dashboard";
import { CareerConflictDialog } from "@/components/career/career-conflict-dialog";
import { CareerRanking } from "@/components/career/career-ranking";
import { Loader2 } from "lucide-react";
import {
  RETIREMENT_AGE,
  type CareerPosition,
  type ClubTier,
  type Trophy,
} from "@/lib/career";

type ServerCareer = NonNullable<Awaited<ReturnType<typeof useMyCareer>["data"]>>;

function parseTrophies(raw: string): Trophy[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseClubsHistory(raw: string, fallback: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [fallback];
  } catch {
    return [fallback];
  }
}

async function toLocalCareer(serverCareer: ServerCareer): Promise<LocalCareer> {
  const history = await getCareerMatchHistory(5000);

  return {
    jerseyName: serverCareer.jerseyName,
    squadNumber: serverCareer.squadNumber,
    nationality: serverCareer.nationality,
    position: serverCareer.position as CareerPosition,
    club: {
      id: serverCareer.club.id,
      name: serverCareer.club.name,
      tier: serverCareer.club.tier as ClubTier,
      logo: serverCareer.club.logo,
    },
    ovr: serverCareer.ovr,
    attributes: {
      pace: serverCareer.pace,
      shooting: serverCareer.shooting,
      passing: serverCareer.passing,
      defending: serverCareer.defending,
      physical: serverCareer.physical,
    },
    age: serverCareer.age,
    seasonNumber: serverCareer.seasonNumber,
    matchesPlayedInSeason: serverCareer.matchesPlayedInSeason,
    appearances: serverCareer.appearances,
    goals: serverCareer.goals,
    assists: serverCareer.assists,
    energy: serverCareer.energy,
    morale: serverCareer.morale,
    teamReputation: serverCareer.teamReputation,
    fanReputation: serverCareer.fanReputation,
    relationshipStatus:
      serverCareer.relationshipStatus as LocalCareer["relationshipStatus"],
    suspended: serverCareer.suspended,
    injuredMatchesRemaining: serverCareer.injuredMatchesRemaining,
    trophies: parseTrophies(serverCareer.trophies),
    clubsHistory: parseClubsHistory(
      serverCareer.clubsHistory,
      serverCareer.club.name,
    ),
    retired: serverCareer.age >= RETIREMENT_AGE,
    pendingOffers: null,
    pendingLifeEvent: null,
    pendingPenalty: null,
    matches: history
      .slice()
      .reverse()
      .map((m) => ({
        seasonNumber: m.seasonNumber,
        matchNumber: m.matchNumber,
        started: m.started,
        rating: m.rating,
        goals: m.goals,
        assists: m.assists,
        redCard: m.redCard,
        injured: m.injured,
        ovrDelta: m.ovrDelta,
        ovrAfter: m.ovrAfter,
        ageAtMatch: m.ageAtMatch,
        clubResult: m.clubResult as LocalCareer["matches"][number]["clubResult"],
      })),
    linkedToServer: true,
  };
}

export function CareerView() {
  const { data: session } = authClient.useSession();
  const { data: serverCareer, isPending: serverCareerPending } = useMyCareer();
  const {
    career,
    hydrated,
    createCareer,
    simulateNextMatch,
    restMatch,
    resolvePenaltyOutcome,
    resolveOffer,
    resolveLifeEvent,
    hydrateFromServer,
    markSaved,
    resetCareer,
  } = useLocalCareer();
  const hydrating = useRef(false);
  const [resolvingConflict, setResolvingConflict] = useState(false);
  // The player asked for a fresh career. Without this, wiping local state
  // just re-triggers the "local is empty but the account has a saved career"
  // path — which either hydrates the old career straight back or, once the
  // hydration latch below has already fired, gates the view on a hydration
  // that never runs again and leaves it loading forever.
  const [startingNew, setStartingNew] = useState(false);

  const startNewCareer = useCallback(() => {
    resetCareer();
    setStartingNew(true);
  }, [resetCareer]);

  // Same player identity = the same career, just on a device whose
  // localStorage predates `linkedToServer` (or was written by an older
  // build). Prompting there would block saving for no reason, so it gets
  // linked silently below and only a genuinely different career prompts.
  const sameAsSaved =
    !!serverCareer &&
    !!career &&
    serverCareer.jerseyName === career.jerseyName &&
    serverCareer.squadNumber === career.squadNumber &&
    serverCareer.nationality === career.nationality &&
    serverCareer.position === career.position;

  // A *different* local career that was never linked to this account would
  // destroy the saved one — `saveCareer` upserts on `userId` — so it has to
  // be the player's explicit choice.
  // `startingNew` means the player already answered this question by asking
  // for a fresh career — prompting again would be asking twice.
  const conflict =
    !!session?.user &&
    !!serverCareer &&
    !!career &&
    !career.linkedToServer &&
    !sameAsSaved &&
    !startingNew;

  useEffect(() => {
    if (session?.user && sameAsSaved && career && !career.linkedToServer) {
      markSaved();
    }
  }, [session, sameAsSaved, career, markSaved]);

  const keepServerCareer = useCallback(async () => {
    if (!serverCareer) return;
    setResolvingConflict(true);
    hydrateFromServer(await toLocalCareer(serverCareer));
    setResolvingConflict(false);
  }, [serverCareer, hydrateFromServer]);

  useEffect(() => {
    if (!hydrated || career || !serverCareer || startingNew || hydrating.current) {
      return;
    }

    hydrating.current = true;
    toLocalCareer(serverCareer)
      .then(hydrateFromServer)
      // Releasing the latch on failure matters: otherwise one failed history
      // fetch leaves the view stuck on the loader with no way back.
      .catch(() => {
        hydrating.current = false;
      });
  }, [hydrated, career, serverCareer, startingNew, hydrateFromServer]);

  // Keep the loader up until we know whether a saved server career exists and
  // (if it does) it has finished hydrating. Rendering the creation wizard in
  // that gap made a saved career look lost — and starting a new one there
  // would overwrite it on the next save.
  const waitingForServerCareer =
    !career && !startingNew && (serverCareerPending || !!serverCareer);

  if (!hydrated || waitingForServerCareer || resolvingConflict) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conflict && serverCareer && career) {
    return (
      <div className="flex flex-col gap-10">
        <CareerConflictDialog
          saved={{
            jerseyName: serverCareer.jerseyName,
            squadNumber: serverCareer.squadNumber,
            ovr: serverCareer.ovr,
            age: serverCareer.age,
            matches: serverCareer.appearances,
            clubName: serverCareer.club.name,
            clubTier: serverCareer.club.tier as ClubTier,
            clubLogo: serverCareer.club.logo,
          }}
          local={{
            jerseyName: career.jerseyName,
            squadNumber: career.squadNumber,
            ovr: career.ovr,
            age: career.age,
            matches: career.appearances,
            clubName: career.club.name,
            clubTier: career.club.tier,
            clubLogo: career.club.logo,
          }}
          onKeepSaved={keepServerCareer}
          // Marking the local career as linked both clears the conflict and
          // releases auto-save, which then overwrites the saved one — the
          // player's explicit choice.
          onKeepLocal={markSaved}
        />

        <CareerRanking />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {career ? (
        <CareerDashboard
          career={career}
          simulateNextMatch={simulateNextMatch}
          restMatch={restMatch}
          resolvePenaltyOutcome={resolvePenaltyOutcome}
          resolveOffer={resolveOffer}
          resolveLifeEvent={resolveLifeEvent}
          markSaved={markSaved}
          resetCareer={startNewCareer}
          canAutoSave={!conflict}
        />
      ) : (
        <CareerCreationWizard onCreate={createCareer} />
      )}

      <CareerRanking />
    </div>
  );
}
