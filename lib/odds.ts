import type { SportsDBTable } from "@/types/sportsdb";

const TOTAL_TEAMS = 30;
const BASE_POINTS = 100;
const MIN_ODDS = 110;
const MAX_ODDS = 1500;

const HOME_ADVANTAGE = 1.1;
const AWAY_DISADVANTAGE = 0.9;

// Draw probability scales with how evenly matched the two teams are:
// DRAW_BASE for a lopsided game, up to DRAW_BASE + DRAW_SPREAD when even.
const DRAW_BASE = 0.18;
const DRAW_SPREAD = 0.14;

export interface TeamForm {
  wins: number;
  draws: number;
  losses: number;
}

function calculateStrength(position: number | null, form: TeamForm): number {
  const formPoints = form.wins * 3 + form.draws;
  const formScore = formPoints / 15;

  // No real league-table data exists for this match's competition (Copa
  // Libertadores/Sudamericana don't expose a table via TheSportsDB — a
  // fabricated neutral position would be identical for both sides and just
  // dilute the one real signal we have, recent form, rather than adding
  // information).
  if (position === null) return formScore;

  const positionScore = (TOTAL_TEAMS - position) / (TOTAL_TEAMS - 1);

  return positionScore * 0.6 + formScore * 0.4;
}

function strengthToOdds(probability: number): number {
  const raw = Math.round((1 / probability) * 100);
  return Math.min(Math.max(raw, MIN_ODDS), MAX_ODDS);
}

export interface MatchOdds {
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
}

export function calculateMatchOdds(
  homeTable: SportsDBTable | null,
  awayTable: SportsDBTable | null,
  homeForm: TeamForm,
  awayForm: TeamForm,
): MatchOdds {
  const homeStrength = calculateStrength(
    homeTable ? Number(homeTable.intRank) : null,
    homeForm,
  );
  const awayStrength = calculateStrength(
    awayTable ? Number(awayTable.intRank) : null,
    awayForm,
  );

  const adjustedHome = homeStrength * HOME_ADVANTAGE;
  const adjustedAway = awayStrength * AWAY_DISADVANTAGE;
  const total = adjustedHome + adjustedAway;

  const homeWinShare = adjustedHome / total;
  const awayWinShare = adjustedAway / total;

  // Teams closer in strength draw more often; a huge mismatch draws rarely.
  const closeness = 1 - Math.abs(homeWinShare - awayWinShare);
  const drawProb = DRAW_BASE + DRAW_SPREAD * closeness;

  // homeProb + drawProb + awayProb sum to exactly 1 by construction.
  const homeProb = homeWinShare * (1 - drawProb);
  const awayProb = awayWinShare * (1 - drawProb);

  return {
    homeOdds: strengthToOdds(homeProb),
    drawOdds: strengthToOdds(drawProb),
    awayOdds: strengthToOdds(awayProb),
  };
}

export function calculatePointsWon(
  odds: number,
  basePoints: number = BASE_POINTS,
): number {
  return Math.round(basePoints * (odds / 100));
}
