import { faker } from "@faker-js/faker";
import { type FactoryHelpers } from "~/seeding/factories/factory";
import { memberFactory } from "~/seeding/factories/member.factory";
import {
  type ProjectCreateRecipe,
  projectFactory,
} from "~/seeding/factories/project.factory";
import {
  type AssignSprintTaskRecipe,
  type SprintCreateRecipe,
  sprintFactory,
} from "~/seeding/factories/sprint.factory";
import { type CreateMemberType } from "~/server/logic/member/CreateMemberUseCase";
import { type CreateProjectType } from "~/server/logic/project/CreateProjectUseCase";
import { type CreateSprintUseCaseType } from "~/server/logic/sprint/CreateSprintUseCase";

type Logger = FactoryHelpers["logger"];

export async function createProjects(
  count: number,
  logger?: Logger,
  recipe?: ProjectCreateRecipe
) {
  const projects = await Promise.all(
    Array(count)
      .fill(null)
      .map(() =>
        projectFactory.createProject({
          ...recipe,
        })
      )
  );
  logger?.(`${count} project(s) created.`);
  return projects;
}

export async function createSprints(
  project: CreateProjectType,
  count: number,
  recipe?: SprintCreateRecipe,
  logger?: Logger
) {
  const sprints = await Promise.all(
    Array(count)
      .fill(null)
      .map(() =>
        sprintFactory.createSprint({ projectId: project.id, ...recipe })
      )
  );
  logger?.(`${count} sprint(s) created for ${project.name}.`);
  return sprints;
}

export async function createMembers(count: number, logger?: Logger) {
  const members = await Promise.all(
    Array(count)
      .fill(null)
      .map(() => memberFactory.createMember())
  );
  logger?.(`${count} member(s) created.`);
  return members;
}

export async function createMembersAndAssignToSprint(
  sprint: CreateSprintUseCaseType,
  count: number,
  logger?: Logger
) {
  const members = await Promise.all(
    Array(count)
      .fill(null)
      .map(async () => {
        const member = await memberFactory.createMember();
        await sprintFactory.assignMember({
          sprintId: sprint.id,
          memberId: member.id,
        });
        return member;
      })
  );
  logger?.(
    `${count} member(s) created and assigned to sprint ${sprint.reference}.`
  );
  return members;
}

export async function createTasksAndAssignToMember(
  sprint: CreateSprintUseCaseType,
  member: CreateMemberType,
  count: number,
  taskRecipe?: AssignSprintTaskRecipe,
  logger?: Logger
) {
  logger?.(
    `Creating and assigning ${count} task(s) to ${member.name} in sprint ${sprint.reference}...`
  );

  let totalDays = sprint.days;
  const taskDays: number[] = [];

  for (let i = 0; i < count - 1; i++) {
    const days = faker.number.int({
      min: 1,
      max: totalDays - (count - i - 1),
    });
    taskDays.push(days);
    totalDays -= days;
  }
  // Add the remaining days to the last task
  taskDays.push(totalDays);

  const tasks = [];
  for (const days of taskDays) {
    tasks.push(
      await sprintFactory.assignTask({
        sprintId: sprint.id,
        memberId: member.id,
        ...taskRecipe,
        days,
      })
    );
  }

  logger?.(
    `${count} task(s) created and assigned to ${member.name} in sprint ${sprint.reference}.`
  );
  return tasks;
}

export async function progressSprint(
  sprint: CreateSprintUseCaseType,
  days?: number,
  logger?: Logger
) {
  days = days ?? sprint.daysRemaining ?? 0;

  for (let i = 0; i < days; i++) {
    await sprintFactory.progressSprint({
      id: sprint.id,
    });
  }

  logger?.(`Sprint ${sprint.reference} progressed by ${days} day(s).`);
}
