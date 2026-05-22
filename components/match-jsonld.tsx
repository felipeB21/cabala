import { MatchWithTeams } from "@/actions/matches";

interface MatchJsonLdProps {
  match: MatchWithTeams;
}

export function MatchJsonLd({ match }: MatchJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    startDate: new Date(match.startsAt).toISOString(),
    endDate: new Date(match.startsAt).toISOString(),
    eventStatus:
      match.status === "finished"
        ? "https://schema.org/EventScheduled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "Argentina",
      address: {
        "@type": "PostalAddress",
        addressCountry: "AR",
      },
    },
    organizer: {
      "@type": "SportsOrganization",
      name: "Liga Profesional Argentina",
    },
    competitor: [
      {
        "@type": "SportsTeam",
        name: match.homeTeam.name,
        image: match.homeTeam.logo ?? undefined,
      },
      {
        "@type": "SportsTeam",
        name: match.awayTeam.name,
        image: match.awayTeam.logo ?? undefined,
      },
    ],
    ...(match.status === "finished" && {
      subEvent: {
        "@type": "SportsEvent",
        name: "Resultado final",
        description: `${match.homeTeam.name} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.name}`,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
