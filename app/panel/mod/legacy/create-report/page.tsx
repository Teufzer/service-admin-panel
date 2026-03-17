"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Callout, Card, Flex, Heading, Select, Text, TextArea, TextField } from "@radix-ui/themes";

const CONTENT_TYPES = ["Message", "Server", "User"] as const;
const REPORT_REASONS = ["NoneSpecified","Illegal","IllegalGoods","ExtremeViolence","Harassment","Malware","Spam","Fraud","HateSpeech","CSAM","Impersonation","InappropriateProfile","BanEvasion","Underage","SpamAbuse"] as const;

export default function CreateReportPage() {
  const [contentType, setContentType] = useState("Message");
  const [contentId, setContentId] = useState("");
  const [reason, setReason] = useState("NoneSpecified");
  const [context, setContext] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      if (!contentId.trim()) throw new Error("L'ID du contenu est requis");
      const res = await fetch("/api/reports/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType, contentId: contentId.trim(), reason, context: context.trim() }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Erreur");
      setSuccess(true); setContentId(""); setContext(""); setReason("NoneSpecified");
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <Flex direction="column" gap="4" style={{ maxWidth: 600 }}>
      <Flex direction="column" gap="1">
        <Heading size="6">Créer un rapport</Heading>
        <Text color="gray" size="2">Crée manuellement un rapport de modération.</Text>
      </Flex>
      {success && <Callout.Root color="green"><Callout.Text>Rapport créé !</Callout.Text></Callout.Root>}
      {error && <Callout.Root color="red"><Callout.Text>{error}</Callout.Text></Callout.Root>}
      <Card>
        <Flex direction="column" gap="4">
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">Type de contenu</Text>
            <Select.Root value={contentType} onValueChange={setContentType}>
              <Select.Trigger style={{ width: "100%" }} />
              <Select.Content>{CONTENT_TYPES.map((t) => <Select.Item key={t} value={t}>{t}</Select.Item>)}</Select.Content>
            </Select.Root>
          </Flex>
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">ID du contenu signalé</Text>
            <TextField.Root placeholder={`ID du ${contentType.toLowerCase()}`} value={contentId} onChange={(e) => setContentId(e.target.value)} />
          </Flex>
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">Raison</Text>
            <Select.Root value={reason} onValueChange={setReason}>
              <Select.Trigger style={{ width: "100%" }} />
              <Select.Content>{REPORT_REASONS.map((r) => <Select.Item key={r} value={r}>{r}</Select.Item>)}</Select.Content>
            </Select.Root>
          </Flex>
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">Contexte</Text>
            <TextArea placeholder="Informations supplémentaires…" value={context} onChange={(e) => setContext(e.target.value)} rows={3} />
          </Flex>
          <Button disabled={!contentId.trim() || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending ? "Création…" : "Créer le rapport"}
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}
