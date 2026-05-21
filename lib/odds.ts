import type { SportsDBTable } from "@/types/sportsdb";

const TOTAL_TEAMS = 30;
const BASE_POINTS = 100;
const MIN_ODDS = 110;
const MAX_ODDS = 1500;

export interface TeamForm {
  wins: number;
  draws: number;
  losses: number;
}

function calculateStrength(position: number, form: TeamForm): number {
  const positionScore = (TOTAL_TEAMS - position) / (TOTAL_TEAMS - 1);

  const formPoints = form.wins * 3 + form.draws;
  const formScore = formPoints / 15;

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
  homeTable: SportsDBTable,
  awayTable: SportsDBTable,
  homeForm: TeamForm,
  awayForm: TeamForm,
): MatchOdds {
  const homeStrength = calculateStrength(Number(homeTable.intRank), homeForm);
  const awayStrength = calculateStrength(Number(awayTable.intRank), awayForm);

  const total = homeStrength + awayStrength;

  const homeProb = Math.min((homeStrength / total) * 1.1, 0.85);
  const awayProb = Math.min((awayStrength / total) * 0.9, 0.75);
  const drawProb = Math.max(1 - homeProb - awayProb, 0.05);

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
