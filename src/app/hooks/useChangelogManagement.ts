import { useState } from "react";
import { DeleteChangelogUseCase } from "~/app/logic/changelog/DeleteChangelogUseCase";
import { EmailChangelogUseCase } from "~/app/logic/changelog/EmailChangelogUseCase";
import { PreviewChangelogPdfUseCase } from "~/app/logic/changelog/PreviewChangelogPdfUseCase";
import { PublishChangelogUseCase } from "~/app/logic/changelog/PublishChangelogUseCase";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { api } from "~/trpc/react";

interface UseChangelogManagementProps {
  projectId?: number;
  sprintId?: number;
}

// Type for changelog object from the API
type ChangelogWithRelations = {
  id: number;
  content: string;
  sprintId: number;
  isPublished: boolean;
  sharedAt: string | Date | null;
  sharedViaEmail: boolean;
  exportedToPdf: boolean;
  sprint: {
    id: number;
    reference: string;
    project: {
      id: number;
      name: string;
    };
  };
  creator: {
    id: number; // Changed from string to number
    name: string | null; // Made nullable
    email: string | null; // Made nullable
  } | null;
  _count: {
    sharingHistory: number;
  };
};

export function useChangelogManagement({
  projectId,
  sprintId,
}: UseChangelogManagementProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<string | null>(null);
  const [selectedChangelog, setSelectedChangelog] = useState<number | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailChangelog, setEmailChangelog] = useState<ChangelogWithRelations | null>(null);

  const limit = 10;
  const offset = (page - 1) * limit;

  // Use cases for mutations
  const deleteUseCase = new DeleteChangelogUseCase();
  const publishUseCase = new PublishChangelogUseCase();
  const previewPdfUseCase = new PreviewChangelogPdfUseCase();
  const emailUseCase = new EmailChangelogUseCase();

  // Get tRPC utils for making queries
  const utils = api.useUtils();

  // Query for changelogs
  const {
    data: changelogsData,
    isLoading,
    refetch,
  } = api.changelog.getAll.useQuery({
    projectId,
    sprintId,
    limit,
    offset,
    isPublished:
      publishedFilter === "published"
        ? true
        : publishedFilter === "draft"
        ? false
        : undefined,
  });

  const handleDelete = async () => {
    if (selectedChangelog) {
      await deleteUseCase.execute(selectedChangelog);
      setShowDeleteModal(false);
      setSelectedChangelog(null);
    }
  };

  const handlePublish = async (id: number, isPublished: boolean) => {
    await publishUseCase.execute(id, isPublished);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString();
  };

  const getStatusBadge = (
    isPublished: boolean,
    sharedAt: string | Date | null
  ) => {
    if (isPublished && sharedAt) {
      return { color: "green", label: "Published & Shared" };
    } else if (isPublished) {
      return { color: "blue", label: "Published" };
    } else {
      return { color: "gray", label: "Draft" };
    }
  };

  const handleEmailChangelog = (changelog: ChangelogWithRelations) => {
    setEmailChangelog(changelog);
    setShowEmailModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedChangelog(id);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedChangelog(null);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailChangelog(null);
  };

  const handleConfirmEmail = async () => {
    if (emailChangelog) {
      try {
        // First, get all customers for the project
        const projectCustomers = await utils.project.getCustomers.fetch({
          projectId: emailChangelog.sprint.project.id,
        });
        
        if (projectCustomers.length === 0) {
          ShowNotificationUtil({
            title: "No Customers",
            message: "No customers found for this project",
            color: "orange",
          });
          return;
        }
        
        const customerIds = projectCustomers.map((customer: { id: string }) => parseInt(customer.id));
        
        await emailUseCase.execute({
          sprintId: emailChangelog.sprintId,
          content: emailChangelog.content,
          customerIds: customerIds,
          projectName: emailChangelog.sprint.project.name || "Unknown Project",
          sprintName: `Sprint ${emailChangelog.sprint.reference || "Unknown"}`,
        });
        handleCloseEmailModal();
      } catch (error) {
        console.error('Failed to email changelog:', error);
        ShowNotificationUtil({
          title: "Error",
          message: "Failed to get customers or send email",
          color: "red",
        });
      }
    }
  };

  const handlePreviewPdf = async (changelog: ChangelogWithRelations) => {
    await previewPdfUseCase.execute({
      sprintId: changelog.sprintId,
      content: changelog.content,
      projectName: changelog.sprint.project.name || "Unknown Project",
      sprintName: `Sprint ${changelog.sprint.reference || "Unknown"}`,
    });
  };

  const totalPages = changelogsData
    ? Math.ceil(changelogsData.total / limit)
    : 0;

  return {
    // Data
    changelogsData,
    isLoading,
    totalPages,

    // Filters and pagination
    page,
    setPage,
    search,
    setSearch,
    publishedFilter,
    setPublishedFilter,

    // Delete modal state
    showDeleteModal,
    selectedChangelog,
    
    // Email modal state
    showEmailModal,
    emailChangelog,

    // Actions
    refetch,
    handleDelete,
    handlePublish,
    handleDeleteClick,
    handleCloseDeleteModal,
    handleCloseEmailModal,
    handleConfirmEmail,
    handlePreviewPdf,
    handleEmailChangelog,

    // Utilities
    formatDate,
    getStatusBadge,

    // Loading states
    isDeleting: deleteUseCase.isMutating,
    isPublishing: publishUseCase.isMutating,
    isPreviewingPdf: previewPdfUseCase.isMutating,
    isEmailingChangelog: emailUseCase.isMutating,
  };
}
