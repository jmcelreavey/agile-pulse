import { env, integrations } from "~/env";
import { type SignInProviders } from "~/app/views/SignInView";

export function getSignInProviders(): SignInProviders {
  return {
    google: integrations.google,
    jira: integrations.jira,
    demo: env.DEMO_MODE || !integrations.google,
  };
}
