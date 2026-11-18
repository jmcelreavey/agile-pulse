import { useState } from "react";

interface UseChangelogListViewProps {
  projectId?: number;
}

export function useChangelogListView({ projectId }: UseChangelogListViewProps) {
  const [activeTab, setActiveTab] = useState("management");
  const [selectedChangelogId, setSelectedChangelogId] = useState<number | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleViewDetails = (changelogId: number) => {
    setSelectedChangelogId(changelogId);
    setShowDetailsModal(true);
  };

  const handleEdit = (changelogId: number) => {
    setSelectedChangelogId(changelogId);
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowDetailsModal(false);
    setShowEditModal(false);
    setSelectedChangelogId(null);
  };

  const handleTabChange = (value: string | null) => {
    if (value) {
      setActiveTab(value);
    }
  };

  return {
    // Tab state
    activeTab,
    handleTabChange,

    // Modal state
    selectedChangelogId,
    showDetailsModal,
    showEditModal,

    // Actions
    handleViewDetails,
    handleEdit,
    handleCloseModals,

    // Context
    projectId,
  };
}
