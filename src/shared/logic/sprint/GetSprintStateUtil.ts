import { isState, State } from "~/shared/types/State";

type SprintState = {
  state: State;
  completedAt: Date | undefined;
  startedAt: Date | undefined;
};

/**
 * Using the current state and the previous state,
 * this function returns a partial sprint object with the new state,
 * the startedAt and completedAt fields updated.
 *
 * @param state
 * @param previousState
 */
export const GetSprintStateUtil = (
  state: State | string = State.NOT_STARTED,
  previousState: State | string = State.NOT_STARTED,
  startedAt?: Date,
  completedAt?: Date
): SprintState => {
  if (isState(previousState) === false) {
    throw new Error(`Invalid previous state: ${previousState}`);
  }

  if (isState(state) === false) {
    throw new Error(`Invalid state: ${state}`);
  }

  const partialSprint: SprintState = {
    state: state,
    completedAt: completedAt ?? undefined,
    startedAt: startedAt ?? undefined,
  };

  if (
    partialSprint.state === State.IN_PROGRESS &&
    ![State.COMPLETED, State.IN_PROGRESS].includes(previousState)
  ) {
    partialSprint.startedAt = startedAt ?? new Date();
  }

  if (
    partialSprint.state === State.COMPLETED &&
    previousState !== State.COMPLETED
  ) {
    partialSprint.completedAt = completedAt ?? new Date();
  }

  return partialSprint;
};
