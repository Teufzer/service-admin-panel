import { getScopedUser } from "@/lib/auth";
import { fetchPeople } from "@/lib/database/hr/people";
import { fetchPositions } from "@/lib/database/hr/position";
import { fetchRoles } from "@/lib/database/hr/role";
import { Flex, Heading, Text } from "@radix-ui/themes";
import { Metadata } from "next";

import { TeamClient } from "./TeamClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team Members — Vokx Admin" };

export default async function TeamPage() {
  await getScopedUser("hr.people.create");

  let people: any[] = [];
  try { people = await fetchPeople(); } catch {}

  const allPositionIds = [...new Set(people.flatMap((p) => p.positions ?? []))];
  const allRoleIds = [...new Set(people.flatMap((p) => p.roles ?? []))];
  const positions = allPositionIds.length ? await fetchPositions(allPositionIds) : [];
  const roles = allRoleIds.length ? await fetchRoles(allRoleIds) : [];

  const positionMap = Object.fromEntries(positions.map((p) => [p._id, p.title]));
  const roleMap = Object.fromEntries(roles.map((r) => [r._id, r.name]));

  const enriched = people.map((p) => ({
    _id: p._id, name: p.name, email: p.email, status: p.status,
    positions: p.positions ?? [], roles: p.roles ?? [],
    positionTitles: (p.positions ?? []).map((id: string) => positionMap[id] ?? id),
    roleTitles: (p.roles ?? []).map((id: string) => roleMap[id] ?? id),
    approvalRequest: p.approvalRequest,
  }));

  return (
    <Flex direction="column" gap="4">
      <Flex direction="column" gap="1">
        <Heading size="6">Team Members</Heading>
        <Text color="gray" size="2">
          {enriched.filter((p) => p.status !== "Pending").length} actif(s) · {enriched.filter((p) => p.status === "Pending").length} en attente
        </Text>
      </Flex>
      <TeamClient people={enriched} />
    </Flex>
  );
}
