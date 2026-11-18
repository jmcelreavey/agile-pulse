"use client";

import {
  Alert,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useChangelogDraft } from "~/hooks/useChangelogDraft";
import { useChangelogGenerator } from "~/hooks/useChangelogGenerator";
import { ChangelogTone } from "~/shared/types/changelog";
import { api } from "~/trpc/react";
import { ChangelogEditor } from "~/app/components/sprint/ChangelogEditor";

interface ChangelogData {
  id: number;
  content: string;
  tone: string;
  createdAt: Date;
  isPublished?: boolean;
  taskIds: string | null;
}

interface ChangelogModalProps {
  opened: boolean;
  onClose: () => void;
  sprintId: number;
  projectId: number;
  selectedTaskIds: number[];
  sprintName: string;
  projectName: string;
  onGenerated?: (
    content: string,
    tone: ChangelogTone,
    taskIds: number[]
  ) => void;
  editingChangelog?: ChangelogData | null;
  preGeneratedContent?: string; // Add pre-generated content prop
  onGenerationComplete?: () => void; // Add callback for when generation finishes
  isLoadingChangelog?: boolean; // Add loading state for fetching existing changelog
}

export function ChangelogModal({
  opened,
  onClose,
  sprintId,
  projectId: _projectId,
  selectedTaskIds,
  sprintName: _sprintName,
  projectName: _projectName,
  onGenerated,
  editingChangelog,
  preGeneratedContent,
  onGenerationComplete,
  isLoadingChangelog = false,
}: ChangelogModalProps) {
  const [hasTriggeredGeneration, setHasTriggeredGeneration] = useState(false);

  const {
    generateChangelog,
    saveChangelog,
    isGenerating,
    hasUnsavedChanges,
    markSaved,
  } = useChangelogGenerator();
  
  // Add update mutation for editing existing changelogs
  const updateChangelogMutation = api.changelog.update.useMutation();
  
  const updateChangelog = async (params: {
    id: number;
    content: string;
    tone: ChangelogTone;
    taskIds: number[];
  }) => {
    try {
      return await updateChangelogMutation.mutateAsync(params);
    } catch (error) {
      console.error("Failed to update changelog:", error);
      throw error;
    }
  };
  
  const {
    content,
    setContent,
    tone,
    setTone,
    saveDraft,
    clearDraft,
  } = useChangelogDraft(sprintId, editingChangelog?.id);

  const handleGenerate = useCallback(async () => {
    if (selectedTaskIds.length === 0 || isGenerating) return;

    try {
      const result = await generateChangelog({
        sprintId,
        taskIds: selectedTaskIds,
        tone: ChangelogTone.FORMAL,
      });

      setContent(result.content);
      
      // Notify parent that generation is complete
      onGenerationComplete?.();
    } catch (error) {
      console.error("Failed to generate changelog:", error);
      // Also notify on error so UI doesn't stay in loading state
      onGenerationComplete?.();
    }
  }, [selectedTaskIds, sprintId, generateChangelog, setContent, onGenerationComplete, isGenerating]);

  // Load draft on mount or auto-generate
  useEffect(() => {
    if (opened && selectedTaskIds.length > 0) {
      if (editingChangelog) {
        // Pre-populate with existing changelog data
        setContent(editingChangelog.content);
        setTone(editingChangelog.tone as ChangelogTone);
        setHasTriggeredGeneration(true); // Mark as already generated for editing
      } else if (preGeneratedContent) {
        // Use pre-generated content (no need to generate again)
        setContent(preGeneratedContent);
        setTone(ChangelogTone.FORMAL);
        setHasTriggeredGeneration(true);
        onGenerationComplete?.(); // Notify that we're done "generating"
      } else if (!hasTriggeredGeneration) {
        // For new changelogs without pre-generated content, clear and generate fresh
        setContent("");
        setTone(ChangelogTone.FORMAL);
        
        // Clear any existing draft for new changelogs
        clearDraft();
        
        // Mark that we're about to generate to prevent re-triggering
        setHasTriggeredGeneration(true);
        
        // Auto-generate new content with a small delay to prevent UI blocking
        setTimeout(() => {
          void handleGenerate();
        }, 100);
      }
    }
  }, 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [opened, selectedTaskIds.length, editingChangelog?.id, preGeneratedContent, hasTriggeredGeneration, setContent, setTone, clearDraft, onGenerationComplete]);

  // Reset generation flag when modal closes
  useEffect(() => {
    if (!opened) {
      setHasTriggeredGeneration(false);
    }
  }, [opened]);

  // Auto-save draft
  useEffect(() => {
    if (content || tone !== ChangelogTone.FORMAL) {
      saveDraft(content, tone, selectedTaskIds);
    }
  }, [content, tone, selectedTaskIds, saveDraft]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSave = async (contentToSave: string) => {
    if (!contentToSave.trim()) return;

    try {
      if (editingChangelog) {
        // Editing existing changelog - use update API
        await updateChangelog({
          id: editingChangelog.id,
          content: contentToSave,
          tone: ChangelogTone.FORMAL,
          taskIds: selectedTaskIds,
        });
      } else {
        // Creating new changelog - use save API
        await saveChangelog({
          sprintId,
          content: contentToSave,
          tone: ChangelogTone.FORMAL,
          taskIds: selectedTaskIds,
        });
      }

      markSaved();
      clearDraft();
      onGenerated?.(contentToSave, tone, selectedTaskIds);
      onClose();
    } catch (error) {
      console.error("Failed to save changelog:", error);
    }
  };

  const handleRegenerate = () => {
    void handleGenerate();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const shouldClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!shouldClose) return;
    }
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="xl"
      title="Sprint Changelog Generator"
      centered
    >
      <Stack gap="md">
        {/* Loading existing changelog */}
        {isLoadingChangelog && (
          <Stack gap="md" align="center" py="xl">
            <LoadingOverlay visible={true} />
            <Text size="sm" c="dimmed">
              Loading changelog...
            </Text>
          </Stack>
        )}

        {/* Initial Generation */}
        {!content && !isGenerating && !isLoadingChangelog && (
          <Stack gap="md">
            <Text>
              Selected {selectedTaskIds.length} tasks for changelog generation.
            </Text>

            <Group justify="center">
              <Button
                onClick={handleGenerate}
                loading={isGenerating}
                disabled={selectedTaskIds.length === 0}
                size="lg"
              >
                Generate Changelog
              </Button>
            </Group>

            {selectedTaskIds.length === 0 && (
              <Alert icon={<IconAlertCircle size={16} />} color="yellow">
                Please select at least one task to generate a changelog.
              </Alert>
            )}
          </Stack>
        )}

        {/* Edit Only */}
        {content && !isLoadingChangelog && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Edit your changelog content and adjust the tone as needed.
              </Text>
              <Button
                variant="light"
                onClick={handleRegenerate}
                loading={isGenerating}
                size="xs"
              >
                Regenerate
              </Button>
            </Group>

            <ChangelogEditor
              sprintId={sprintId}
              initialContent={content}
              selectedTaskIds={selectedTaskIds}
              onContentChange={handleContentChange}
              onSave={handleSave}
            />
          </Stack>
        )}

        {/* Loading Overlay for generation */}
        <LoadingOverlay visible={isGenerating} />
      </Stack>
    </Modal>
  );
}
