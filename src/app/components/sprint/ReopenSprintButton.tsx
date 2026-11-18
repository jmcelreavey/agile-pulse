import { Button } from "@mantine/core";
import { ReopenSprintUseCase } from "~/app/logic/sprint/ReopenSprintUseCase";
import { type GetOneSprintUseCaseType } from "~/server/logic/sprint/GetOneSprintUseCase";

export const ReopenSprintButton = ({
  sprint,
  onReopen,
}: {
  sprint: GetOneSprintUseCaseType;
  onReopen: () => void;
}) => {
  const reopenSprint = new ReopenSprintUseCase();

  const handleReopen = async () => {
    await reopenSprint.execute({
      sprintId: sprint.id,
      reference: sprint.reference,
    });
    onReopen();
  };

  return (
    <Button
      variant="light"
      onClick={handleReopen}
      loading={reopenSprint.isMutating}
      size="md"
    >
      Reopen Sprint
    </Button>
  );
};
