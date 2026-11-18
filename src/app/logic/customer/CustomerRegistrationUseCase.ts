import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";
import { api } from "~/trpc/react";

export class CustomerRegistrationUseCase extends UseCase {
  public mutation = api.customer.acceptInvitation.useMutation();

  public async execute({
    token,
    registrationData,
  }: {
    token: string;
    registrationData: {
      name: string;
      companyName: string;
      password: string;
      confirmPassword: string;
    };
  }) {
    try {
      this.setIsMutating(true);

      await this.mutation.mutateAsync({
        token,
        name: registrationData.name,
        companyName: registrationData.companyName,
        password: registrationData.password,
      });

      ShowNotificationUtil({
        title: "Account created successfully!",
        message: "You can now sign in with your credentials",
      });

      this.router.push("/customer/login?message=registration-success");
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      ShowNotificationUtil({
        title: "Registration failed",
        message: errorMessage,
        isError: true,
      });
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
