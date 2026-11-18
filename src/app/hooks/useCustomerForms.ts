import { useForm } from "@mantine/form";

export interface CustomerAcceptInvitationForm {
  email: string;
  password: string;
}

export function useCustomerAcceptInvitationForm(invitationEmail?: string) {
  return useForm<CustomerAcceptInvitationForm>({
    initialValues: {
      email: invitationEmail || "",
      password: "",
    },
    validate: {
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^\S+@\S+$/.test(value)) return "Invalid email format";
        if (invitationEmail && value !== invitationEmail) {
          return "Email must match the invitation email";
        }
        return null;
      },
      password: (value) =>
        value.length < 1 ? "Password is required" : null,
    },
  });
}

export interface CustomerRegistrationForm {
  name: string;
  companyName: string;
  password: string;
  confirmPassword: string;
}

export function useCustomerRegistrationForm() {
  return useForm<CustomerRegistrationForm>({
    initialValues: {
      name: "",
      companyName: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
    },
  });
}