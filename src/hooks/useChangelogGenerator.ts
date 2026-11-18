import { useState } from "react";
import { GenerateChangelogUseCase } from "~/app/logic/changelog/GenerateChangelogUseCase";
import { SaveChangelogUseCase } from "~/app/logic/changelog/SaveChangelogUseCase";
import { type ChangelogTone } from "~/shared/types/changelog";

export const useChangelogGenerator = () => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const generateUseCase = new GenerateChangelogUseCase();
  const saveUseCase = new SaveChangelogUseCase();

  const generateChangelog = async (params: {
    sprintId: number;
    taskIds: number[];
    tone: ChangelogTone;
  }) => {
    try {
      const result = await generateUseCase.execute(params);
      setHasUnsavedChanges(true);
      return result;
    } catch (error) {
      console.error("Failed to generate changelog:", error);
      throw error;
    }
  };

  const saveChangelog = async (params: {
    sprintId: number;
    taskIds: number[];
    tone: ChangelogTone;
    content: string;
  }) => {
    try {
      const result = await saveUseCase.execute(params);
      setHasUnsavedChanges(false);
      return result;
    } catch (error) {
      console.error("Failed to save changelog:", error);
      throw error;
    }
  };

  const markSaved = () => {
    setHasUnsavedChanges(false);
  };

  return {
    generateChangelog,
    saveChangelog,
    isGenerating: generateUseCase.isMutating,
    isSaving: saveUseCase.isMutating,
    hasUnsavedChanges,
    markSaved,
    generateError: generateUseCase.mutation.error,
    saveError: saveUseCase.mutation.error,
  };
};
