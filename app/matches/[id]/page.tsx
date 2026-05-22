import { notFound } from "next/navigation";
import {
  getMatchById,
  getMatchPredictionStats,
  getMatchComments,
} from "@/actions/matches";
import { MatchDetailClient } from "@/components/match-detail";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatchById(id);

  if (!match) return { title: "Partido no encontrado" };

  const title = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
  const description =
    match.status === "finished"
      ? `${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name}. Mirá las predicciones de la comunidad.`
      : `Predecí el resultado de ${match.homeTeam.name} vs ${match.awayTeam.name} en Cábala. Acumulá puntos y competí con todos.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Cábala`,
      description,
    },
  };
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;

  const [match, stats, comments] = await Promise.all([
    getMatchById(id),
    getMatchPredictionStats(id),
    getMatchComments(id),
  ]);

  if (!match) notFound();

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <MatchDetailClient
        match={match}
        stats={stats}
        initialComments={comments}
      />
    </main>
  );
}
