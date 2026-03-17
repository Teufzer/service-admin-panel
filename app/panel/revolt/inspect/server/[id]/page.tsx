import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { col } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { decodeTime } from "ulid";

import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const server = await col("servers").findOne({ _id: id } as any);
  return { title: server ? `${(server as any).name} - Inspect Server` : "Not Found" };
}

export default async function ServerInspect({ params }: Props) {
  const { id } = await params;
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  const server = await col("servers").findOne({ _id: id } as any) as any;
  if (!server) notFound();

  // Fetch owner
  const owner = await col("users").findOne({ _id: server.owner } as any, {
    projection: { _id: 1, username: 1, discriminator: 1 },
  }) as any;

  // Fetch channels
  const channelDocs = await col("channels")
    .find({ server: id } as any, {
      projection: { _id: 1, name: 1, channel_type: 1 },
    })
    .limit(50)
    .toArray();

  // Fetch members (via server_members collection)
  const memberDocs = await col("server_members")
    .find({ _id: { $regex: `\\.${id}$` } } as any)
    .limit(100)
    .toArray();

  const memberUserIds = memberDocs.map((m: any) => {
    const parts = (m._id as string)?.split?.(".");
    return parts?.[0] ?? null;
  }).filter(Boolean);

  const memberUsers = memberUserIds.length
    ? await col("users")
        .find({ _id: { $in: memberUserIds } } as any, {
          projection: { _id: 1, username: 1, discriminator: 1, flags: 1 },
        })
        .toArray()
    : [];

  const createdAt = (() => {
    try { return new Date(decodeTime(server._id)).toLocaleDateString("fr-FR"); }
    catch { return "Inconnu"; }
  })();

  return (
    <>
      <Flex direction="column" gap="1" mb="4">
        <Heading size="7">{server.name}</Heading>
        <Text color="gray" size="2">ID: {server._id} · Créé le {createdAt}</Text>
        {server.description && (
          <Text size="2" style={{ opacity: 0.8 }}>{server.description}</Text>
        )}
      </Flex>

      <Grid columns={{ initial: "1", lg: "2" }} gap="3">
        {/* Server Info */}
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">Informations</Heading>
            <Flex direction="column" gap="2">
              <Flex justify="between">
                <Text size="2" color="gray">Propriétaire</Text>
                {owner ? (
                  <Link href={`/panel/revolt/inspect/user/${owner._id}`}>
                    <Text size="2" style={{ color: "var(--blue-9)" }}>
                      {owner.username}#{owner.discriminator}
                    </Text>
                  </Link>
                ) : (
                  <Text size="2">{server.owner}</Text>
                )}
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Membres</Text>
                <Text size="2">{memberDocs.length}</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Channels</Text>
                <Text size="2">{channelDocs.length}</Text>
              </Flex>
              {server.flags && (
                <Flex justify="between">
                  <Text size="2" color="gray">Flags</Text>
                  <Badge>{server.flags}</Badge>
                </Flex>
              )}
            </Flex>
            <Flex gap="2" mt="2">
              <Button size="2" variant="soft" color="blue" asChild>
                <a href={`https://vokx.org/server/${server._id}`} target="_blank">
                  Ouvrir sur Vokx
                </a>
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* Channels */}
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">Channels ({channelDocs.length})</Heading>
            {channelDocs.length === 0 ? (
              <Text color="gray" size="2">Aucun channel.</Text>
            ) : (
              <Flex direction="column" gap="1" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {channelDocs.map((c: any) => (
                  <Flex key={c._id} align="center" gap="2">
                    <Badge color="gray" size="1">{c.channel_type}</Badge>
                    <Text size="2">{c.name || c._id}</Text>
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Members */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <Flex direction="column" gap="3">
            <Heading size="5">Membres ({memberUsers.length}{memberDocs.length > 100 ? "+" : ""})</Heading>
            {memberUsers.length === 0 ? (
              <Text color="gray" size="2">Aucun membre trouvé.</Text>
            ) : (
              <Flex wrap="wrap" gap="2">
                {memberUsers.map((u: any) => (
                  <Link key={u._id} href={`/panel/revolt/inspect/user/${u._id}`}>
                    <Badge
                      color={(u.flags ?? 0) & 8 ? "gray" : "blue"}
                      style={{ cursor: "pointer" }}
                    >
                      {u.username}#{u.discriminator}
                    </Badge>
                  </Link>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>
      </Grid>
    </>
  );
}
