import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

/** Team pages: signed-in team members only. Customers go to their portal. */
export async function requireTeamMember() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.isCustomer) redirect("/customer/dashboard");
  return session;
}

/** Customer portal pages: signed-in customers only. */
export async function requireCustomer() {
  const session = await auth();
  if (!session?.user?.isCustomer) redirect("/customer/login");
  return session;
}
