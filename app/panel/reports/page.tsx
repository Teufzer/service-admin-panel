import { Metadata } from "next";
import { ReportsList } from "./ReportsList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Signalements — Vokx Admin",
};

export default function ReportsPage() {
  return <ReportsList />;
}
