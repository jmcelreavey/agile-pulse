import { useCallback, useEffect, useState } from "react";
import { ChangelogTone } from "~/shared/types/changelog";

interface DraftData {
  content?: string;
  tone?: ChangelogTone;
  taskIds?: number[];
  lastSaved?: string;
}

export const useChangelogDraft = (sprintId: number, changelogId?: number) => {
  const [content, setContent] = useState("");
  const [tone, setTone] = useState<ChangelogTone>(ChangelogTone.FORMAL);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Create unique draft key - different for new vs editing existing
  const draftKey = changelogId 
    ? `changelog-draft-edit-${changelogId}` 
    : `changelog-draft-new-${sprintId}`;

  // Auto-save draft functionality
  const saveDraft = useCallback(
    (
      draftContent: string,
      draftTone: ChangelogTone,
      selectedTaskIds: number[]
    ) => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      const timeout = setTimeout(() => {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            content: draftContent,
            tone: draftTone,
            taskIds: selectedTaskIds,
            lastSaved: new Date().toISOString(),
          })
        );
      }, 1000); // Auto-save after 1 second of inactivity

      setAutoSaveTimeout(timeout);

      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draftKey] // Keep dependencies minimal to avoid re-creation
  );

  // Load draft on mount
  const loadDraft = useCallback(() => {
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft) as DraftData;
        if (typeof parsedDraft.content === "string") {
          setContent(parsedDraft.content);
        }
        if (
          parsedDraft.tone &&
          Object.values(ChangelogTone).includes(parsedDraft.tone)
        ) {
          setTone(parsedDraft.tone);
        }
        return parsedDraft;
      } catch (error) {
        console.error("Failed to load draft:", error);
        return null;
      }
    }
    return null;
  }, [draftKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
  }, [draftKey, autoSaveTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  return {
    content,
    setContent,
    tone,
    setTone,
    saveDraft,
    loadDraft,
    clearDraft,
  };
};
