import { redirect } from "next/navigation";

export default function CustomerRootPage() {
  // Redirect from /customer to /customer/dashboard
  redirect("/customer/dashboard");
}
