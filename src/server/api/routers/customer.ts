import {
    customerProtectedProcedure,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/procedures";
import {
    AcceptExistingCustomerInvitationSchema,
    AcceptInvitationFromDashboardSchema,
    AcceptInvitationSchema,
    CancelInvitationSchema,
    CreateCustomerCommentSchema,
    CreateDeveloperCommentSchema,
    CreateInvitationSchema,
    CustomerEmailChangelogSchema,
    CustomerExportChangelogPdfSchema,
    DeleteCustomerCommentSchema,
    DeleteDeveloperCommentSchema,
    GetCustomerCommentsSchema,
    GetCustomerPendingInvitationsSchema,
    GetCustomerProjectDetailsSchema,
    GetCustomerProjectsSchema,
    GetCustomerSprintDetailsSchema,
    GetDeveloperCommentsSchema,
    GetDiscussionCommentsSchema,
    GetProjectCommentsForTeamSchema,
    GetProjectInvitationsSchema,
    ValidateInvitationSchema,
} from "~/server/api/schemas/customer";
import { createTRPCRouter } from "~/server/api/trpc";
import { NotAuthorisedError } from "~/server/errors/NotAuthorisedError";
import { AcceptExistingCustomerInvitationUseCase } from "~/server/logic/customer/AcceptExistingCustomerInvitationUseCase";
import { AcceptInvitationFromDashboardUseCase } from "~/server/logic/customer/AcceptInvitationFromDashboardUseCase";
import { AcceptInvitationUseCase } from "~/server/logic/customer/AcceptInvitationUseCase";
import { CancelInvitationUseCase } from "~/server/logic/customer/CancelInvitationUseCase";
import { CreateCustomerCommentUseCase } from "~/server/logic/customer/CreateCustomerCommentUseCase";
import { CreateDeveloperCommentUseCase } from "~/server/logic/customer/CreateDeveloperCommentUseCase";
import { CreateInvitationUseCase } from "~/server/logic/customer/CreateInvitationUseCase";
import { CustomerEmailChangelogUseCase } from "~/server/logic/customer/CustomerEmailChangelogUseCase";
import { CustomerExportChangelogPdfUseCase } from "~/server/logic/customer/CustomerExportChangelogPdfUseCase";
import { DeleteCustomerCommentUseCase } from "~/server/logic/customer/DeleteCustomerCommentUseCase";
import { DeleteDeveloperCommentUseCase } from "~/server/logic/customer/DeleteDeveloperCommentUseCase";
import { EmailInvitationUseCase } from "~/server/logic/customer/EmailInvitationUseCase";
import { GetCustomerCommentsUseCase } from "~/server/logic/customer/GetCustomerCommentsUseCase";
import { GetCustomerPendingInvitationsUseCase } from "~/server/logic/customer/GetCustomerPendingInvitationsUseCase";
import { GetCustomerProjectDetailsUseCase } from "~/server/logic/customer/GetCustomerProjectDetailsUseCase";
import { GetCustomerProjectsUseCase } from "~/server/logic/customer/GetCustomerProjectsUseCase";
import { GetCustomerSprintDetailsUseCase } from "~/server/logic/customer/GetCustomerSprintDetailsUseCase";
import { GetDeveloperCommentsUseCase } from "~/server/logic/customer/GetDeveloperCommentsUseCase";
import { GetDiscussionCommentsUseCase } from "~/server/logic/customer/GetDiscussionCommentsUseCase";
import { GetProjectCommentsForTeamUseCase } from "~/server/logic/customer/GetProjectCommentsForTeamUseCase";
import { GetProjectInvitationsUseCase } from "~/server/logic/customer/GetProjectInvitationsUseCase";
import { ValidateInvitationUseCase } from "~/server/logic/customer/ValidateInvitationUseCase";

export const customerRouter = createTRPCRouter({
  validateInvitation: publicProcedure
    .input(ValidateInvitationSchema)
    .query(async ({ ctx, input }) => {
      const validateInvitation = new ValidateInvitationUseCase(ctx.db);
      return validateInvitation.execute(input);
    }),

  acceptInvitation: publicProcedure
    .input(AcceptInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const acceptInvitation = new AcceptInvitationUseCase(ctx.db);
      return acceptInvitation.execute(input);
    }),

  acceptExistingCustomerInvitation: publicProcedure
    .input(AcceptExistingCustomerInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const acceptExistingCustomerInvitation = new AcceptExistingCustomerInvitationUseCase(ctx.db);
      return acceptExistingCustomerInvitation.execute(input);
    }),

  // Customer-protected routes (requires customer session)
  getProjects: customerProtectedProcedure
    .input(GetCustomerProjectsSchema)
    .query(async ({ ctx }) => {
      const getCustomerProjects = new GetCustomerProjectsUseCase(ctx.db);
      return getCustomerProjects.execute({
        customerId: ctx.session.user.id,
      });
    }),

  getProjectDetails: customerProtectedProcedure
    .input(GetCustomerProjectDetailsSchema)
    .query(async ({ ctx, input }) => {
      const getCustomerProjectDetails = new GetCustomerProjectDetailsUseCase(
        ctx.db
      );
      return getCustomerProjectDetails.execute({
        customerId: ctx.session.user.id,
        projectId: input.projectId,
      });
    }),

  getSprintDetails: customerProtectedProcedure
    .input(GetCustomerSprintDetailsSchema)
    .query(async ({ ctx, input }) => {
      const getCustomerSprintDetails = new GetCustomerSprintDetailsUseCase(
        ctx.db
      );
      return getCustomerSprintDetails.execute({
        customerId: ctx.session.user.id,
        projectId: input.projectId,
        sprintId: input.sprintId,
      });
    }),

  // Customer comment routes
  createComment: customerProtectedProcedure
    .input(CreateCustomerCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const createComment = new CreateCustomerCommentUseCase(ctx.db);
      return createComment.execute(input, ctx.session?.user.id ?? -1);
    }),

  getComments: customerProtectedProcedure
    .input(GetCustomerCommentsSchema)
    .query(async ({ ctx, input }) => {
      const getComments = new GetCustomerCommentsUseCase(ctx.db);
      return getComments.execute(input, ctx.session?.user.id ?? -1);
    }),

  deleteComment: protectedProcedure
    .input(DeleteCustomerCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const deleteComment = new DeleteCustomerCommentUseCase(ctx.db);
      
      // If user is a customer, pass their customer ID
      // If user is a developer, pass undefined (they can delete any comment)
      const customerId = ctx.session?.user.role === "customer" ? ctx.session.user.id : undefined;
      return deleteComment.execute(input, customerId);
    }),

  // Project manager routes (requires regular user session)
  createInvitation: protectedProcedure
    .input(CreateInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this project
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          domain: ctx.session?.user.domain,
        },
      });

      if (!project) {
        throw new NotAuthorisedError("You don't have access to this project");
      }

      const createInvitation = new CreateInvitationUseCase(ctx.db, {
        id: ctx.session.user.id,
        domain: ctx.session.user.domain ?? "",
      });
      const invitation = await createInvitation.execute(input);

      // Send invitation email
      const emailInvitation = new EmailInvitationUseCase(ctx.db);
      await emailInvitation.execute({
        email: input.email,
        projectName: project.name,
        token: invitation.token,
        invitedByName: ctx.session.user.name ?? "Team Member",
        isExistingCustomer: invitation.isExistingCustomer,
      });

      return invitation;
    }),

  getProjectInvitations: protectedProcedure
    .input(GetProjectInvitationsSchema)
    .query(async ({ ctx, input }) => {
      // Verify user has access to this project
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          domain: ctx.session?.user.domain,
        },
      });

      if (!project) {
        throw new NotAuthorisedError("You don't have access to this project");
      }

      const getProjectInvitations = new GetProjectInvitationsUseCase(ctx.db, {
        id: ctx.session.user.id,
        domain: ctx.session.user.domain ?? "",
      });
      return getProjectInvitations.execute(input);
    }),

  cancelInvitation: protectedProcedure
    .input(CancelInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this project
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          domain: ctx.session?.user.domain,
        },
      });

      if (!project) {
        throw new NotAuthorisedError("You don't have access to this project");
      }

      const cancelInvitation = new CancelInvitationUseCase(ctx.db, {
        id: ctx.session.user.id,
        domain: ctx.session.user.domain ?? "",
      });
      return cancelInvitation.execute(input);
    }),

  // Team member route to view customer comments
  getProjectComments: protectedProcedure
    .input(GetProjectCommentsForTeamSchema)
    .query(async ({ ctx, input }) => {
      const getProjectComments = new GetProjectCommentsForTeamUseCase(ctx.db, {
        id: ctx.session.user.id,
        domain: ctx.session.user.domain ?? "",
      });
      return getProjectComments.execute(input);
    }),

  // Customer pending invitations routes
  getPendingInvitations: customerProtectedProcedure
    .input(GetCustomerPendingInvitationsSchema)
    .query(async ({ ctx }) => {
      const getPendingInvitations = new GetCustomerPendingInvitationsUseCase(ctx.db);
      return getPendingInvitations.execute({
        customerId: ctx.session.user.id,
      });
    }),

  acceptInvitationFromDashboard: customerProtectedProcedure
    .input(AcceptInvitationFromDashboardSchema)
    .mutation(async ({ ctx, input }) => {
      const acceptInvitation = new AcceptInvitationFromDashboardUseCase(ctx.db);
      return acceptInvitation.execute({
        ...input,
        customerId: ctx.session.user.id,
      });
    }),

  // Customer changelog actions
  exportChangelogPdf: customerProtectedProcedure
    .input(CustomerExportChangelogPdfSchema)
    .mutation(async ({ ctx, input }) => {
      const exportPdf = new CustomerExportChangelogPdfUseCase(ctx.db);
      return exportPdf.execute({
        ...input,
        customerId: ctx.session.user.id,
      });
    }),

  emailChangelog: customerProtectedProcedure
    .input(CustomerEmailChangelogSchema)
    .mutation(async ({ ctx, input }) => {
      const emailChangelog = new CustomerEmailChangelogUseCase(ctx.db);
      return emailChangelog.execute({
        ...input,
        customerId: ctx.session.user.id,
      });
    }),

  // Developer comment routes (for team members)
  createDeveloperComment: protectedProcedure
    .input(CreateDeveloperCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const createComment = new CreateDeveloperCommentUseCase(ctx.db, {
        id: ctx.session.user.id,
        domain: "",
      });
      return createComment.execute(input);
    }),

  getDeveloperComments: protectedProcedure
    .input(GetDeveloperCommentsSchema)
    .query(async ({ ctx, input }) => {
      const getComments = new GetDeveloperCommentsUseCase(ctx.db, {
        id: ctx.session.user.id,
        domain: "",
      });
      return getComments.execute(input);
    }),

  deleteDeveloperComment: protectedProcedure
    .input(DeleteDeveloperCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const deleteComment = new DeleteDeveloperCommentUseCase(ctx.db, {
        id: ctx.session.user.id,
        domain: "",
      });
      return deleteComment.execute(input);
    }),

  // Unified discussion thread (both customer and developer comments)
  getDiscussionComments: protectedProcedure
    .input(GetDiscussionCommentsSchema)
    .query(async ({ ctx, input }) => {
      // Different access logic for customers vs developers
      if (ctx.session.user.role === "customer") {
        // For customers: use invitation-based access (pass customerId)
        const getDiscussion = new GetDiscussionCommentsUseCase(ctx.db, {
          id: ctx.session.user.id,
          domain: "", // Not used for customers
        });
        return getDiscussion.execute({
          ...input,
          customerId: ctx.session.user.id,
        });
      } else {
        // For developers: domain-based access or full access
        const getDiscussion = new GetDiscussionCommentsUseCase(ctx.db, {
          id: ctx.session.user.id,
          domain: "", // Empty domain for developers (full access)
        });
        return getDiscussion.execute(input);
      }
    }),
});
