import { notFound } from "next/navigation";
import {
  getMatchBySlug,
  getMatchPredictionStats,
  getMatchComments,
} from "@/actions/matches";
import { MatchDetailClient } from "@/components/match-detail";
import type { Metadata } from "next";
import { MatchJsonLd } from "@/components/match-jsonld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const match = await getMatchBySlug(slug);

  if (!match) return { title: "Partido no encontrado" };

  const title = `${match.homeTeam.name} vs ${match.awayTeam.name} — Predicciones`;
  const description =
    match.status === "finished"
      ? `${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name}. Mirá las predicciones de la comunidad.`
      : `Predecí el resultado de ${match.homeTeam.name} vs ${match.awayTeam.name} en Cábala. Acumulá puntos y competí con todos.`;

  return {
    title,
    description,
    openGraph: { title: `${title} | Cábala`, description },
  };
}

export default async function MatchDetailPage({ params }: Props) {
  const { slug } = await params;

  const match = await getMatchBySlug(slug);
  if (!match) notFound();

  const [stats, comments] = await Promise.all([
    getMatchPredictionStats(match.id),
    getMatchComments(match.id),
  ]);

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <MatchJsonLd match={match} />

      <MatchDetailClient
        match={match}
        stats={stats}
        initialComments={comments}
      />
    </main>
  );
}
