import { getSession, signIn } from "next-auth/react";
import { ShowNotificationUtil } from "~/app/logic/common/ShowNotificationUtil";
import { UseCase } from "~/app/logic/useCase";

export class CustomerLoginUseCase extends UseCase {
  public async execute({
    credentials,
    callbackUrl,
  }: {
    credentials: {
      email: string;
      password: string;
    };
    callbackUrl: string;
  }) {
    try {
      this.setIsMutating(true);

      console.log("🔑 Attempting customer login for:", credentials.email);

      const result = await signIn("customer-credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      console.log("📡 Login result:", {
        ok: result?.ok,
        error: result?.error,
        url: result?.url,
      });

      if (result?.error) {
        throw new Error("Invalid email or password");
      } else if (result?.ok) {
        // Force clear any previous session data cache
        // This is needed because Next Auth sometimes reuses cached session data
        window.sessionStorage.removeItem("nextauth.session");
        window.localStorage.removeItem("nextauth.session");

        // Wait for session to be established with retries
        let session = null;
        let attempts = 0;
        const maxAttempts = 8;

        while (!session?.user?.isCustomer && attempts < maxAttempts) {
          attempts++;
          console.log(
            `🔄 Waiting for customer session (attempt ${attempts}/${maxAttempts})...`
          );

          // Wait increasing amounts of time between retries
          await new Promise((resolve) => setTimeout(resolve, 250 * attempts));

          // Force refresh to get the latest session
          session = await getSession();

          // Log the session state without sensitive info
          console.log("📦 Session check:", {
            attempt: attempts,
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id,
            role: session?.user?.role,
            isCustomer: session?.user?.isCustomer,
            expires: session?.expires,
          });
        }

        if (!session?.user?.isCustomer) {
          console.warn(
            "⚠️ Failed to establish customer session after multiple attempts"
          );
        } else {
          console.log("✅ Customer session established successfully");
        }

        ShowNotificationUtil({
          title: "Welcome back!",
          message: "Successfully signed in to your customer portal",
        });

        console.log("🔄 Redirecting to:", callbackUrl);
        this.router.push(callbackUrl);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("❌ Login error:", error);
      ShowNotificationUtil({
        title: "Login failed",
        message: errorMessage,
        isError: true,
      });
      throw error;
    } finally {
      this.setIsMutating(false);
    }
  }
}
