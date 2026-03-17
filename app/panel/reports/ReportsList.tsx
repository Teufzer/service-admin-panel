"use client";

import { useEffect, useState } from "react";
import { Badge, Flex, Heading, Text } from "@radix-ui/themes";

interface Report {
  _id: string;
  author_id?: string;
  content?: { type?: string; id?: string };
  additional_context?: string;
  status?: string;
  notes?: string;
}

export function ReportsList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => { setReports(d.reports || []); setLoading(false); });
  }, []);

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
              gap="1"
              p="3"
              style={{ borderBottom: "1px solid var(--gray-4)" }}
            >
              <Flex align="center" gap="2">
                <Badge color={r.status === "Resolved" ? "green" : r.status === "Rejected" ? "gray" : "orange"}>
                  {r.status || "En attente"}
                </Badge>
                <Text size="2" weight="bold">
                  {r.content?.type || "Contenu"} — ID: {r.content?.id || "N/A"}
                </Text>
              </Flex>
              <Text size="1" color="gray">
                Signalé par : {r.author_id || "anonyme"} · Report ID: {r._id}
              </Text>
              {r.additional_context && (
                <Text size="2" style={{ opacity: 0.8 }}>
                  "{r.additional_context}"
                </Text>
              )}
              {r.content?.id && (
                <Flex gap="2" mt="1">
                  <a
                    href={`/panel/revolt/inspect/${r.author_id}`}
                    style={{ fontSize: "12px", color: "var(--blue-9)" }}
                  >
                    Voir l'auteur du signalement →
                  </a>
                  <a
                    href={`/panel/revolt/inspect/${r.content.id}`}
                    style={{ fontSize: "12px", color: "var(--red-9)" }}
                  >
                    Voir le contenu signalé →
                  </a>
                </Flex>
              )}
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
