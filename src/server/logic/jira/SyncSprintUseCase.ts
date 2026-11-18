import { RecordNotFoundError } from "~/server/errors/RecordNotFoundError";
import { UseCase } from "~/server/logic/useCase";
import {
  type JiraIssue,
  extractUniqueJiraUsers,
  mapJiraIssueToTask,
} from "~/shared/logic/jira/JiraToTaskMapperUtil";
import { CreateMemberUseCase } from "~/server/logic/member/CreateMemberUseCase";
import { AssignSprintMemberUseCase } from "~/server/logic/sprint/AssignSprintMemberUseCase";
import { CreateSprintTaskFromJiraUseCase } from "~/server/logic/jira/CreateSprintTaskFromJiraUseCase";
import { UpdateSprintTaskFromJiraUseCase } from "~/server/logic/jira/UpdateSprintTaskFromJiraUseCase";
import { UserMappingUseCase } from "~/server/logic/jira/UserMappingUseCase";

interface SyncSprintInput {
  sprintId: number;
  jiraIssues: JiraIssue[];
  overrideExisting: boolean;
}

interface SyncSprintOutput {
  success: boolean;
  tasksCreated: number;
  tasksUpdated: number;
  tasksSkipped: number;
  usersMapped: number;
  unmappedUsers: number;
  syncedAt: Date;
}

export class SyncSprintUseCase extends UseCase {
  async execute(input: SyncSprintInput): Promise<SyncSprintOutput> {
    const { sprintId, jiraIssues, overrideExisting } = input;

    // Verify sprint exists
    const sprint = await this.db.sprint.findUnique({
      where: { id: sprintId },
      include: {
        sprintMembers: {
          where: { deletedRecordId: null },
          include: { member: true },
        },
        sprintTasks: {
          where: { deletedRecordId: null },
          include: { task: true },
        },
      },
    });

    if (!sprint) {
      throw new RecordNotFoundError("Sprint not found");
    }

    // Extract unique Jira users from issues using the utility
    const jiraUsers = extractUniqueJiraUsers(jiraIssues);

    // Map Jira users to existing members using UserMappingUseCase
    const userMappingUseCase = new UserMappingUseCase(this.db);
    const userMapping = await userMappingUseCase.execute({
      jiraUsers,
      sprintId,
    });

    // Create mapping from Jira accountId to SprintMember (initialize first)
    const jiraAccountToMemberMap = new Map<
      string,
      { id: number; name: string }
    >();
    userMapping.mappings.forEach((mapping) => {
      if (mapping.member && mapping.jiraUser.accountId) {
        jiraAccountToMemberMap.set(mapping.jiraUser.accountId, mapping.member);
      }
    });

    // Create missing members for unmapped Jira users
    const createMemberUseCase = new CreateMemberUseCase(this.db);
    const assignSprintMemberUseCase = new AssignSprintMemberUseCase(this.db);

    // Create members for unmapped Jira users
    for (const unmappedUser of userMapping.unmappedJiraUsers) {
      // Create the member
      const newMember = await createMemberUseCase.execute({
        name: unmappedUser.displayName,
      });

      // Assign the member to the sprint
      await assignSprintMemberUseCase.execute({
        sprintId,
        memberId: newMember.id,
      });

      // Add to our mapping for task assignment
      if (unmappedUser.accountId) {
        jiraAccountToMemberMap.set(unmappedUser.accountId, {
          id: newMember.id,
          name: newMember.name,
        });
      }
    }

    // Process issues and sync tasks
    let tasksCreated = 0;
    let tasksUpdated = 0;
    let tasksSkipped = 0;

    // Initialize the update and create use cases
    const updateSprintTaskUseCase = new UpdateSprintTaskFromJiraUseCase(
      this.db
    );
    const createSprintTaskUseCase = new CreateSprintTaskFromJiraUseCase(
      this.db
    );

    for (const issue of jiraIssues) {
      const existingTask = sprint.sprintTasks.find(
        (st) => st.task.jiraIssueKey === issue.key
      );

      if (existingTask && !overrideExisting) {
        tasksSkipped++;
        continue;
      }

      const taskData = mapJiraIssueToTask(issue);
      const assignedMember = issue.fields.assignee
        ? jiraAccountToMemberMap.get(issue.fields.assignee.accountId) || null
        : null;

      if (existingTask) {
        // Update existing task using the dedicated use case
        await updateSprintTaskUseCase.execute({
          existingTask,
          taskData,
          assignedMember,
        });
        tasksUpdated++;
      } else {
        // Create new task using the dedicated use case
        await createSprintTaskUseCase.execute({
          sprintId,
          taskData,
          assignedMember,
        });
        tasksCreated++;
      }
    }

    const syncedAt = new Date();
    return {
      success: true,
      tasksCreated,
      tasksUpdated,
      tasksSkipped,
      usersMapped: userMapping.totalMappedUsers,
      unmappedUsers: userMapping.unmappedJiraUsers.length,
      syncedAt,
    };
  }
}

export type SyncSprintUseCaseType = SyncSprintUseCase;
export type SyncSprintUseCaseInput = SyncSprintInput;
export type SyncSprintUseCaseOutput = SyncSprintOutput;
