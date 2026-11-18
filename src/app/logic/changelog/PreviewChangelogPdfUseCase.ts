import { printHtmlDocument } from "~/app/logic/common/PrintHtmlUtil";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

interface PreviewChangelogPdfParams {
  sprintId: number;
  content: string;
  projectName: string;
  sprintName: string;
}

export class PreviewChangelogPdfUseCase extends UseCase {
  public mutation = api.changelog.previewPdf.useMutation();

  public async execute(params: PreviewChangelogPdfParams) {
    try {
      this.setIsMutating(true);
      const data = await this.mutation.mutateAsync(params);

      // Trigger download if content is provided
      if (data.html && data.fileName) {
        printHtmlDocument(data.html, data.fileName);
      }

      ShowNotificationUtil({
        title: "Success",
        message: "Preview opened in the print dialog",
      });

      // Note: No query invalidation since this is just a preview
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Error",
        message: errorMessage || "Failed to generate preview",
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
