import { PageTitle } from "@/components/common/navigation/PageTitle";
import { Changelog } from "@/components/core/admin/changelogs/Changelog";
import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import {
  fetchAccountById,
  fetchUserById,
  revoltUserInfo,
} from "@/lib/database/revolt";
import { fetchStrikes } from "@/lib/database/revolt/safety_strikes";
import { col } from "@/lib/db";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";

import { UserCard } from "./UserCard";
import {
  ManageAccount,
  ManageAccountEmail,
  ManageAccountMFA,
} from "./accountManagement";
import { UserStrikes } from "./userManagement";

type Props = { params: Promise<{ id: string }> };

const getUser = cache(async (id: string) => ({
  account: await fetchAccountById(id),
  user: await fetchUserById(id),
}));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { account, user } = await getUser(id);
  if (!account && !user) return { title: "Not Found" };
  return {
    title:
      (user ? `${user.username}#${user.discriminator}` : account!.email) +
      " - Inspect User",
  };
}

export const dynamic = "force-dynamic";

export default async function User({ params }: Props) {
  const { id } = await params;
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  const { account, user } = await getUser(id);
  if (!account && !user) notFound();

  const strikes = await fetchStrikes(id);

  // Fetch user's servers
  const memberDocs = await col("server_members")
    .find({ _id: { $regex: `^${id}` } } as any)
    .limit(50)
    .toArray();
  const serverIds = memberDocs.map((m: any) => {
    const parts = m._id?.split?.(".");
    return parts?.[1] ?? m.server ?? null;
  }).filter(Boolean);

  const serversData = serverIds.length
    ? await col("servers")
        .find({ _id: { $in: serverIds } } as any, {
          projection: { _id: 1, name: 1, owner: 1 },
        })
        .toArray()
    : [];

  // Fetch bots owned by user
  const botsData = await col("bots")
    .find({ owner: id } as any, {
      projection: { _id: 1, username: 1, discriminator: 1 },
    })
    .limit(20)
    .toArray();

  // Fetch reports by user
  const reportsData = await col("safety_reports")
    .find({ author_id: id } as any)
    .sort({ _id: -1 } as any)
    .limit(20)
    .toArray();

  // Friends from user relations
  const friends = (user as any)?.relations
    ?.filter((r: any) => r.status === "Friend")
    .slice(0, 20) ?? [];

  const friendUsers = friends.length
    ? await col("users")
        .find({ _id: { $in: friends.map((f: any) => f._id) } } as any, {
          projection: { _id: 1, username: 1, discriminator: 1 },
        })
        .toArray()
    : [];

  return (
    <>
      <PageTitle
        metadata={{
          title:
            (user
              ? `${user.username}#${user.discriminator}`
              : account!.email) + " - Inspect User",
        }}
      />

      <Grid columns={{ initial: "1", lg: "2", xl: "3" }} gap="2" width="auto">
        {user && (
          <UserCard
            user={revoltUserInfo(user)}
            showProfile
            showActions="short"
          />
        )}

        {account && (
          <Card>
            <Flex direction="column" gap="3">
              <Flex direction="column">
                <Heading size="6">Account Management</Heading>
                <Text color="gray" size="1">
                  Information about this user account and administrative options.
                </Text>
              </Flex>

              <ManageAccount
                id={id}
                attempts={account.lockout?.attempts || 0}
              />

              <Flex direction="column" gap="2">
                <Heading size="2">Email</Heading>
                <ManageAccountEmail
                  id={id}
                  email={account.email}
                  verified={account.verification.status !== "Pending"}
                />
              </Flex>

              <Flex direction="column" gap="2">
                <Heading size="2">Multi-Factor Authentication</Heading>
                <ManageAccountMFA
                  id={id}
                  totp={account.mfa?.totp_token?.status === "Enabled"}
                  recovery={account.mfa?.recovery_codes?.length || 0}
                />
              </Flex>
            </Flex>
          </Card>
        )}

        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Strikes</Heading>
              <Text color="gray" size="1">
                Information about past infractions regarding this user.
              </Text>
            </Flex>
            <UserStrikes
              id={id}
              flags={user?.flags || 0}
              strikes={strikes}
            />
          </Flex>
        </Card>

        {/* Servers */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Servers ({serversData.length})</Heading>
              <Text color="gray" size="1">
                Servers this user is a member of.
              </Text>
            </Flex>
            {serversData.length === 0 ? (
              <Text color="gray" size="2">No servers found.</Text>
            ) : (
              <Flex direction="column" gap="1">
                {serversData.map((s: any) => (
                  <Flex key={s._id} align="center" justify="between" gap="2">
                    <Flex direction="column">
                      <Text size="2" weight="bold">{s.name}</Text>
                      <Text size="1" color="gray">{s._id}</Text>
                    </Flex>
                    <Link href={`/panel/revolt/inspect/server/${s._id}`}>
                      <Button size="1" variant="soft">Voir</Button>
                    </Link>
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Bots */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Bots ({botsData.length})</Heading>
              <Text color="gray" size="1">
                Bots owned by this user.
              </Text>
            </Flex>
            {botsData.length === 0 ? (
              <Text color="gray" size="2">No bots found.</Text>
            ) : (
              <Flex direction="column" gap="1">
                {botsData.map((b: any) => (
                  <Flex key={b._id} align="center" justify="between">
                    <Text size="2">{b.username}#{b.discriminator}</Text>
                    <Text size="1" color="gray">{b._id}</Text>
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Friends */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Friends ({friendUsers.length})</Heading>
              <Text color="gray" size="1">
                Users who are friends with this user.
              </Text>
            </Flex>
            {friendUsers.length === 0 ? (
              <Text color="gray" size="2">No friends found.</Text>
            ) : (
              <Flex direction="column" gap="1">
                {friendUsers.map((f: any) => (
                  <Flex key={f._id} align="center" justify="between" gap="2">
                    <Text size="2">
                      {f.username}#{f.discriminator}
                    </Text>
                    <Link href={`/panel/revolt/inspect/user/${f._id}`}>
                      <Button size="1" variant="soft">Inspecter</Button>
                    </Link>
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Reports */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Reports ({reportsData.length})</Heading>
              <Text color="gray" size="1">
                Reports this user has created.
              </Text>
            </Flex>
            {reportsData.length === 0 ? (
              <Text color="gray" size="2">No reports found.</Text>
            ) : (
              <Flex direction="column" gap="1">
                {reportsData.map((r: any) => (
                  <Flex key={r._id} direction="column" gap="1" pb="2" style={{ borderBottom: "1px solid var(--gray-4)" }}>
                    <Flex align="center" gap="2">
                      <Badge color={r.status === "Resolved" ? "green" : r.status === "Rejected" ? "gray" : "orange"} size="1">
                        {r.status || "Created"}
                      </Badge>
                      <Text size="2">{r.content?.type} — {r.content?.report_reason}</Text>
                    </Flex>
                    {r.additional_context && (
                      <Text size="1" color="gray">{r.additional_context.slice(0, 80)}</Text>
                    )}
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Moderation History */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Moderation History</Heading>
              <Text color="gray" size="1">
                Cases this user has been involved in.
              </Text>
            </Flex>
            <Text color="gray" size="2">No cases found.</Text>
          </Flex>
        </Card>

        {/* Alerts */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Send Alert</Heading>
              <Text color="gray" size="1">
                Send a platform notice to this user via DM.
              </Text>
            </Flex>
            <AlertForm userId={id} />
          </Flex>
        </Card>
      </Grid>

      <Card>
        <Flex direction="column" gap="2">
          <Flex direction="column">
            <Heading size="6">Discuss</Heading>
            <Text color="gray" size="1">
              Recent actions and comments relating to this user.
            </Text>
          </Flex>
          <Changelog object={{ type: "User", id: id }} />
        </Flex>
      </Card>
    </>
  );
}

// Client component for sending platform alerts
import { AlertForm } from "./AlertForm";
