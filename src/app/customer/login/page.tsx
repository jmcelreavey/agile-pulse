import type { Metadata } from "next";
import CustomerLoginView from "~/app/views/CustomerLoginView";

export const metadata: Metadata = {
  title: "Customer Login - Agile Pulse",
};

export default function CustomerLoginPage() {
  return <CustomerLoginView />;
}
