"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertDialog, Badge, Button, Callout, Card, Flex, Heading, Table, Text, TextField } from "@radix-ui/themes";
import { approveMember, inviteMember, rejectMember } from "./actions";

interface Person { _id: string; name: string; email: string; status: string; positionTitles: string[]; roleTitles: string[]; approvalRequest?: { reason: string; requestee: string }; }

export function TeamClient({ people }: { people: Person[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteReason, setInviteReason] = useState("");

  const refresh = () => router.refresh();
  const statusColor = (s: string) => s === "Active" ? "green" : s === "Pending" ? "orange" : s === "Retired" ? "blue" : "gray";

  const approve = useMutation({ mutationFn: async (id: string) => { await approveMember(id); refresh(); }, onError: (e: any) => setError(String(e)) });
  const reject = useMutation({ mutationFn: async (id: string) => { await rejectMember(id); refresh(); }, onError: (e: any) => setError(String(e)) });
  const invite = useMutation({
    mutationFn: async () => {
      if (!inviteName.trim() || !inviteEmail.trim()) return;
      await inviteMember(inviteName.trim(), inviteEmail.trim(), inviteReason.trim());
      setInviteName(""); setInviteEmail(""); setInviteReason(""); refresh();
    },
    onError: (e: any) => setError(String(e)),
  });

  const pending = people.filter((p) => p.status === "Pending");
  const active = people.filter((p) => p.status !== "Pending");

  return (
    <Flex direction="column" gap="4">
      {error && <Callout.Root color="red" size="1"><Callout.Text>{error}</Callout.Text></Callout.Root>}

      <Card>
        <Flex direction="column" gap="3">
          <Heading size="3">Inviter un membre</Heading>
          <Flex gap="2" wrap="wrap">
            <TextField.Root placeholder="Nom complet" value={inviteName} onChange={(e) => setInviteName(e.target.value)} style={{ flex: 1, minWidth: 150 }} />
            <TextField.Root placeholder="Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <TextField.Root placeholder="Raison (optionnel)" value={inviteReason} onChange={(e) => setInviteReason(e.target.value)} style={{ flex: 1, minWidth: 150 }} />
          </Flex>
          <Button style={{ width: "fit-content" }} disabled={!inviteName.trim() || !inviteEmail.trim() || invite.isPending} onClick={() => invite.mutate()}>Envoyer la demande</Button>
        </Flex>
      </Card>

      {pending.length > 0 && (
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="3" color="orange">Demandes en attente ({pending.length})</Heading>
            {pending.map((p) => (
              <Flex key={p._id} align="center" justify="between" gap="3" wrap="wrap" p="2" style={{ background: "var(--orange-2)", borderRadius: 6 }}>
                <Flex direction="column" gap="1">
                  <Flex align="center" gap="2"><Text weight="bold">{p.name}</Text><Text size="2" color="gray">{p.email}</Text></Flex>
                  {p.approvalRequest && <Text size="1" color="gray">Par {p.approvalRequest.requestee}{p.approvalRequest.reason ? ` · "${p.approvalRequest.reason}"` : ""}</Text>}
                </Flex>
                <Flex gap="2">
                  <Button size="1" color="green" disabled={approve.isPending} onClick={() => approve.mutate(p._id)}>Approuver</Button>
                  <AlertDialog.Root>
                    <AlertDialog.Trigger><Button size="1" color="red" variant="soft">Refuser</Button></AlertDialog.Trigger>
                    <AlertDialog.Content>
                      <AlertDialog.Title>Refuser la demande de {p.name} ?</AlertDialog.Title>
                      <AlertDialog.Description color="gray">La demande sera supprimée définitivement.</AlertDialog.Description>
                      <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel><Button variant="soft" color="gray">Annuler</Button></AlertDialog.Cancel>
                        <AlertDialog.Action onClick={() => reject.mutate(p._id)}><Button color="red">Refuser</Button></AlertDialog.Action>
                      </Flex>
                    </AlertDialog.Content>
                  </AlertDialog.Root>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </Card>
      )}

      <Card>
        <Flex direction="column" gap="3">
          <Heading size="3">Membres de l'équipe ({active.length})</Heading>
          {active.length === 0 ? <Text color="gray">Aucun membre actif.</Text> : (
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Postes</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Rôles</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {active.map((p) => (
                  <Table.Row key={p._id}>
                    <Table.Cell><Text weight="bold">{p.name}</Text></Table.Cell>
                    <Table.Cell><Text size="2" color="gray">{p.email}</Text></Table.Cell>
                    <Table.Cell><Badge color={statusColor(p.status) as any}>{p.status}</Badge></Table.Cell>
                    <Table.Cell><Flex gap="1" wrap="wrap">{p.positionTitles.length > 0 ? p.positionTitles.map((t, i) => <Badge key={i} color="blue" size="1">{t}</Badge>) : <Text size="1" color="gray">—</Text>}</Flex></Table.Cell>
                    <Table.Cell><Flex gap="1" wrap="wrap">{p.roleTitles.length > 0 ? p.roleTitles.map((t, i) => <Badge key={i} color="purple" size="1">{t}</Badge>) : <Text size="1" color="gray">—</Text>}</Flex></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Flex>
      </Card>
    </Flex>
  );
}
