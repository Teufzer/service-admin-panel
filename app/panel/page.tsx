import { Metadata } from "next";
import { Dashboard } from "./Dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vokx Dashboard",
  description: "Administration panel for Vokx.",
};

export default function Home() {
  return <Dashboard />;
}
