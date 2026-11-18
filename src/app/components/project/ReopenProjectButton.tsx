import { Button } from "@mantine/core";
import { ReopenProjectUseCase } from "~/app/logic/project/ReopenProjectUseCase";
import { type GetOneProjectUseCaseType } from "~/server/logic/project/GetOneProjectUseCase";

export const ReopenProjectButton = ({
  project,
  onReopen,
}: {
  project: GetOneProjectUseCaseType;
  onReopen: () => void;
}) => {
  const reopenProject = new ReopenProjectUseCase();

  const handleReopen = async () => {
    await reopenProject.execute({
      projectId: project.id,
      reference: project.name,
    });
    onReopen();
  };

  return (
    <Button
      variant="light"
      onClick={handleReopen}
      loading={reopenProject.isMutating}
    >
      Reopen Project
    </Button>
  );
};
