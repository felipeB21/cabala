import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllCareerClubs,
  getCareerClubs,
  getCareerLeaderboard,
  getCareerMatchHistory,
  getMyCareer,
  saveCareer,
} from "@/actions/career";

export function useMyCareer() {
  return useQuery({
    queryKey: ["career"],
    queryFn: () => getMyCareer(),
  });
}

export function useCareerClubs(nationality: string) {
  return useQuery({
    queryKey: ["career", "clubs", nationality],
    queryFn: () => getCareerClubs(nationality),
    enabled: !!nationality,
  });
}

export function useCareerMatchHistory(limit = 20) {
  return useQuery({
    queryKey: ["career", "history", limit],
    queryFn: () => getCareerMatchHistory(limit),
  });
}

export function useSaveCareer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveCareer,
    onSuccess: (res) => {
      if (!res.success) return;
      queryClient.invalidateQueries({ queryKey: ["career"] });
    },
  });
}

export function useAllCareerClubs() {
  return useQuery({
    queryKey: ["career", "clubs", "all"],
    queryFn: () => getAllCareerClubs(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCareerLeaderboard(limit = 50) {
  return useQuery({
    queryKey: ["career", "leaderboard", limit],
    queryFn: () => getCareerLeaderboard(limit),
  });
}
