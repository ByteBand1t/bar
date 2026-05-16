import type { Metadata } from "next";
import { BarDashboard } from "./bar-dashboard";

export const metadata: Metadata = {
  title: "Bar Dashboard",
};

export default function BarPage() {
  return <BarDashboard />;
}
