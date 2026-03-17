"use client";

import { Strike } from "@/lib/database/revolt/safety_strikes";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  Badge,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  Select,
  Text,
  TextField,
} from "@radix-ui/themes";

import { strikeUser } from "../../user/[id]/actions";
import { deleteReportedMessage, rejectReport, resolveReport } from "./actions";

interface Props {
  reportId: string;
  reportStatus: string;
  messageId: string;
  authorId: string;
  authorFlags: number;
  authorStrikes: Strike[];
}

export function ModerationActions({
  reportId,
  reportStatus,
  messageId,
  authorId,
  authorFlags,
  authorStrikes,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [msgDeleted, setMsgDeleted] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(reportStatus);
  const [flags, setFlags] = useState(authorFlags);

  const [strikeReason, setStrikeReason] = useState<string[]>([""]);
  const [strikeContext, setStrikeContext] = useState("");
  const [suspendDays, setSuspendDays] = useState<"7" | "14" | "indefinite">("7");

  function notify(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }

  const deleteMsg = useMutation({
    mutationFn: async () => {
      await deleteReportedMessage(messageId);
      setMsgDeleted(true);
      notify("Message supprimé.");
    },
    onError: (e: any) => setError(e.message),
  });

  const resolve = useMutation({
    mutationFn: async () => {
      await resolveReport(reportId);
      setCurrentStatus("Resolved");
      notify("Rapport résolu.");
    },
    onError: (e: any) => setError(e.message),
  });

  const reject = useMutation({
    mutationFn: async () => {
      await rejectReport(reportId);
      setCurrentStatus("Rejected");
      notify("Rapport rejeté.");
    },
    onError: (e: any) => setError(e.message),
  });

  const strike = useMutation({
    mutationFn: async (type: "strike" | "suspension" | "ban") => {
      await strikeUser(authorId, type, strikeReason, strikeContext, undefined, suspendDays);
      if (type === "suspension") setFlags(1);
      if (type === "ban") setFlags(4);
      setStrikeReason([""]);
      setStrikeContext("");
      notify(
        type === "strike"
          ? "Strike appliqué à l'utilisateur."
          : type === "suspension"
            ? "Utilisateur suspendu."
            : "Utilisateur banni.",
      );
    },
    onError: (e: any) => setError(String(e)),
  });

  const reasonEditor = (
    <Flex direction="column" gap="1">
      {strikeReason.map((value, idx) => (
        <TextField.Root
          key={idx}
          value={value}
          onChange={(e) =>
            setStrikeReason((r) => r.map((v, i) => (i === idx ? e.target.value : v)))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") setStrikeReason((r) => [...r, ""]);
            else if (e.key === "Backspace" && !strikeReason[idx] && strikeReason.length > 1)
              setStrikeReason((r) => r.filter((_, i) => i !== idx));
          }}
          placeholder={
            idx === 0
              ? "Raison (Entrée pour en ajouter)"
              : "Raison supplémentaire (Retour arrière pour supprimer)"
          }
        />
      ))}
      <TextField.Root
        value={strikeContext}
        onChange={(e) => setStrikeContext(e.target.value)}
        placeholder="Contexte interne (visible modérateurs uniquement)"
      />
    </Flex>
  );

  const isBanned = (flags & 4) !== 0;
  const isSuspended = (flags & 1) !== 0;
  const isPending = strike.isPending || resolve.isPending || reject.isPending || deleteMsg.isPending;

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Heading size="4">Actions de modération</Heading>

        {error && (
          <Callout.Root color="red" size="1">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}
        {success && (
          <Callout.Root color="green" size="1">
            <Callout.Text>{success}</Callout.Text>
          </Callout.Root>
        )}

        {/* Statut du rapport */}
        <Flex direction="column" gap="2">
          <Text size="2" weight="bold" color="gray">
            Statut du rapport
          </Text>
          <Flex gap="2" align="center">
            <Badge
              color={
                currentStatus === "Resolved"
                  ? "green"
                  : currentStatus === "Rejected"
                    ? "gray"
                    : "orange"
              }
            >
              {currentStatus}
            </Badge>
            {currentStatus === "Created" && (
              <>
                <Button
                  size="1"
                  color="green"
                  variant="soft"
                  disabled={isPending}
                  onClick={() => resolve.mutate()}
                >
                  Résoudre
                </Button>
                <Button
                  size="1"
                  color="gray"
                  variant="soft"
                  disabled={isPending}
                  onClick={() => reject.mutate()}
                >
                  Rejeter
                </Button>
              </>
            )}
          </Flex>
        </Flex>

        {/* Supprimer le message */}
        <Flex direction="column" gap="2">
          <Text size="2" weight="bold" color="gray">
            Message
          </Text>
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button
                color="red"
                variant="soft"
                disabled={msgDeleted || isPending}
                style={{ width: "fit-content" }}
              >
                {msgDeleted ? "Message supprimé" : "Supprimer le message"}
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Title>Supprimer le message</AlertDialog.Title>
              <AlertDialog.Description color="gray">
                Cette action va supprimer définitivement le message signalé. Elle est irréversible.
              </AlertDialog.Description>
              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">Annuler</Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action onClick={() => deleteMsg.mutate()}>
                  <Button color="red">Confirmer la suppression</Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </Flex>

        {/* Actions sur l'auteur */}
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Text size="2" weight="bold" color="gray">
              Auteur du message
            </Text>
            {isBanned && <Badge color="red">Banni</Badge>}
            {isSuspended && !isBanned && <Badge color="amber">Suspendu</Badge>}
          </Flex>

          <Flex gap="2" wrap="wrap">
            {/* Strike */}
            <AlertDialog.Root>
              <AlertDialog.Trigger>
                <Button size="2" disabled={isPending || isBanned}>
                  Strike
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Title>Appliquer un strike</AlertDialog.Title>
                <AlertDialog.Description asChild>
                  <Flex direction="column" gap="2">
                    <Text color="gray" size="2">
                      Un avertissement sera envoyé à l'utilisateur par DM.
                    </Text>
                    {reasonEditor}
                  </Flex>
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">Annuler</Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action onClick={() => strike.mutate("strike")}>
                    <Button color="red">Appliquer le strike</Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>

            {/* Suspend */}
            <AlertDialog.Root>
              <AlertDialog.Trigger>
                <Button
                  size="2"
                  color="amber"
                  disabled={isPending || isSuspended || isBanned}
                >
                  Suspendre
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Title>Suspendre l'utilisateur</AlertDialog.Title>
                <AlertDialog.Description asChild>
                  <Flex direction="column" gap="2">
                    <Text color="gray" size="2">
                      L'utilisateur recevra un DM et sera suspendu pour la durée choisie.
                    </Text>
                    <Select.Root
                      value={suspendDays}
                      onValueChange={(v) => setSuspendDays(v as "7" | "14" | "indefinite")}
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="7">7 jours</Select.Item>
                        <Select.Item value="14">14 jours</Select.Item>
                        <Select.Item value="indefinite">Indéfini</Select.Item>
                      </Select.Content>
                    </Select.Root>
                    {reasonEditor}
                  </Flex>
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">Annuler</Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action onClick={() => strike.mutate("suspension")}>
                    <Button color="amber">Suspendre</Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>

            {/* Ban */}
            <AlertDialog.Root>
              <AlertDialog.Trigger>
                <Button
                  size="2"
                  color="red"
                  disabled={isPending || isBanned}
                >
                  {isBanned ? "Déjà banni" : "Bannir"}
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Title>Bannir l'utilisateur</AlertDialog.Title>
                <AlertDialog.Description asChild>
                  <Flex direction="column" gap="2">
                    <Text color="red" size="2">
                      Action irréversible. L'utilisateur sera banni définitivement.
                    </Text>
                    {reasonEditor}
                  </Flex>
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">Annuler</Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action onClick={() => strike.mutate("ban")}>
                    <Button color="red">Confirmer le ban</Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}
