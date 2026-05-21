import { getScheduledMatches } from "@/actions/matches";
import { MatchCard } from "@/components/match-card";
import { Trophy } from "lucide-react";

export default async function Home() {
  const matches = await getScheduledMatches();

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">
          Predicciones de fútbol
        </h1>
        <p className="text-sm text-muted-foreground">
          Predecí los resultados, acumulá puntos y competí con todos.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Por ahora mostramos un partido por día — esta app la mantiene un solo
          programador.{" "}
          <a
            href="https://cafecito.app/felipebolgar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Si te gusta, invitame un cafecito ☕
          </a>
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
          Próximos partidos
        </h2>
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No hay partidos disponibles por ahora
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </main>
  );
}
