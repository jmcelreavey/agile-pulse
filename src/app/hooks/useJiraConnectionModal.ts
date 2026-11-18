import { useDisclosure } from "@mantine/hooks";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { JiraConnectionUseCase } from "~/app/logic/jira/JiraConnectionUseCase";
import { api } from "~/trpc/react";

export const useJiraConnectionModal = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const hasInitiallyAutoConfigured = useRef(false);
  const isManuallyUnlinked = useRef(false);

  // Use cases
  const jiraConnectionUseCase = new JiraConnectionUseCase();

  // API queries
  const connectionStatus = api.jira.getConnectionStatus.useQuery();

  // Derived state
  const isConnected = connectionStatus.data?.isConnected ?? false;
  const hasOAuthAccount = connectionStatus.data?.hasOAuthAccount ?? false;
  const fullName = connectionStatus.data?.fullName;
  const connectionType = connectionStatus.data?.connectionType;
  const cloudId = connectionStatus.data?.cloudId;

  // Connection state logic
  const getConnectionState = () => {
    if (isConnected) return "connected";
    if (hasOAuthAccount && jiraConnectionUseCase.isMutating)
      return "configuring";
    if (hasOAuthAccount) return "ready-to-configure";
    return "not-connected";
  };

  const connectionState = getConnectionState();
  const isLoading =
    jiraConnectionUseCase.isMutating ||
    isConnecting ||
    connectionStatus.isLoading;

  // Auto-configure when OAuth account becomes available (only once on initial load)
  useEffect(() => {
    if (
      hasOAuthAccount &&
      !isConnected &&
      !jiraConnectionUseCase.isMutating &&
      !hasInitiallyAutoConfigured.current &&
      !isManuallyUnlinked.current
    ) {
      hasInitiallyAutoConfigured.current = true;
      void handleAutoConfigureFromOAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOAuthAccount, isConnected, jiraConnectionUseCase.isMutating]);

  // Reset the manual unlink flag when connection state changes to connected
  useEffect(() => {
    if (isConnected) {
      isManuallyUnlinked.current = false;
    }
  }, [isConnected]);

  // Actions
  const handleOAuthSignIn = async () => {
    setIsConnecting(true);
    try {
      // Reset the auto-configure flag when user explicitly signs in
      hasInitiallyAutoConfigured.current = false;
      isManuallyUnlinked.current = false;
      await signIn("atlassian");
    } catch (error) {
      console.error("OAuth sign in failed:", error);
      ShowNotificationUtil({
        title: "Connection Failed",
        message: "Unable to connect to Jira. Please try again.",
        color: "red",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAutoConfigureFromOAuth = async () => {
    try {
      await jiraConnectionUseCase.autoConfigureFromOAuth();
    } catch (error) {
      console.error("Auto-configure from OAuth failed:", error);
    }
  };

  const handleUnlink = async () => {
    try {
      isManuallyUnlinked.current = true;
      await jiraConnectionUseCase.unlinkAccount();
    } catch (error) {
      console.error("Unlink account failed:", error);
    }
  };

  const handleRefreshConnection = async () => {
    try {
      await jiraConnectionUseCase.autoConfigureFromOAuth();
    } catch (error) {
      console.error("Refresh connection failed:", error);
    }
  };

  return {
    // Modal state
    opened,
    open,
    close,

    // Connection state
    isConnected,
    hasOAuthAccount,
    fullName,
    connectionType,
    cloudId,
    connectionState,
    isLoading,

    // Loading states
    isConnecting,
    connectionStatusLoading: connectionStatus.isLoading,

    // Actions
    handleOAuthSignIn,
    handleAutoConfigureFromOAuth,
    handleUnlink,
    handleRefreshConnection,

    // Use case for error handling
    jiraConnectionUseCase,
  };
};
