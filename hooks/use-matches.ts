import { useQuery } from "@tanstack/react-query";
import { getScheduledMatches, getFinishedMatches } from "@/actions/matches";

export function useScheduledMatches() {
  return useQuery({
    queryKey: ["matches", "scheduled"],
    queryFn: () => getScheduledMatches(),
  });
}

export function useFinishedMatches() {
  return useQuery({
    queryKey: ["matches", "finished"],
    queryFn: () => getFinishedMatches(),
  });
}
