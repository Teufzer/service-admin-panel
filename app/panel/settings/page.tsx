"use client";

import { useState } from "react";
import { Badge, Button, Callout, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";

export default function SettingsPage() {
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateHash() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/auth/hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const d = await res.json();
    setLoading(false);
    if (d.hash) setResult(d.hash);
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Flex direction="column" gap="4" style={{ maxWidth: 640 }}>
      <Flex direction="column" gap="1">
        <Heading size="6">Paramètres — Sécurité</Heading>
        <Text color="gray" size="2">Génère un hash sécurisé (scrypt) pour tes mots de passe admin.</Text>
      </Flex>

      <Card>
        <Flex direction="column" gap="4">
          <Heading size="4">Générer un hash de mot de passe</Heading>
          <Text size="2" color="gray">
            Au lieu de stocker ton mot de passe en clair dans <Badge variant="outline">ADMIN_CREDENTIALS</Badge>,
            génère un hash ici et utilise-le à la place.
          </Text>

          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">Mot de passe</Text>
            <Flex gap="2">
              <TextField.Root
                type="password"
                placeholder="Ton mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ flex: 1 }}
                onKeyDown={(e) => e.key === "Enter" && password.length >= 6 && generateHash()}
              />
              <Button disabled={password.length < 6 || loading} onClick={generateHash}>
                {loading ? "Génération…" : "Générer"}
              </Button>
            </Flex>
          </Flex>

          {result && (
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold" color="green">Hash généré ✓</Text>
              <Callout.Root color="green" size="1">
                <Callout.Text style={{ fontFamily: "monospace", wordBreak: "break-all", fontSize: 11 }}>
                  {result}
                </Callout.Text>
              </Callout.Root>
              <Button
                variant="soft"
                size="1"
                style={{ width: "fit-content" }}
                onClick={() => copyToClipboard(result)}
              >
                {copied ? "Copié ✓" : "Copier le hash"}
              </Button>
              <Text size="1" color="gray">
                Dans ton <Badge variant="outline">.env.local</Badge> sur le serveur :
              </Text>
              <Callout.Root size="1">
                <Callout.Text style={{ fontFamily: "monospace", fontSize: 11 }}>
                  ADMIN_CREDENTIALS=admin@vokx.org:{result}
                </Callout.Text>
              </Callout.Root>
              <Text size="1" color="gray">
                Puis redémarre le container : <Badge variant="outline">docker compose up -d admin</Badge>
              </Text>
            </Flex>
          )}
        </Flex>
      </Card>

      <Card>
        <Flex direction="column" gap="3">
          <Heading size="4">Format de ADMIN_CREDENTIALS</Heading>
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold" color="gray">Un seul admin :</Text>
            <Callout.Root size="1"><Callout.Text style={{ fontFamily: "monospace", fontSize: 11 }}>ADMIN_CREDENTIALS=admin@vokx.org:scrypt:salt:hash</Callout.Text></Callout.Root>
            <Text size="2" weight="bold" color="gray">Plusieurs admins (séparés par virgule) :</Text>
            <Callout.Root size="1"><Callout.Text style={{ fontFamily: "monospace", fontSize: 11 }}>ADMIN_CREDENTIALS=admin@vokx.org:scrypt:salt1:hash1,mod@vokx.org:scrypt:salt2:hash2</Callout.Text></Callout.Root>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
