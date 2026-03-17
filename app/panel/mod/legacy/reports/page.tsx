import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { col } from "@/lib/db";
import { Flex, Heading, Text } from "@radix-ui/themes";
import { Metadata } from "next";

import { CasesClient } from "./CasesClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reports & Cases — Vokx Admin" };

export default async function ReportsAndCasesPage() {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  const rawCases = await col("safety_cases").find({} as any).sort({ _id: -1 } as any).limit(200).toArray();
  const rawReports = await col("safety_reports").find({} as any).sort({ _id: -1 } as any).limit(500).toArray();

  const cases = rawCases.map((c: any) => ({
    _id: c._id, title: c.title ?? "Sans titre", notes: c.notes, author: c.author ?? "inconnu", status: c.status ?? "Open",
    reports: rawReports.filter((r: any) => r.case_id === c._id).map((r: any) => ({ _id: r._id, status: r.status ?? "Created", content: r.content, case_id: r.case_id })),
  }));

  const unlinkedReports = rawReports.filter((r: any) => !r.case_id).map((r: any) => ({ _id: r._id, status: r.status ?? "Created", content: r.content }));

  return (
    <Flex direction="column" gap="4">
      <Flex direction="column" gap="1">
        <Heading size="6">Reports & Cases</Heading>
        <Text color="gray" size="2">{cases.length} cas · {rawReports.length} rapports · {unlinkedReports.length} non liés</Text>
      </Flex>
      <CasesClient cases={cases} unlinkedReports={unlinkedReports} />
    </Flex>
  );
}
