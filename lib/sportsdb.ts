import type {
  SportsDBEventsResponse,
  SportsDBTableResponse,
  SportsDBTeamsResponse,
} from "@/types/sportsdb";

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";
const ARGENTINA_LEAGUE_ID = "4406";

async function fetcher<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/${endpoint}`);

  if (!res.ok) {
    throw new Error(`TheSportsDB error: ${res.status} on ${endpoint}`);
  }

  return res.json() as Promise<T>;
}

export async function getUpcomingMatches(): Promise<SportsDBEventsResponse> {
  return fetcher(`eventsnextleague.php?id=${ARGENTINA_LEAGUE_ID}`);
}

export async function getPastMatches(): Promise<SportsDBEventsResponse> {
  return fetcher(`eventspastleague.php?id=${ARGENTINA_LEAGUE_ID}`);
}

export async function getLeagueTable(): Promise<SportsDBTableResponse> {
  return fetcher(`lookuptable.php?l=${ARGENTINA_LEAGUE_ID}`);
}

export async function getTeamsByLeague(): Promise<SportsDBTeamsResponse> {
  return fetcher(`search_all_teams.php?l=Argentinian+Primera+Division`);
}

export async function getTeamById(
  apiId: string,
): Promise<SportsDBTeamsResponse> {
  return fetcher(`lookupteam.php?id=${apiId}`);
}
