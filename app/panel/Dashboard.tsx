"use client";

import { useEffect, useState } from "react";
import { Badge, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";

interface Stats {
  totalUsers: number;
  totalServers: number;
  openReports: number;
  totalMessages: number;
  newUsers: number;
  bannedUsers: number;
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: "red" | "green" | "blue" | "orange" }) {
  return (
    <Card>
      <Flex direction="column" gap="1">
        <Text size="1" color="gray">{label}</Text>
        <Heading size="6" color={color}>{typeof value === "number" ? value.toLocaleString() : value}</Heading>
      </Flex>
    </Card>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <Text color="gray">Chargement des statistiques...</Text>;

  return (
    <Flex direction="column" gap="4">
      <Heading size="5">Vue d&apos;ensemble — Vokx</Heading>

      <Grid columns={{ initial: "2", sm: "3", lg: "6" }} gap="3">
        <StatCard label="Utilisateurs" value={stats.totalUsers} color="blue" />
        <StatCard label="Serveurs" value={stats.totalServers} />
        <StatCard label="Messages" value={stats.totalMessages} />
        <StatCard label="Signalements ouverts" value={stats.openReports} color={stats.openReports > 0 ? "orange" : "green"} />
        <StatCard label="Nouveaux (7j)" value={stats.newUsers} color="green" />
        <StatCard label="Bannis" value={stats.bannedUsers} color="red" />
      </Grid>

      {stats.openReports > 0 && (
        <Card>
          <Flex align="center" gap="3">
            <Badge color="orange" size="2">{stats.openReports} signalement{stats.openReports > 1 ? "s" : ""} en attente</Badge>
            <a href="/panel/reports" style={{ color: "var(--orange-9)", fontSize: "14px" }}>
              Traiter les signalements →
            </a>
          </Flex>
        </Card>
      )}
    </Flex>
  );
}
