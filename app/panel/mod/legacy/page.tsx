import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { fetchPeople } from "@/lib/database/hr/people";
import { col } from "@/lib/db";
import { Badge, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Overview — Vokx Admin",
};

export default async function ModerationOverview() {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  const [reports, cases, teamPeople] = await Promise.all([
    col("safety_reports").find({} as any).toArray(),
    col("safety_cases").find({} as any).toArray(),
    fetchPeople().catch(() => []),
  ]);

  const reportsByStatus = {
    Created: reports.filter((r: any) => !r.status || r.status === "Created").length,
    Resolved: reports.filter((r: any) => r.status === "Resolved").length,
    Rejected: reports.filter((r: any) => r.status === "Rejected").length,
  };

  const casesByStatus = {
    Open: cases.filter((c: any) => c.status === "Open" || !c.status).length,
    Closed: cases.filter((c: any) => c.status === "Closed").length,
  };

  const unlinkedReports = reports.filter((r: any) => !r.case_id).length;
  const teamActive = (teamPeople as any[]).filter((p) => p.status === "Active").length;
  const teamPending = (teamPeople as any[]).filter((p) => p.status === "Pending").length;

  const stats = [
    { label: "Signalements en attente", value: reportsByStatus.Created, color: reportsByStatus.Created > 0 ? "orange" : "green", href: "/panel/reports" },
    { label: "Signalements résolus", value: reportsByStatus.Resolved, color: "green", href: "/panel/reports" },
    { label: "Signalements rejetés", value: reportsByStatus.Rejected, color: "gray", href: "/panel/reports" },
    { label: "Cas ouverts", value: casesByStatus.Open, color: casesByStatus.Open > 0 ? "blue" : "green", href: "/panel/mod/legacy/reports" },
    { label: "Cas fermés", value: casesByStatus.Closed, color: "gray", href: "/panel/mod/legacy/reports" },
    { label: "Rapports non liés", value: unlinkedReports, color: unlinkedReports > 0 ? "amber" : "green", href: "/panel/mod/legacy/reports" },
    { label: "Membres actifs", value: teamActive, color: "green", href: "/panel/hr/team" },
    { label: "Demandes en attente", value: teamPending, color: teamPending > 0 ? "orange" : "gray", href: "/panel/hr/team" },
  ] as const;

  const recentReports = reports.filter((r: any) => !r.status || r.status === "Created").slice(0, 5);

  return (
    <Flex direction="column" gap="5">
      <Flex direction="column" gap="1">
        <Heading size="6">Vue d'ensemble — Modération</Heading>
        <Text color="gray" size="2">État actuel de la plateforme en temps réel.</Text>
      </Flex>

      <Grid columns={{ initial: "2", sm: "4" }} gap="3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <Card style={{ cursor: "pointer" }}>
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">{s.label}</Text>
                <Flex align="center" gap="2">
                  <Heading size="6">{s.value}</Heading>
                  <Badge color={s.color as any} size="1">{s.value > 0 ? "●" : "✓"}</Badge>
                </Flex>
              </Flex>
            </Card>
          </Link>
        ))}
      </Grid>

      <Card>
        <Flex direction="column" gap="3">
          <Flex align="center" justify="between">
            <Heading size="4">Signalements non traités récents</Heading>
            <Link href="/panel/reports" style={{ fontSize: 13, color: "var(--blue-9)" }}>Voir tous →</Link>
          </Flex>
          {recentReports.length === 0 ? (
            <Text color="green" size="2">Aucun signalement en attente. ✓</Text>
          ) : (
            <Flex direction="column" gap="2">
              {recentReports.map((r: any) => (
                <Flex key={r._id} align="center" justify="between" p="2" style={{ background: "var(--gray-2)", borderRadius: 6 }}>
                  <Flex align="center" gap="2">
                    <Badge color="orange" size="1">Created</Badge>
                    <Text size="2">{r.content?.type} — {r.content?.report_reason ?? "NoneSpecified"}</Text>
                    {r.additional_context && (
                      <Text size="1" color="gray" style={{ fontStyle: "italic" }}>
                        "{r.additional_context.slice(0, 40)}{r.additional_context.length > 40 ? "…" : ""}"
                      </Text>
                    )}
                  </Flex>
                  <Link href={`/panel/revolt/inspect/message/${r._id}`} style={{ fontSize: 12, color: "var(--blue-9)" }}>
                    Traiter →
                  </Link>
                </Flex>
              ))}
            </Flex>
          )}
        </Flex>
      </Card>

      <Card>
        <Flex direction="column" gap="3">
          <Heading size="4">Accès rapides</Heading>
          <Flex gap="2" wrap="wrap">
            <Link href="/panel/reports" style={{ textDecoration: "none" }}><Badge size="2" color="orange" style={{ cursor: "pointer", padding: "8px 12px" }}>📋 Signalements</Badge></Link>
            <Link href="/panel/mod/legacy/reports" style={{ textDecoration: "none" }}><Badge size="2" color="blue" style={{ cursor: "pointer", padding: "8px 12px" }}>📁 Cases</Badge></Link>
            <Link href="/panel/mod/legacy/create-report" style={{ textDecoration: "none" }}><Badge size="2" color="red" style={{ cursor: "pointer", padding: "8px 12px" }}>➕ Créer rapport</Badge></Link>
            <Link href="/panel/revolt/inspect" style={{ textDecoration: "none" }}><Badge size="2" color="gray" style={{ cursor: "pointer", padding: "8px 12px" }}>🔍 Search by ID</Badge></Link>
            <Link href="/panel/hr/team" style={{ textDecoration: "none" }}><Badge size="2" color="green" style={{ cursor: "pointer", padding: "8px 12px" }}>👥 Équipe</Badge></Link>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
