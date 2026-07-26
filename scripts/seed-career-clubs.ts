import { db } from "@/db";
import { careerClub } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ClubSeed {
  id: string;
  name: string;
  nationality: string;
  tier: "strong" | "mid" | "weak";
}

// Argentina keeps its existing stable IDs (already referenced by saved
// careers) — this run just backfills real logos onto them.
const clubs: ClubSeed[] = [
  { id: "ar-boca-juniors", name: "Boca Juniors", nationality: "argentina", tier: "strong" },
  { id: "ar-river-plate", name: "River Plate", nationality: "argentina", tier: "strong" },
  { id: "ar-rosario-central", name: "Rosario Central", nationality: "argentina", tier: "strong" },
  { id: "ar-independiente", name: "Independiente", nationality: "argentina", tier: "strong" },
  { id: "ar-estudiantes", name: "Estudiantes de La Plata", nationality: "argentina", tier: "strong" },
  { id: "ar-racing-club", name: "Racing Club", nationality: "argentina", tier: "mid" },
  { id: "ar-velez-sarsfield", name: "Vélez Sarsfield", nationality: "argentina", tier: "mid" },
  { id: "ar-argentinos-juniors", name: "Argentinos Juniors", nationality: "argentina", tier: "mid" },
  { id: "ar-huracan", name: "Huracán", nationality: "argentina", tier: "mid" },
  { id: "ar-newells", name: "Newell's Old Boys", nationality: "argentina", tier: "mid" },
  { id: "ar-platense", name: "Club Atlético Platense", nationality: "argentina", tier: "weak" },
  { id: "ar-deportivo-riestra", name: "Deportivo Riestra", nationality: "argentina", tier: "weak" },
  { id: "ar-sarmiento", name: "Sarmiento de Junín", nationality: "argentina", tier: "weak" },
  { id: "ar-atletico-tucuman", name: "Atlético Tucumán", nationality: "argentina", tier: "weak" },
  { id: "ar-barracas-central", name: "Barracas Central", nationality: "argentina", tier: "weak" },

  // Brasil — real clubs.
  { id: "br-flamengo", name: "Flamengo", nationality: "brasil", tier: "strong" },
  { id: "br-palmeiras", name: "Palmeiras", nationality: "brasil", tier: "strong" },
  { id: "br-sao-paulo", name: "São Paulo", nationality: "brasil", tier: "strong" },
  { id: "br-corinthians", name: "Corinthians", nationality: "brasil", tier: "strong" },
  { id: "br-gremio", name: "Grêmio", nationality: "brasil", tier: "strong" },
  { id: "br-internacional", name: "Internacional", nationality: "brasil", tier: "mid" },
  { id: "br-santos", name: "Santos", nationality: "brasil", tier: "mid" },
  { id: "br-atletico-mineiro", name: "Atlético Mineiro", nationality: "brasil", tier: "mid" },
  { id: "br-cruzeiro", name: "Cruzeiro", nationality: "brasil", tier: "mid" },
  { id: "br-fluminense", name: "Fluminense", nationality: "brasil", tier: "mid" },
  { id: "br-botafogo", name: "Botafogo", nationality: "brasil", tier: "weak" },
  { id: "br-vasco-da-gama", name: "Vasco da Gama", nationality: "brasil", tier: "weak" },
  { id: "br-bahia", name: "Bahia", nationality: "brasil", tier: "weak" },
  { id: "br-fortaleza", name: "Fortaleza", nationality: "brasil", tier: "weak" },
  { id: "br-athletico-paranaense", name: "Athletico Paranaense", nationality: "brasil", tier: "weak" },

  // España — real clubs.
  { id: "es-real-madrid", name: "Real Madrid", nationality: "espana", tier: "strong" },
  { id: "es-barcelona", name: "Barcelona", nationality: "espana", tier: "strong" },
  { id: "es-atletico-madrid", name: "Atlético Madrid", nationality: "espana", tier: "strong" },
  { id: "es-sevilla", name: "Sevilla", nationality: "espana", tier: "strong" },
  { id: "es-real-sociedad", name: "Real Sociedad", nationality: "espana", tier: "strong" },
  { id: "es-villarreal", name: "Villarreal", nationality: "espana", tier: "mid" },
  { id: "es-real-betis", name: "Real Betis", nationality: "espana", tier: "mid" },
  { id: "es-athletic-bilbao", name: "Athletic Bilbao", nationality: "espana", tier: "mid" },
  { id: "es-valencia", name: "Valencia", nationality: "espana", tier: "mid" },
  { id: "es-celta-vigo", name: "Celta Vigo", nationality: "espana", tier: "mid" },
  { id: "es-osasuna", name: "Osasuna", nationality: "espana", tier: "weak" },
  { id: "es-rayo-vallecano", name: "Rayo Vallecano", nationality: "espana", tier: "weak" },
  { id: "es-getafe", name: "Getafe", nationality: "espana", tier: "weak" },
  { id: "es-mallorca", name: "Mallorca", nationality: "espana", tier: "weak" },
  { id: "es-girona", name: "Girona", nationality: "espana", tier: "weak" },

  // Inglaterra — real clubs.
  { id: "en-manchester-city", name: "Manchester City", nationality: "inglaterra", tier: "strong" },
  { id: "en-liverpool", name: "Liverpool", nationality: "inglaterra", tier: "strong" },
  { id: "en-arsenal", name: "Arsenal", nationality: "inglaterra", tier: "strong" },
  { id: "en-manchester-united", name: "Manchester United", nationality: "inglaterra", tier: "strong" },
  { id: "en-chelsea", name: "Chelsea", nationality: "inglaterra", tier: "strong" },
  { id: "en-tottenham", name: "Tottenham Hotspur", nationality: "inglaterra", tier: "mid" },
  { id: "en-newcastle", name: "Newcastle United", nationality: "inglaterra", tier: "mid" },
  { id: "en-aston-villa", name: "Aston Villa", nationality: "inglaterra", tier: "mid" },
  { id: "en-west-ham", name: "West Ham United", nationality: "inglaterra", tier: "mid" },
  { id: "en-everton", name: "Everton", nationality: "inglaterra", tier: "mid" },
  { id: "en-leicester", name: "Leicester City", nationality: "inglaterra", tier: "weak" },
  { id: "en-crystal-palace", name: "Crystal Palace", nationality: "inglaterra", tier: "weak" },
  { id: "en-brighton", name: "Brighton & Hove Albion", nationality: "inglaterra", tier: "weak" },
  { id: "en-wolves", name: "Wolverhampton Wanderers", nationality: "inglaterra", tier: "weak" },
  { id: "en-fulham", name: "Fulham", nationality: "inglaterra", tier: "weak" },

  // Italia — real clubs.
  { id: "it-juventus", name: "Juventus", nationality: "italia", tier: "strong" },
  { id: "it-inter-milan", name: "Inter Milan", nationality: "italia", tier: "strong" },
  { id: "it-ac-milan", name: "AC Milan", nationality: "italia", tier: "strong" },
  { id: "it-napoli", name: "Napoli", nationality: "italia", tier: "strong" },
  { id: "it-roma", name: "Roma", nationality: "italia", tier: "strong" },
  { id: "it-lazio", name: "Lazio", nationality: "italia", tier: "mid" },
  { id: "it-atalanta", name: "Atalanta", nationality: "italia", tier: "mid" },
  { id: "it-fiorentina", name: "Fiorentina", nationality: "italia", tier: "mid" },
  { id: "it-torino", name: "Torino", nationality: "italia", tier: "mid" },
  { id: "it-bologna", name: "Bologna", nationality: "italia", tier: "mid" },
  { id: "it-sassuolo", name: "Sassuolo", nationality: "italia", tier: "weak" },
  { id: "it-udinese", name: "Udinese", nationality: "italia", tier: "weak" },
  { id: "it-sampdoria", name: "Sampdoria", nationality: "italia", tier: "weak" },
  { id: "it-genoa", name: "Genoa", nationality: "italia", tier: "weak" },
  { id: "it-cagliari", name: "Cagliari", nationality: "italia", tier: "weak" },
];

interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
  strSport: string;
  strBadge: string | null;
}

interface SportsDBSearchResponse {
  teams: SportsDBTeam[] | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLogo(name: string, attempt = 1): Promise<string | null> {
  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(name)}`,
  );

  if (res.status === 429 && attempt <= 3) {
    const backoffMs = attempt * 2000;
    console.warn(`⏳ Rate limited buscando "${name}", reintentando en ${backoffMs}ms...`);
    await sleep(backoffMs);
    return fetchLogo(name, attempt + 1);
  }

  if (!res.ok) {
    console.warn(`⚠️ TheSportsDB error ${res.status} buscando "${name}"`);
    return null;
  }

  const data: SportsDBSearchResponse = await res.json();
  const match = data.teams?.find((t) => t.strSport === "Soccer");

  if (!match?.strBadge) {
    console.warn(`⚠️ No se encontró escudo real para "${name}"`);
    return null;
  }

  return match.strBadge;
}

async function seedCareerClubs() {
  // The other 4 nationalities' old fictional/placeholder clubs are being
  // fully replaced — safe to delete since only Argentina careers exist
  // among saved players.
  for (const nationality of ["brasil", "espana", "inglaterra", "italia"]) {
    await db.delete(careerClub).where(eq(careerClub.nationality, nationality));
  }

  let updated = 0;
  let inserted = 0;
  let missingLogo = 0;

  for (const club of clubs) {
    const logo = await fetchLogo(club.name);
    if (!logo) missingLogo++;
    await sleep(600);

    if (club.nationality === "argentina") {
      await db
        .insert(careerClub)
        .values({ ...club, logo })
        .onConflictDoUpdate({
          target: careerClub.id,
          set: { name: club.name, tier: club.tier, logo },
        });
      updated++;
    } else {
      await db.insert(careerClub).values({ ...club, logo }).onConflictDoNothing();
      inserted++;
    }
  }

  console.log(
    `✅ ${updated} clubes de Argentina actualizados, ${inserted} clubes nuevos insertados, ${missingLogo} sin escudo encontrado (de ${clubs.length} totales)`,
  );
}

seedCareerClubs();
