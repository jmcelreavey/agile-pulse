import { State } from "~/shared/types/State";

type ProjectState = {
  state: State;
  completedAt: Date | undefined;
  startedAt: Date | undefined;
};

/**
 * Using the current state and the previous state,
 * this function returns a partial project object with the new state,
 * the startedAt and completedAt fields updated.
 *
 * @param state
 * @param previousState
 */
export const GetProjectStateUtil = (
  state: State | string = State.NOT_STARTED,
  previousState: State | string = State.NOT_STARTED,
  startedAt: Date | undefined = undefined,
  completedAt: Date | undefined = undefined
) => {
  const partialProject: ProjectState = {
    state: state as State,
    completedAt: undefined,
    startedAt: undefined,
  };

  if (
    partialProject.state === State.IN_PROGRESS &&
    ![State.COMPLETED, State.IN_PROGRESS].includes(previousState as State)
  ) {
    partialProject.startedAt = startedAt ?? new Date();
  }

  if (
    partialProject.state === State.COMPLETED &&
    (previousState as State) !== State.COMPLETED
  ) {
    partialProject.completedAt = completedAt ?? new Date();
  }

  return partialProject;
};
