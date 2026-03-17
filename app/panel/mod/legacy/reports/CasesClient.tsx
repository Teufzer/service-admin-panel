"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertDialog, Badge, Button, Callout, Card, Flex, Heading, Text, TextArea, TextField } from "@radix-ui/themes";
import { closeCaseAction, createCase, linkReportToCase, reopenCaseAction, unlinkReportFromCase } from "./actions";

interface Report { _id: string; status: string; content?: { type?: string; report_reason?: string }; case_id?: string; }
interface Case { _id: string; title: string; notes?: string; author: string; status: string; reports: Report[]; }
interface Props { cases: Case[]; unlinkedReports: Report[]; }

export function CasesClient({ cases: initialCases, unlinkedReports: initialUnlinked }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [linkTarget, setLinkTarget] = useState({ reportId: "", caseId: "" });

  const refresh = () => router.refresh();
  const reportBadgeColor = (s: string) => s === "Resolved" ? "green" : s === "Rejected" ? "gray" : "orange";

  const addCase = useMutation({
    mutationFn: async () => { if (!newTitle.trim()) return; await createCase(newTitle.trim(), newNotes.trim()); setNewTitle(""); setNewNotes(""); refresh(); },
    onError: (e: any) => setError(String(e)),
  });
  const toggleCase = useMutation({
    mutationFn: async ({ id, open }: { id: string; open: boolean }) => { if (open) await closeCaseAction(id); else await reopenCaseAction(id); refresh(); },
    onError: (e: any) => setError(String(e)),
  });
  const doLink = useMutation({
    mutationFn: async () => { if (!linkTarget.reportId || !linkTarget.caseId) return; await linkReportToCase(linkTarget.reportId, linkTarget.caseId); setLinkTarget({ reportId: "", caseId: "" }); refresh(); },
    onError: (e: any) => setError(String(e)),
  });
  const doUnlink = useMutation({
    mutationFn: async (reportId: string) => { await unlinkReportFromCase(reportId); refresh(); },
    onError: (e: any) => setError(String(e)),
  });

  return (
    <Flex direction="column" gap="4">
      {error && <Callout.Root color="red" size="1"><Callout.Text>{error}</Callout.Text></Callout.Root>}

      <Card>
        <Flex direction="column" gap="3">
          <Heading size="3">Nouveau cas</Heading>
          <TextField.Root placeholder="Titre du cas" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <TextArea placeholder="Notes internes (optionnel)" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2} />
          <Button style={{ width: "fit-content" }} disabled={!newTitle.trim() || addCase.isPending} onClick={() => addCase.mutate()}>Créer le cas</Button>
        </Flex>
      </Card>

      {initialUnlinked.length > 0 && (
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="3">Rapports non liés ({initialUnlinked.length})</Heading>
            {initialCases.filter((c) => c.status === "Open").length > 0 && (
              <Flex gap="2" align="end" wrap="wrap">
                <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 200 }}>
                  <Text size="1" color="gray">Rapport</Text>
                  <select style={{ padding: "6px 8px", borderRadius: 6, background: "var(--gray-2)", border: "1px solid var(--gray-6)", color: "inherit" }} value={linkTarget.reportId} onChange={(e) => setLinkTarget((t) => ({ ...t, reportId: e.target.value }))}>
                    <option value="">— Sélectionner —</option>
                    {initialUnlinked.map((r) => <option key={r._id} value={r._id}>{r._id.slice(-8)} — {r.content?.type}/{r.content?.report_reason ?? "?"}</option>)}
                  </select>
                </Flex>
                <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 200 }}>
                  <Text size="1" color="gray">Cas cible</Text>
                  <select style={{ padding: "6px 8px", borderRadius: 6, background: "var(--gray-2)", border: "1px solid var(--gray-6)", color: "inherit" }} value={linkTarget.caseId} onChange={(e) => setLinkTarget((t) => ({ ...t, caseId: e.target.value }))}>
                    <option value="">— Sélectionner —</option>
                    {initialCases.filter((c) => c.status === "Open").map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </Flex>
                <Button disabled={!linkTarget.reportId || !linkTarget.caseId || doLink.isPending} onClick={() => doLink.mutate()}>Lier</Button>
              </Flex>
            )}
            <Flex direction="column" gap="1">
              {initialUnlinked.map((r) => (
                <Flex key={r._id} align="center" justify="between" p="2" style={{ background: "var(--gray-2)", borderRadius: 6 }}>
                  <Flex align="center" gap="2">
                    <Badge color={reportBadgeColor(r.status)} size="1">{r.status || "Created"}</Badge>
                    <Text size="2">{r.content?.type} — {r.content?.report_reason ?? "?"}</Text>
                    <Text size="1" color="gray">…{r._id.slice(-6)}</Text>
                  </Flex>
                  <a href={`/panel/revolt/inspect/message/${r._id}`} style={{ fontSize: 12, color: "var(--blue-9)" }}>Voir →</a>
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Card>
      )}

      {initialCases.length === 0 ? (
        <Text color="gray">Aucun cas créé.</Text>
      ) : initialCases.map((c) => (
        <Card key={c._id}>
          <Flex direction="column" gap="3">
            <Flex align="center" justify="between" wrap="wrap" gap="2">
              <Flex align="center" gap="2">
                <Badge color={c.status === "Open" ? "green" : "gray"}>{c.status === "Open" ? "Ouvert" : "Fermé"}</Badge>
                <Heading size="3">{c.title}</Heading>
              </Flex>
              <Button size="1" variant="soft" color={c.status === "Open" ? "gray" : "green"} disabled={toggleCase.isPending} onClick={() => toggleCase.mutate({ id: c._id, open: c.status === "Open" })}>
                {c.status === "Open" ? "Fermer" : "Rouvrir"}
              </Button>
            </Flex>
            {c.notes && <Text size="2" color="gray" style={{ fontStyle: "italic" }}>{c.notes}</Text>}
            <Text size="1" color="gray">Créé par {c.author} · ID: {c._id}</Text>
            {c.reports.length === 0 ? <Text size="2" color="gray">Aucun rapport lié.</Text> : (
              <Flex direction="column" gap="1">
                <Text size="1" color="gray" weight="bold">Rapports liés ({c.reports.length})</Text>
                {c.reports.map((r) => (
                  <Flex key={r._id} align="center" justify="between" p="2" style={{ background: "var(--gray-2)", borderRadius: 6 }}>
                    <Flex align="center" gap="2">
                      <Badge color={reportBadgeColor(r.status)} size="1">{r.status || "Created"}</Badge>
                      <Text size="2">{r.content?.type} — {r.content?.report_reason ?? "?"}</Text>
                      <Text size="1" color="gray">…{r._id.slice(-6)}</Text>
                    </Flex>
                    <Flex gap="2" align="center">
                      <a href={`/panel/revolt/inspect/message/${r._id}`} style={{ fontSize: 12, color: "var(--blue-9)" }}>Voir →</a>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger><Button size="1" variant="ghost" color="gray">Délier</Button></AlertDialog.Trigger>
                        <AlertDialog.Content>
                          <AlertDialog.Title>Délier ce rapport ?</AlertDialog.Title>
                          <AlertDialog.Description color="gray">Le rapport sera retiré du cas.</AlertDialog.Description>
                          <Flex gap="3" mt="4" justify="end">
                            <AlertDialog.Cancel><Button variant="soft" color="gray">Annuler</Button></AlertDialog.Cancel>
                            <AlertDialog.Action onClick={() => doUnlink.mutate(r._id)}><Button color="red">Délier</Button></AlertDialog.Action>
                          </Flex>
                        </AlertDialog.Content>
                      </AlertDialog.Root>
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>
      ))}
    </Flex>
  );
}
