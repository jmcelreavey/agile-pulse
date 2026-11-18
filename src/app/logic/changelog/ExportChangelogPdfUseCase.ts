import { printHtmlDocument } from "~/app/logic/common/PrintHtmlUtil";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

interface ExportPdfParams {
  sprintId: number;
  content: string;
  projectName: string;
  sprintName: string;
}

export class ExportChangelogPdfUseCase extends UseCase {
  public mutation = api.changelog.exportPdf.useMutation();

  public async execute(params: ExportPdfParams) {
    try {
      this.setIsMutating(true);
      const data = await this.mutation.mutateAsync(params);

      // Trigger download if content is provided
      if (data.html && data.fileName) {
        printHtmlDocument(data.html, data.fileName);
      }

      ShowNotificationUtil({
        title: "PDF ready",
        message: "Choose \"Save as PDF\" in the print dialog to download it",
      });

      // Invalidate changelog queries
      await this.useUtils.changelog.getAll.invalidate();
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Error",
        message: errorMessage || "Failed to export PDF",
        isError: true,
      });
    } finally {
      this.setIsMutating(false);
    }
  }
}
