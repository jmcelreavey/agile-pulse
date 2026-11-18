import { type Logger } from "~/seeding/factories/factory";
import { projectFactory } from "~/seeding/factories/project.factory";
import { sprintFactory } from "~/seeding/factories/sprint.factory";
import { createScenario } from "~/seeding/runtime/scenario.factory";
import {
  createMembers,
  createProjects,
  createSprints,
  createTasksAndAssignToMember,
  progressSprint,
} from "~/seeding/scenarios/project.functions";
import { State } from "~/shared/types/State";

/**
 * Demo data volume. Kept small so loading and the daily reset stay well inside Cloudflare D1's
 * free allowance of 100,000 rows written per day (every progressed day stores a snapshot).
 */
const DEMO_SIZE = { members: 4, tasksPerMember: 3, completedProjectSprints: 2 } as const;

export const inProgressProject = createScenario(
  "Create a project that is currently underway, with sprints, members and tasks",
  async ({ logger }) => {
    const [members, [project]] = await Promise.all([
      createMembers(DEMO_SIZE.members, logger),
      createProjects(1, logger, {
        name: "Scooby",
        description: "A project to catch ghosts",
        colour: "brown",
        state: State.IN_PROGRESS,
      }),
    ]);

    if (!project) {
      throw new Error("Project not created.");
    }

    await Promise.all([
      projectFactory.startProject({ id: project.id }),
      projectFactory.updateNotes({
        id: project.id,
        notes: "This project is currently underway.",
      }),
    ]);

    // Complete sprints
    // --------------------------------------------
    const completeSprints = await createSprints(
      project,
      2,
      {
        state: State.NOT_STARTED,
        days: 10,
        daysRemaining: 10,
      },
      logger
    );

    await Promise.all(
      completeSprints.map(async (sprint) => {
        for (const member of members) {
          await createTasksAndAssignToMember(
            sprint,
            member,
            DEMO_SIZE.tasksPerMember,
            {
              state: State.COMPLETED,
            },
            logger
          );
        }

        await sprintFactory.startSprint({ id: sprint.id });

        await sprintFactory.manageDeadlines({
          sprintId: sprint.id,
          day: 8,
          name: "Quality Days",
          description: "Quality days for the remainder of the sprint",
        });

        await progressSprint(sprint, undefined, logger);

        await Promise.all([
          sprintFactory.updateNotes({
            id: sprint.id,
            notes: "This sprint is now complete and ready for review.",
          }),
          sprintFactory.completeSprint({ id: sprint.id }),
        ]);
      })
    );

    const completeSprintCount = completeSprints.length;
    const memberCount = members.length;

    logger(
      `Complete sprints created for ${completeSprintCount} sprints and ${memberCount} members with ${DEMO_SIZE.tasksPerMember} tasks each.`
    );
    // --------------------------------------------

    // In progress sprints
    // --------------------------------------------
    const inProgressSprints = await createSprints(
      project,
      2,
      {
        state: State.NOT_STARTED,
        days: 10,
        daysRemaining: 10,
      },
      logger
    );

    await Promise.all(
      inProgressSprints.map(async (sprint) => {
        for (const member of members) {
          await createTasksAndAssignToMember(sprint, member, DEMO_SIZE.tasksPerMember, {}, logger);
        }

        await sprintFactory.startSprint({ id: sprint.id });

        await sprintFactory.manageDeadlines({
          sprintId: sprint.id,
          day: 8,
          name: "Quality Days",
          description: "Quality days for the remainder of the sprint",
        });

        await progressSprint(sprint, 5, logger);

        await sprintFactory.updateNotes({
          id: sprint.id,
          notes: "This sprint is in progress.",
        });
      })
    );

    const inProgressSprintCount = inProgressSprints.length;
    logger(
      `${inProgressSprintCount} Sprints progressed - now 4 days remaining.`
    );
    logger(
      `In progress sprints created for ${inProgressSprintCount} sprints and ${memberCount} members with ${DEMO_SIZE.tasksPerMember} tasks each.`
    );

    // --------------------------------------------

    // Not started sprint
    // --------------------------------------------
    const sprints = await createSprints(
      project,
      2,
      {
        state: State.NOT_STARTED,
        days: 10,
        daysRemaining: 10,
      },
      logger
    );

    await Promise.all(
      sprints.map(async (sprint) => {
        for (const member of members) {
          await createTasksAndAssignToMember(
            sprint,
            member,
            DEMO_SIZE.tasksPerMember,
            {
              state: State.NOT_STARTED,
            },
            logger
          );
        }
      })
    );

    const lastSprint = sprints[sprints.length - 1];
    if (lastSprint) {
      await sprintFactory.delete({
        id: lastSprint.id,
        reason: "Created by mistake.",
      });

      logger(`Deleted the sprint ${lastSprint.reference}.`);
    }

    const notStartedSprintCount = sprints.length;
    logger(
      `Not started sprints created for ${notStartedSprintCount} sprints and ${memberCount} members with ${DEMO_SIZE.tasksPerMember} tasks each.`
    );

    // --------------------------------------------
  }
);

const completeProjectFunction = async ({ logger }: { logger: Logger }) => {
  const [members, [project]] = await Promise.all([
    createMembers(DEMO_SIZE.members, logger),
    createProjects(1, logger, {
      name: "Babar",
      description: "A project to watch elephants",
      colour: "green",
      state: State.NOT_STARTED,
    }),
  ]);

  if (!project) {
    throw new Error("Project not created.");
  }

  await projectFactory.startProject({ id: project.id });
  logger(`Project ${project.name} started.`);

  // Complete sprints
  // --------------------------------------------
  const completeSprints = await createSprints(
    project,
    DEMO_SIZE.completedProjectSprints,
    {
      state: State.NOT_STARTED,
      days: 10,
      daysRemaining: 10,
    },
    logger
  );

  await Promise.all(
    completeSprints.map(async (sprint, index) => {
      for (const member of members) {
        await createTasksAndAssignToMember(
          sprint,
          member,
          DEMO_SIZE.tasksPerMember,
          {
            state: State.COMPLETED,
          },
          logger
        );
      }

      await sprintFactory.startSprint({ id: sprint.id });

      await sprintFactory.manageDeadlines({
        sprintId: sprint.id,
        day: 8,
        name: "Quality Days",
        description: "Quality days for the remainder of the sprint",
      });

      await progressSprint(sprint, undefined, logger);

      await Promise.all([
        sprintFactory.updateNotes({
          id: sprint.id,
          notes: "This sprint is now complete and ready for review.",
        }),
        sprintFactory.completeSprint({ id: sprint.id }),
      ]);

      if (index === 0) {
        const updatedSprint = await sprintFactory.updateSprint({
          id: sprint.id,
          days: 20,
        });
        logger(`Updated sprint ${updatedSprint.reference} to have 20 days.`);
      }
    })
  );

  const completeSprintCount = completeSprints.length;

  logger(`${completeSprintCount} Sprints completed.`);

  const [isComplete] = await Promise.all([
    projectFactory.completeProject({ id: project.id }),
    projectFactory.updateNotes({
      id: project.id,
      notes: "This project is now complete.",
    }),
  ]);

  logger(
    `Project ${project.name} ${isComplete ? "completed" : "not completed"}.`
  );

  const memberCount = members.length;

  logger(
    `Complete sprints created for ${completeSprintCount} sprints and ${memberCount} members with ${DEMO_SIZE.tasksPerMember} tasks each.`
  );

  return project;
};

export const completeProject = createScenario(
  "Create a project that is completed, with sprints, members and tasks",
  completeProjectFunction
);

export const deleteProject = createScenario(
  "Create a project that is completed, with sprints, members and tasks, then delete it",
  async ({ logger }) => {
    const project = await completeProjectFunction({ logger });

    await projectFactory.delete({
      id: project.id,
      reason: "Dupe of existing project.",
    });

    logger(`Deleted the dupe project ${project.name}.`);
  }
);
