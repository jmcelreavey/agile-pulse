import dayjs from "dayjs";
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

export const tenYearsGrowthScenario = createScenario(
  "Simulate 10 years of data growth",
  async ({ logger, faker }) => {
    const endDate = dayjs(); // Current date
    const startDate = endDate.subtract(10, "year");
    const projectsPerYear = 10;
    const sprintsPerProject = 12; // Assuming monthly sprints
    const membersPerProject = faker.number.int({ min: 5, max: 10 });
    const tasksPerSprint = faker.number.int({ min: 10, max: 15 });

    logger("Starting 10 years growth simulation...");

    for (let year = 0; year < 10; year++) {
      const yearStart = startDate.add(year, "year");
      const isCurrentYear = year === 9; // Check if it's the current (last) year

      logger(`Simulating year ${year + 1}...`);

      const projects = await createProjects(projectsPerYear, logger, {
        state: State.NOT_STARTED,
      });

      for (const project of projects) {
        // Group startProject, createMembers, and createSprints
        const [, members, sprints] = await Promise.all([
          projectFactory.startProject({
            id: project.id,
            startedAt: yearStart.toDate(),
          }),
          createMembers(membersPerProject, logger),
          createSprints(
            project,
            sprintsPerProject,
            {
              state: State.NOT_STARTED,
              days: 15,
              daysRemaining: 15,
            },
            logger
          ),
        ]);

        for (const sprint of sprints) {
          for (const member of members) {
            await createTasksAndAssignToMember(
              sprint,
              member,
              tasksPerSprint,
              {
                state: isCurrentYear
                  ? faker.helpers.arrayElement([
                      State.NOT_STARTED,
                      State.IN_PROGRESS,
                      State.COMPLETED,
                    ])
                  : State.COMPLETED,
              },
              logger
            );
          }

          await sprintFactory.startSprint({
            id: sprint.id,
            startedAt: yearStart.toDate(),
          });

          await sprintFactory.manageDeadlines({
            sprintId: sprint.id,
            day: 10,
            name: "Quality Days",
            description: "Quality days for the remainder of the sprint",
          });

          await progressSprint(sprint, isCurrentYear ? 5 : undefined, logger);

          if (!isCurrentYear) {
            await sprintFactory.completeSprint({
              id: sprint.id,
              completedAt: yearStart.add(15, "day").toDate(),
            });
          }
        }

        if (!isCurrentYear) {
          await projectFactory.completeProject({
            id: project.id,
            completedAt: yearStart.add(15, "day").toDate(),
          });
        }
      }
    }

    const totalProjects = 10 * projectsPerYear;
    const totalSprints = totalProjects * sprintsPerProject;
    const estimatedTotalTasks =
      totalSprints * tasksPerSprint * membersPerProject;

    logger(`Simulation complete!`);
    logger(`Total projects created: ${totalProjects}`);
    logger(`Total sprints created: ${totalSprints}`);
    logger(`Estimated total tasks created: ${estimatedTotalTasks}`);
  }
);
