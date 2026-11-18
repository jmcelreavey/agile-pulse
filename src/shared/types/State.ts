import {
  IconAlertTriangle,
  IconBrain,
  IconCheck,
  IconCircleDot,
  IconClipboardCheck,
  IconLeaf,
  IconLock,
  IconPlayerPlay,
  IconTestPipe,
  type IconProps,
} from "@tabler/icons-react";
import { type FC } from "react";

export enum State {
  LEAVE = "Leave",
  DISTRACTION = "Distraction",
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  WITH_QA = "With QA",
  AT_RISK = "At Risk",
  BLOCKED = "Blocked",
  SIGN_OFF_REQUIRED = "Sign-off Required",
  COMPLETED = "Completed",
}

export function isState(value: string): value is State {
  return Object.values(State).includes(value as State);
}

export const getStateColour = (state: State) => {
  switch (state) {
    case State.COMPLETED:
      return "green.8";
    case State.IN_PROGRESS:
      return "blue.7";
    case State.WITH_QA:
      return "violet.7";
    case State.AT_RISK:
      return "orange.7";
    case State.BLOCKED:
      return "red.7";
    case State.SIGN_OFF_REQUIRED:
      return "yellow.7";
    case State.NOT_STARTED:
      return "gray.5";
    case State.LEAVE:
      return "blue.3";
    case State.DISTRACTION:
      return "orange.3";
    default:
      return "gray.5";
  }
};

export const getStateIcon = (state: State): FC<IconProps> => {
  switch (state) {
    case State.LEAVE:
      return IconLeaf;
    case State.DISTRACTION:
      return IconBrain;
    case State.NOT_STARTED:
      return IconCircleDot;
    case State.IN_PROGRESS:
      return IconPlayerPlay;
    case State.WITH_QA:
      return IconTestPipe;
    case State.AT_RISK:
      return IconAlertTriangle;
    case State.BLOCKED:
      return IconLock;
    case State.SIGN_OFF_REQUIRED:
      return IconClipboardCheck;
    case State.COMPLETED:
      return IconCheck;
    default:
      return IconCircleDot;
  }
};
