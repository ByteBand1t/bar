import type { Metadata } from "next";
import { PinLoginForm } from "@/components/pin-login-form";

export const metadata: Metadata = { title: "Admin – Anmelden" };

export default function AdminLoginPage() {
  return (
    <PinLoginForm
      role="admin"
      defaultNext="/admin"
      title="Admin"
      subtitle="Admin-PIN eingeben"
    />
  );
}
