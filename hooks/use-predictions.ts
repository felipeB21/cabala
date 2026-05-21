import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPrediction } from "@/actions/predictions";

export function useCreatePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrediction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
