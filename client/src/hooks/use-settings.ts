import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SortOption } from "@shared/schema";

export interface AppSettings {
  userId: string;
  autoPinNewTasks: boolean;
  enableInProgressTime: boolean;
  alwaysSortPinnedByPriority: boolean;
  sortBy: SortOption;
}

const DEFAULT_SETTINGS: Omit<AppSettings, "userId"> = {
  autoPinNewTasks: true,
  enableInProgressTime: true,
  alwaysSortPinnedByPriority: true,
  sortBy: "priority",
};

export const useSettings = () => {
  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AppSettings>) => {
      const res = await apiRequest("PUT", "/api/settings", updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  const updateSetting = <K extends keyof Omit<AppSettings, "userId">>(
    key: K,
    value: AppSettings[K]
  ) => {
    updateMutation.mutate({ [key]: value });
  };

  return {
    settings: settings || { ...DEFAULT_SETTINGS, userId: "" },
    isLoading,
    updateSetting,
  };
};

export const getSettings = (): Omit<AppSettings, "userId"> => {
  const cached = queryClient.getQueryData<AppSettings>(["/api/settings"]);
  return cached || DEFAULT_SETTINGS;
};
