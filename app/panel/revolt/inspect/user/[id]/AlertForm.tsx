"use client";

import { useState } from "react";
import { Button, Flex, Text, TextArea } from "@radix-ui/themes";

export function AlertForm({ userId }: { userId: string }) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!content.trim()) return;
    setSending(true);
    const res = await fetch("/api/users/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, content }),
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
      setContent("");
      setTimeout(() => setSent(false), 3000);
    }
  }

  return (
    <Flex direction="column" gap="2">
      <TextArea
        placeholder="Contenu de l'alerte..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <Flex align="center" gap="2">
        <Button
          size="2"
          variant="soft"
          disabled={sending || !content.trim()}
          onClick={send}
        >
          {sending ? "Envoi..." : "Envoyer l'alerte"}
        </Button>
        {sent && <Text color="green" size="2">Alerte envoyée !</Text>}
      </Flex>
    </Flex>
  );
}
