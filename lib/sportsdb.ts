import type {
  SportsDBEventsResponse,
  SportsDBTableResponse,
  SportsDBTeamsResponse,
} from "@/types/sportsdb";

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";
const ARGENTINA_LEAGUE_ID = "4406";
const LIBERTADORES_ID = "4501";
const SUDAMERICANA_ID = "4724";

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

export async function getUpcomingLibertadores(): Promise<SportsDBEventsResponse> {
  return fetcher(`eventsnextleague.php?id=${LIBERTADORES_ID}`);
}

export async function getPastLibertadores(): Promise<SportsDBEventsResponse> {
  return fetcher(`eventspastleague.php?id=${LIBERTADORES_ID}`);
}

export async function getUpcomingSudamericana(): Promise<SportsDBEventsResponse> {
  return fetcher(`eventsnextleague.php?id=${SUDAMERICANA_ID}`);
}

export async function getPastSudamericana(): Promise<SportsDBEventsResponse> {
  return fetcher(`eventspastleague.php?id=${SUDAMERICANA_ID}`);
}

export async function getPastMatches(): Promise<SportsDBEventsResponse> {
  return fetcher(`eventspastleague.php?id=${ARGENTINA_LEAGUE_ID}`);
}

// `eventspastleague.php` only returns a rolling window of the most recent
// events, so a match can scroll out of it before a cron run catches it.
// This looks up a single event by id regardless of how old it is — used as
// a fallback for matches stuck as "scheduled" well past kickoff.
export async function getEventById(
  apiId: string | number,
): Promise<SportsDBEventsResponse> {
  return fetcher(`lookupevent.php?id=${apiId}`);
}

export async function getLeagueTable(): Promise<SportsDBTableResponse> {
  return fetcher(`lookuptable.php?l=${ARGENTINA_LEAGUE_ID}`);
}

export async function getTeamById(
  apiId: string,
): Promise<SportsDBTeamsResponse> {
  return fetcher(`lookupteam.php?id=${apiId}`);
}
