import { env } from "~/env";
import {
  completeProject,
  deleteProject,
  inProgressProject,
} from "~/seeding/scenarios/project.scenarios";
import { tenYearsGrowthScenario } from "~/seeding/scenarios/tenYearGrowth.scenario";
import { createUsers } from "~/seeding/scenarios/user.scenarios";

const baseScenarios = [
  createUsers,
  completeProject,
  inProgressProject,
  deleteProject,
];

const performanceScenarios = [tenYearsGrowthScenario];

const scenarios = [
  ...baseScenarios,
  ...(env.INCLUDE_PERFORMANCE_SCENARIOS ? performanceScenarios : []),
];

export default scenarios;
