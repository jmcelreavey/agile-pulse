import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class CustomerAcceptInvitationUseCase extends UseCase {
  public mutation = api.customer.acceptExistingCustomerInvitation.useMutation();

  public async execute({
    token,
    acceptInvitationData,
  }: {
    token: string;
    acceptInvitationData: {
      email: string;
      password: string;
    };
  }) {
    try {
      this.setIsMutating(true);

      const result = await this.mutation.mutateAsync({
        token,
        email: acceptInvitationData.email,
        password: acceptInvitationData.password,
      });

      ShowNotificationUtil({
        title: "Invitation accepted successfully!",
        message: `You now have access to project: ${result.project?.name}`,
      });

      this.router.push("/customer/dashboard?message=invitation-accepted");
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Failed to accept invitation",
        message: errorMessage,
        isError: true,
      });
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
