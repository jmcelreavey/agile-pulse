import { useEffect, useState } from "react";
import { UpdateChangelogUseCase } from "~/app/logic/changelog/UpdateChangelogUseCase";
import { ChangelogTone } from "~/shared/types/changelog";
import { api } from "~/trpc/react";

interface UseChangelogEditProps {
  changelogId: number | null;
  enabled?: boolean;
  onSaved?: () => void;
  onClose?: () => void;
}

export function useChangelogEdit({
  changelogId,
  enabled = true,
  onSaved,
  onClose,
}: UseChangelogEditProps) {
  const [content, setContent] = useState("");
  const [tone, setTone] = useState<ChangelogTone>(ChangelogTone.TECHNICAL);
  const [isPublished, setIsPublished] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: changelog, isLoading } = api.changelog.getOne.useQuery(
    { id: changelogId! },
    { enabled: !!changelogId && enabled }
  );

  const updateUseCase = new UpdateChangelogUseCase();

  // Reset form when changelog data loads
  useEffect(() => {
    if (changelog) {
      setContent(changelog.content);
      setTone(changelog.tone as ChangelogTone);
      setIsPublished(changelog.isPublished);
      setHasChanges(false);
    }
  }, [changelog]);

  // Track changes
  useEffect(() => {
    if (changelog) {
      const contentChanged = content !== changelog.content;
      const toneChanged = tone !== (changelog.tone as ChangelogTone);
      const publishedChanged = isPublished !== changelog.isPublished;
      setHasChanges(contentChanged || toneChanged || publishedChanged);
    }
  }, [content, tone, isPublished, changelog]);

  const handleSave = async () => {
    if (!changelogId) return;

    const updates: {
      content?: string;
      tone?: ChangelogTone;
      isPublished?: boolean;
    } = {};

    if (content !== changelog?.content) {
      updates.content = content;
    }
    if (tone !== (changelog?.tone as ChangelogTone)) {
      updates.tone = tone;
    }
    if (isPublished !== changelog?.isPublished) {
      updates.isPublished = isPublished;
    }

    await updateUseCase.execute(
      {
        id: changelogId,
        ...updates,
      },
      () => {
        setHasChanges(false);
        onSaved?.();
        onClose?.();
      }
    );
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmClose) return;
    }
    onClose?.();
  };

  const toneOptions = [
    { value: ChangelogTone.FORMAL, label: "Formal" },
    { value: ChangelogTone.INFORMAL, label: "Informal" },
    { value: ChangelogTone.TECHNICAL, label: "Technical" },
  ];

  return {
    // Data
    changelog,
    isLoading,

    // Form state
    content,
    setContent,
    tone,
    setTone,
    isPublished,
    setIsPublished,
    hasChanges,

    // Actions
    handleSave,
    handleClose,

    // Options
    toneOptions,

    // Status
    isSaving: updateUseCase.isMutating,
  };
}
