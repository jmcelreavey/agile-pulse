import { api } from "~/trpc/react";

interface UseChangelogDetailsProps {
  changelogId: number | null;
  enabled?: boolean;
}

export function useChangelogDetails({
  changelogId,
  enabled = true,
}: UseChangelogDetailsProps) {
  const {
    data: changelog,
    isLoading,
    error,
  } = api.changelog.getOne.useQuery(
    { id: changelogId! },
    { enabled: !!changelogId && enabled }
  );

  const { data: sharingHistory, isLoading: sharingHistoryLoading } =
    api.changelog.getSharingHistory.useQuery(
      { changelogId: changelogId! },
      { enabled: !!changelogId && enabled }
    );

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      sent: "green",
      pending: "yellow",
      failed: "red",
      delivered: "blue",
    };
    return { color: colors[status] || "gray", status };
  };

  const getMethodIcon = (method: string) => {
    const iconMap: Record<string, string> = {
      email: "mail",
      pdf: "file",
      default: "share",
    };
    return iconMap[method] || iconMap.default;
  };

  return {
    changelog,
    sharingHistory,
    isLoading: isLoading || sharingHistoryLoading,
    error,
    formatDate,
    getStatusBadge,
    getMethodIcon,
  };
}
