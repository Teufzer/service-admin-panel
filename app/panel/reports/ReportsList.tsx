"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Flex, Heading, Text } from "@radix-ui/themes";

interface Report {
  _id: string;
  author_id?: string;
  content?: { type?: string; id?: string; report_reason?: string };
  additional_context?: string;
  status?: string;
}

export function ReportsList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/reports");
    const d = await res.json();
    setReports(d.reports || []);
    setLoading(false);
  }

  async function doAction(reportId: string, action: "resolve" | "reject") {
    setActing(reportId);
    await fetch(`/api/reports/${reportId}/action`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActing(null);
    load();
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statusColor = (s?: string) =>
    s === "Resolved" ? "green" : s === "Rejected" ? "gray" : "orange";

  const contentLink = (id?: string, type?: string) => {
    if (!id) return null;
    if (type === "User") return `/panel/revolt/inspect/user/${id}`;
    if (type === "Server") return `/panel/revolt/inspect/server/${id}`;
    return `/panel/revolt/inspect/user/${id}`;
  };

  return (
    <Flex direction="column" gap="3">
      <Heading size="4">Signalements ({reports.length})</Heading>

      {loading ? (
        <Text color="gray">Chargement...</Text>
      ) : reports.length === 0 ? (
        <Text color="gray">Aucun signalement.</Text>
      ) : (
        <Flex direction="column" style={{ border: "1px solid var(--gray-4)", borderRadius: "8px" }}>
          {reports.map((r) => (
            <Flex
              key={r._id}
              direction="column"
              gap="2"
              p="3"
              style={{ borderBottom: "1px solid var(--gray-4)" }}
            >
              <Flex align="center" justify="between" gap="2" wrap="wrap">
                <Flex align="center" gap="2">
                  <Badge color={statusColor(r.status)}>
                    {r.status || "Created"}
                  </Badge>
                  <Text size="2" weight="bold">
                    {r.content?.type || "Contenu"}
                    {r.content?.report_reason ? ` — ${r.content.report_reason}` : ""}
                  </Text>
                </Flex>
                {(!r.status || r.status === "Created") && (
                  <Flex gap="2">
                    <Button
                      size="1"
                      color="green"
                      variant="soft"
                      disabled={acting === r._id}
                      onClick={() => doAction(r._id, "resolve")}
                    >
                      Résoudre
                    </Button>
                    <Button
                      size="1"
                      color="gray"
                      variant="soft"
                      disabled={acting === r._id}
                      onClick={() => doAction(r._id, "reject")}
                    >
                      Rejeter
                    </Button>
                  </Flex>
                )}
              </Flex>

              <Text size="1" color="gray">
                ID: {r._id}
              </Text>

              {r.additional_context && (
                <Text size="2" style={{ opacity: 0.8, fontStyle: "italic" }}>
                  {r.additional_context}
                </Text>
              )}

              <Flex gap="3" wrap="wrap">
                {r.author_id && (
                  <a
                    href={`/panel/revolt/inspect/user/${r.author_id}`}
                    style={{ fontSize: "12px", color: "var(--blue-9)" }}
                  >
                    Auteur du signalement ({r.author_id.slice(-6)}) →
                  </a>
                )}
                {r.content?.id && (
                  <a
                    href={contentLink(r.content.id, r.content.type) ?? "#"}
                    style={{ fontSize: "12px", color: "var(--red-9)" }}
                  >
                    Contenu signalé: {r.content.type} ({r.content.id.slice(-6)}) →
                  </a>
                )}
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
