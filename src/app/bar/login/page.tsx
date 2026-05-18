import type { Metadata } from "next";
import { PinLoginForm } from "@/components/pin-login-form";

export const metadata: Metadata = { title: "Bar – Anmelden" };

export default function BarLoginPage() {
  return (
    <PinLoginForm
      role="bar"
      defaultNext="/bar"
      title="Bar"
      subtitle="PIN eingeben um fortzufahren"
    />
  );
}
