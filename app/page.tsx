"use client";

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button, Callout, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";

function LoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (process.env.NEXT_PUBLIC_AUTH_TYPE === "none") {
    return (
      <Button size="3" color="ruby" onClick={() => router.push("/panel")} style={{ width: "100%" }}>
        Accéder au panel
      </Button>
    );
  }

  if (status === "authenticated") {
    return (
      <Flex direction="column" gap="3">
        <Text align="center" color="gray" size="2">Connecté en tant que {session.user?.email}</Text>
        <Button size="3" onClick={() => router.push("/panel")} style={{ width: "100%" }}>
          Accéder au panel
        </Button>
      </Flex>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const callbackUrl = params.get("callbackUrl") ?? "/panel";
    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        {error && (
          <Callout.Root color="red" size="1">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}
        <Flex direction="column" gap="2">
          <Text size="2" weight="bold">Email</Text>
          <TextField.Root
            type="email"
            placeholder="admin@vokx.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </Flex>
        <Flex direction="column" gap="2">
          <Text size="2" weight="bold">Mot de passe</Text>
          <TextField.Root
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Flex>
        <Button
          type="submit"
          size="3"
          disabled={loading || !email || !password}
          style={{ width: "100%" }}
        >
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
      </Flex>
    </form>
  );
}

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--gray-1)",
      }}
    >
      <Card style={{ width: 380, padding: "32px" }}>
        <Flex direction="column" gap="6">
          <Flex direction="column" align="center" gap="2">
            <Image src="/wide.svg" width={140} height={20} alt="Vokx" />
            <Heading size="4" align="center">Admin Panel</Heading>
            <Text size="2" color="gray" align="center">
              Connexion réservée à l'équipe de modération
            </Text>
          </Flex>

          <Suspense>
            <LoginForm />
          </Suspense>
        </Flex>
      </Card>
    </main>
  );
}
