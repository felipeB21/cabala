"use client";

import { useEffect, useRef } from "react";
import { useMyCareer } from "@/hooks/use-career";
import { useLocalCareer, type LocalCareer } from "@/hooks/use-local-career";
import { getCareerMatchHistory } from "@/actions/career";
import { CareerCreationWizard } from "@/components/career/career-creation-wizard";
import { CareerDashboard } from "@/components/career/career-dashboard";
import { CareerRanking } from "@/components/career/career-ranking";
import { Loader2 } from "lucide-react";
import {
  RETIREMENT_AGE,
  type CareerPosition,
  type ClubTier,
  type Trophy,
} from "@/lib/career";

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

export function CareerView() {
  const { data: serverCareer } = useMyCareer();
  const {
    career,
    hydrated,
    createCareer,
    simulateNextMatch,
    resolvePenaltyOutcome,
    resolveOffer,
    resolveLifeEvent,
    hydrateFromServer,
    markSaved,
    resetCareer,
  } = useLocalCareer();
  const hydrating = useRef(false);

  useEffect(() => {
    if (!hydrated || career || !serverCareer || hydrating.current) return;

    hydrating.current = true;

    getCareerMatchHistory(5000).then((history) => {
      const hydratedCareer: LocalCareer = {
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
      hydrateFromServer(hydratedCareer);
    });
  }, [hydrated, career, serverCareer, hydrateFromServer]);

  if (!hydrated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {career ? (
        <CareerDashboard
          career={career}
          simulateNextMatch={simulateNextMatch}
          resolvePenaltyOutcome={resolvePenaltyOutcome}
          resolveOffer={resolveOffer}
          resolveLifeEvent={resolveLifeEvent}
          markSaved={markSaved}
          resetCareer={resetCareer}
        />
      ) : (
        <CareerCreationWizard onCreate={createCareer} />
      )}

      <CareerRanking />
    </div>
  );
}
