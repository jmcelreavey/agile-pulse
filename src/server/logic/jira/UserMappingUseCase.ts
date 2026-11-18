import { UseCase } from "~/server/logic/useCase";

interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
}

interface UserMapping {
  jiraUser: JiraUser;
  member: {
    id: number;
    name: string;
  } | null;
  user: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
}

export interface UserMappingInput {
  jiraUsers: JiraUser[];
  sprintId: number;
  domain?: string;
}

export interface UserMappingOutput {
  mappings: UserMapping[];
  unmappedJiraUsers: JiraUser[];
  totalJiraUsers: number;
  totalMappedUsers: number;
}

export class UserMappingUseCase extends UseCase {
  async execute(input: UserMappingInput): Promise<UserMappingOutput> {
    const { jiraUsers, sprintId, domain } = input;

    // Get the sprint to find project members
    const sprint = await this.db.sprint.findUnique({
      where: { id: sprintId },
      include: {
        sprintMembers: {
          where: { deletedRecordId: null },
          include: { member: true },
        },
        project: true,
      },
    });

    if (!sprint) {
      throw new Error("Sprint not found");
    }

    // Extract email addresses from Jira users
    const jiraEmails = jiraUsers.map((user) => user.emailAddress.toLowerCase());

    // Find all users in the database with matching email addresses
    const matchedUsers = await this.db.user.findMany({
      where: {
        email: {
          in: jiraEmails,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Create email to user mapping for quick lookup
    const emailToUserMap = new Map(
      matchedUsers.map((user) => [user.email?.toLowerCase(), user])
    );

    // Get all existing members in the domain instead of just sprint members
    let existingMembers;
    if (domain) {
      // Find all members across projects in the same domain
      existingMembers = await this.db.member.findMany({
        where: {
          deletedRecordId: null,
          sprints: {
            some: {
              sprint: {
                project: {
                  domain: domain,
                },
              },
              deletedRecordId: null,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
      });
    } else {
      // Fallback to existing behavior (sprint members only) if no domain provided
      existingMembers = sprint.sprintMembers.map((sm) => sm.member);
    }

    const memberNameMap = new Map(
      existingMembers.map((member) => [member.name.toLowerCase(), member])
    );

    // Create mappings between Jira users and existing members
    const mappings: UserMapping[] = [];
    const unmappedJiraUsers: JiraUser[] = [];

    for (const jiraUser of jiraUsers) {
      const email = jiraUser.emailAddress.toLowerCase();
      const matchedUser = emailToUserMap.get(email);

      // Try to find a matching member by user's name or displayName
      let matchedMember = null;
      if (matchedUser?.name) {
        matchedMember = memberNameMap.get(matchedUser.name.toLowerCase());
      }

      // If no member found by user name, try matching by Jira displayName
      if (!matchedMember) {
        matchedMember = memberNameMap.get(jiraUser.displayName.toLowerCase());
      }

      const mapping: UserMapping = {
        jiraUser,
        member: matchedMember || null,
        user: matchedUser || null,
      };

      mappings.push(mapping);

      if (!matchedMember && !matchedUser) {
        unmappedJiraUsers.push(jiraUser);
      }
    }

    return {
      mappings,
      unmappedJiraUsers,
      totalJiraUsers: jiraUsers.length,
      totalMappedUsers: mappings.filter((m) => m.member || m.user).length,
    };
  }
}

export type UserMappingUseCaseType = UserMappingUseCase;
export type UserMappingUseCaseInput = UserMappingInput;
export type UserMappingUseCaseOutput = UserMappingOutput;
