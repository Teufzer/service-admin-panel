import { Metadata } from "next";
import { ServersList } from "./ServersList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Serveurs — Vokx Admin",
};

export default function ServersPage() {
  return <ServersList />;
}
