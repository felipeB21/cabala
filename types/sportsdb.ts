export interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string | null;
  strBadge: string | null;
  strCountry: string | null;
}

export interface SportsDBEvent {
  idEvent: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strHomeTeam: string;
  strAwayTeam: string;
  dateEvent: string;
  strTime: string;
  strTimestamp: string | null;
  strStatus: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
}

export interface SportsDBTable {
  idTeam: string;
  strTeam: string;
  intRank: string;
  intWin: string;
  intDraw: string;
  intLoss: string;
  intPoints: string;
  intGoalsFor: string;
  intGoalsAgainst: string;
}

export interface SportsDBTeamsResponse {
  teams: SportsDBTeam[] | null;
}

export interface SportsDBEventsResponse {
  events: SportsDBEvent[] | null;
}

export interface SportsDBTableResponse {
  table: SportsDBTable[] | null;
}
