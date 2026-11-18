"use client";

import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { ChangelogTone } from "~/shared/types/changelog";
import { ChangelogRichTextEditor } from "~/app/components/sprint/ChangelogRichTextEditor";

interface ChangelogEditorProps {
  sprintId: number;
  initialContent?: string;
  selectedTaskIds: number[];
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
}

export function ChangelogEditor({
  sprintId,
  initialContent = "",
  selectedTaskIds,
  onContentChange,
  onSave,
}: ChangelogEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Auto-save draft functionality (now handled by useChangelogDraft hook in parent)
  useEffect(() => {
    // Simple debounced save - the actual draft saving is handled by the parent component
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      // No-op - draft saving handled by parent
    }, 1000);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [content, sprintId, selectedTaskIds, autoSaveTimeout]);

  // Load draft on mount
  useEffect(() => {
    if (!initialContent) {
      const draftKey = `changelog-draft-${sprintId}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft) as {
            content?: string;
            tone?: ChangelogTone;
            taskIds?: number[];
            lastSaved?: string;
          };
          if (typeof parsedDraft.content === "string") {
            setContent(parsedDraft.content);
          }
          if (
            parsedDraft.tone &&
            Object.values(ChangelogTone).includes(parsedDraft.tone)
          ) {
            // Always use FORMAL tone regardless of saved draft
            // setTone(parsedDraft.tone);
          }
        } catch (error) {
          console.error("Failed to load draft:", error);
        }
      }
    }
  }, [sprintId, initialContent]);

  // Remove unused hook

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      onContentChange?.(newContent);
    },
    [onContentChange]
  );

  const handleSave = useCallback(() => {
    onSave?.(content);
  }, [content, onSave]);

  return (
    <Stack gap="md">
      {/* Rich Text Editor */}
      <Paper withBorder>
        <ChangelogRichTextEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Your changelog content will appear here..."
          className="min-h-[300px]"
        />
      </Paper>

      {/* Action Buttons */}
      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          Auto-saved as draft
        </Text>
        <Group gap="xs">
          <Button
            variant="light"
            onClick={() => {
              const draftKey = `changelog-draft-${sprintId}`;
              localStorage.removeItem(draftKey);
              setContent("");
            }}
          >
            Clear
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            Save Changelog
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
