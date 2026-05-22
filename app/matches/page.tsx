import { getFinishedMatches, getScheduledMatches } from "@/actions/matches";
import { MatchCard } from "@/components/match-card";
import { Trophy, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partidos",
  description:
    "Todos los partidos de la Liga Profesional Argentina. Predecí resultados y seguí los partidos terminados.",
};

export default async function Matches() {
  const matches = await getScheduledMatches();
  const finishedMatches = await getFinishedMatches();

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
          Próximos partidos
        </h2>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <p className="text-sm text-muted-foreground text-center">
            No hay partidos disponibles por ahora
          </p>
          <a
            href="#terminados"
            className="text-sm text-blue-500 hover:underline"
          >
            Ver partidos terminados ↓
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}

      <div id="terminados" className="flex items-center gap-2 mb-4 mt-8">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
          Partidos terminados
        </h2>
      </div>

      {finishedMatches.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No hay partidos terminados por ahora
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {finishedMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
