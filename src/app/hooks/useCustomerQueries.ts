import { api } from "~/trpc/react";

export const useCustomerValidationQueries = ({ token }: { token: string }) => {
  const [invitation, validationQuery] =
    api.customer.validateInvitation.useSuspenseQuery(
      { token },
      {
        retry: false,
      }
    );

  return {
    invitation,
    isLoading: validationQuery.isRefetching,
  };
};

export const useCustomerInvitationQueries = ({
  projectId,
}: {
  projectId: number;
}) => {
  const [invitations, invitationsQuery] =
    api.customer.getProjectInvitations.useSuspenseQuery(
      { projectId },
      {
        refetchOnWindowFocus: false,
      }
    );

  return {
    invitations,
    isLoading: invitationsQuery.isRefetching,
  };
};

export const useCustomerProjectQueries = () => {
  const [projects, projectsQuery] = api.customer.getProjects.useSuspenseQuery(
    {},
    {
      refetchOnWindowFocus: false,
    }
  );

  return {
    projects,
    isLoading: projectsQuery.isRefetching,
  };
};

export const useCustomerProjectDetailQueries = ({
  projectId,
}: {
  projectId: number;
}) => {
  const [project, projectQuery] =
    api.customer.getProjectDetails.useSuspenseQuery(
      { projectId },
      {
        refetchOnWindowFocus: false,
      }
    );

  return {
    project,
    isLoading: projectQuery.isRefetching,
  };
};

export const useCustomerPendingInvitationsQueries = () => {
  const [invitations, invitationsQuery] =
    api.customer.getPendingInvitations.useSuspenseQuery(
      {},
      {
        refetchOnWindowFocus: false,
      }
    );

  return {
    invitations,
    isLoading: invitationsQuery.isRefetching,
  };
};
