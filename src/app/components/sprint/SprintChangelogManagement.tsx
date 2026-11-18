"use client";

import {
    Button,
    Collapse,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconChevronDown, IconChevronUp, IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { ChangelogManagement } from "~/app/components/changelog/ChangelogManagement";
import { useChangelogGenerator } from "~/hooks/useChangelogGenerator";
import { ChangelogTone } from "~/shared/types/changelog";
import { api } from "~/trpc/react";
import { ChangelogModal } from "~/app/components/sprint/ChangelogModal";
import { TaskSelectionModal } from "~/app/components/sprint/TaskSelectionModal";

interface SprintChangelogManagementProps {
  sprintId: number;
  projectId: number;
  sprintName: string;
  projectName: string;
  disabled?: boolean;
  disabledReason?: string;
}

// Type for the changelog data
interface ChangelogData {
  id: number;
  content: string;
  tone: string;
  createdAt: Date;
  isPublished: boolean;
  taskIds: string | null;
  sprintId: number;
}

export const SprintChangelogManagement = ({
  sprintId,
  projectId,
  sprintName,
  projectName,
  disabled = false,
  disabledReason,
}: SprintChangelogManagementProps) => {
  const [opened, { toggle }] = useDisclosure(false); // Collapsed by default
  const [isTaskSelectionOpen, setIsTaskSelectionOpen] = useState(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [isProcessingChangelog, setIsProcessingChangelog] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [editingChangelog, setEditingChangelog] = useState<ChangelogData | null>(null);
  const [viewingChangelogId, setViewingChangelogId] = useState<number | null>(null);

  // Add changelog generator hook
  const { generateChangelog } = useChangelogGenerator();

  // Query for fetching individual changelog for editing
  const { data: changelogForEdit, isLoading: isLoadingChangelog } = api.changelog.getOne.useQuery(
    { id: viewingChangelogId! },
    { enabled: !!viewingChangelogId }
  );

  const handleNewChangelog = () => {
    setIsTaskSelectionOpen(true);
  };

  const handleTaskSelectionComplete = async (taskIds: number[]) => {
    setSelectedTaskIds(taskIds);
    setIsProcessingChangelog(true);
    setIsTaskSelectionOpen(false);
    
    try {
      // Generate changelog content first
      const result = await generateChangelog({
        sprintId,
        taskIds,
        tone: ChangelogTone.FORMAL,
      });
      
      // Store the generated content
      setGeneratedContent(result.content);
      
      // Now open the modal with pre-generated content
      setIsChangelogModalOpen(true);
      setIsProcessingChangelog(false);
    } catch (error) {
      console.error("Failed to generate changelog:", error);
      setIsProcessingChangelog(false);
      notifications.show({
        title: "Error",
        message: "Failed to generate changelog content",
        color: "red",
      });
    }
  };

  const handleChangelogSaved = () => {
    setIsChangelogModalOpen(false);
    setSelectedTaskIds([]);
    setGeneratedContent(""); // Clear generated content
    setIsProcessingChangelog(false); // End processing
    setEditingChangelog(null);
    setViewingChangelogId(null);
  };

  const handleGenerationComplete = () => {
    setIsProcessingChangelog(false);
  };

  const handleViewDetails = (changelogId: number) => {
    setViewingChangelogId(changelogId);
    setEditingChangelog(null); // Will be set when query completes
    setSelectedTaskIds([]); // Reset task IDs, will be set when query completes
    setIsChangelogModalOpen(true);
  };

  const handleEdit = (changelogId: number) => {
    setViewingChangelogId(changelogId);
    setEditingChangelog(null); // Will be set when query completes
    setSelectedTaskIds([]); // Reset task IDs, will be set when query completes
    setIsChangelogModalOpen(true);
  };

  // Update editing changelog when query completes
  useEffect(() => {
    if (changelogForEdit && viewingChangelogId) {
      setEditingChangelog({
        id: changelogForEdit.id,
        content: changelogForEdit.content,
        tone: changelogForEdit.tone,
        createdAt: changelogForEdit.createdAt,
        isPublished: changelogForEdit.isPublished,
        taskIds: changelogForEdit.taskIds,
        sprintId: changelogForEdit.sprintId,
      });
      
      // Parse taskIds from the changelog if they exist
      if (changelogForEdit.taskIds) {
        try {
          const taskIds = typeof changelogForEdit.taskIds === 'string' 
            ? JSON.parse(changelogForEdit.taskIds) as unknown
            : changelogForEdit.taskIds;
          setSelectedTaskIds(Array.isArray(taskIds) ? taskIds as number[] : []);
        } catch (error) {
          console.error('Failed to parse task IDs:', error);
          setSelectedTaskIds([]);
        }
      } else {
        setSelectedTaskIds([]);
      }
    }
  }, [changelogForEdit, viewingChangelogId]);

  return (
    <Paper withBorder mt="xl" p={0}>
      <Group
        p="md"
        justify="space-between"
        style={{ cursor: "pointer" }}
        onClick={toggle}
      >
        <Group gap="sm">
          <Title order={3}>Sprint Changelogs</Title>
          {opened ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering collapse toggle
            handleNewChangelog();
          }}
          disabled={disabled}
          size="sm"
        >
          Create New Changelog
        </Button>
      </Group>

      <Collapse expanded={opened}>
        <Divider />
        <Stack gap="lg" p="md">
          {disabled && disabledReason && (
            <Text size="sm" c="dimmed">
              {disabledReason}
            </Text>
          )}

          {/* Integrate the main ChangelogManagement component, filtered for this sprint */}
          <ChangelogManagement
            projectId={projectId}
            sprintId={sprintId}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
          />
        </Stack>
      </Collapse>

      {/* Task Selection Modal */}
      <TaskSelectionModal
        sprintId={sprintId}
        projectId={projectId}
        opened={isTaskSelectionOpen}
        onClose={() => setIsTaskSelectionOpen(false)}
        onSelectionComplete={handleTaskSelectionComplete}
        isProcessing={isProcessingChangelog}
      />

      {/* Changelog Creation/Edit Modal */}
      <ChangelogModal
        opened={isChangelogModalOpen}
        onClose={() => {
          setIsChangelogModalOpen(false);
          setEditingChangelog(null);
          setViewingChangelogId(null);
          setSelectedTaskIds([]);
          setGeneratedContent("");
        }}
        sprintId={sprintId}
        projectId={projectId}
        selectedTaskIds={selectedTaskIds}
        sprintName={sprintName}
        projectName={projectName}
        onGenerated={handleChangelogSaved}
        editingChangelog={editingChangelog}
        preGeneratedContent={generatedContent}
        onGenerationComplete={handleGenerationComplete}
        isLoadingChangelog={isLoadingChangelog && !!viewingChangelogId}
      />
    </Paper>
  );
};
