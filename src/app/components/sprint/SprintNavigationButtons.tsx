import NavigationButtons from "~/app/components/base/button/NavigationButtons";
import { NavigateSprintUseCase } from "~/app/logic/sprint/NavigateSprintUseCase";

export const SprintNavigationButtons = ({
  projectId,
  previousSprintId,
  nextSprintId,
}: {
  projectId: number;
  previousSprintId?: number;
  nextSprintId?: number;
}) => {
  const navigateSprint = new NavigateSprintUseCase();

  return (
    <NavigationButtons
      onBackClick={
        previousSprintId
          ? async () =>
              await navigateSprint.execute({
                toSprintId: previousSprintId,
                projectId,
              })
          : undefined
      }
      onForwardClick={
        nextSprintId
          ? async () =>
              await navigateSprint.execute({
                toSprintId: nextSprintId,
                projectId,
              })
          : undefined
      }
    />
  );
};
