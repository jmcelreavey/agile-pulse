import type { Metadata } from "next";
import SignInView from "~/app/views/SignInView";
import { getSignInProviders } from "~/server/signInProviders";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Agile Pulse, or explore the demo workspace with no account needed.",
  alternates: { canonical: "/sign-in" },
};

export default function SignInPage() {
  return <SignInView providers={getSignInProviders()} />;
}
