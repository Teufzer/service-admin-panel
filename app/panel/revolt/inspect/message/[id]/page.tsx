import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { fetchStrikes } from "@/lib/database/revolt/safety_strikes";
import { fetchUserById } from "@/lib/database/revolt/users";
import { col } from "@/lib/db";
import { Badge, Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ModerationActions } from "./ModerationActions";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Signalement ${id.slice(-6)} — Message` };
}

export default async function MessageInspect({ params }: Props) {
  const { id } = await params;
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  const report = await col("safety_reports").findOne({ _id: id } as any) as any;
  if (!report) notFound();

  const snapshot = await col("safety_snapshots").findOne({ report_id: id } as any) as any;

  const content = snapshot?.content;
  const priorContext: any[] = content?._prior_context ?? [];
  const leadingContext: any[] = content?._leading_context ?? [];

  const authorId: string | undefined = content?.author;
  const allAuthorIds = [
    authorId,
    ...priorContext.map((m: any) => m.author),
    ...leadingContext.map((m: any) => m.author),
  ].filter(Boolean);

  const uniqueAuthorIds = [...new Set(allAuthorIds)] as string[];
  const userDocs = uniqueAuthorIds.length
    ? await col("users")
        .find({ _id: { $in: uniqueAuthorIds } } as any, {
          projection: { _id: 1, username: 1, discriminator: 1, flags: 1 },
        })
        .toArray()
    : [];

  const usernameMap = Object.fromEntries(
    userDocs.map((u: any) => [u._id, `${u.username}#${u.discriminator}`])
  );

  const authorUser = authorId ? userDocs.find((u: any) => u._id === authorId) as any : null;
  const authorStrikes = authorId ? await fetchStrikes(authorId) : [];

  const statusColor = (s?: string) =>
    s === "Resolved" ? "green" : s === "Rejected" ? "gray" : "orange";

  function MessageBubble({
    msg,
    highlighted = false,
  }: {
    msg: any;
    highlighted?: boolean;
  }) {
    return (
      <Flex
        direction="column"
        gap="1"
        p="2"
        style={{
          borderRadius: "6px",
          background: highlighted
            ? "var(--red-3)"
            : "var(--gray-2)",
          border: highlighted ? "1px solid var(--red-6)" : "1px solid transparent",
        }}
      >
        <Flex align="center" gap="2">
          {highlighted && (
            <Badge color="red" size="1">
              Signalé
            </Badge>
          )}
          <Link href={`/panel/revolt/inspect/user/${msg.author}`}>
            <Text
              size="1"
              weight="bold"
              style={{ color: highlighted ? "var(--red-11)" : "var(--blue-9)" }}
            >
              {usernameMap[msg.author] ?? msg.author?.slice(-6) ?? "Inconnu"}
            </Text>
          </Link>
        </Flex>
        <Text size="2" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {msg.content || (msg.attachments?.length ? `[${msg.attachments.length} pièce(s) jointe(s)]` : "[message vide]")}
        </Text>
        {msg.attachments?.length > 0 && msg.content && (
          <Text size="1" color="gray">
            + {msg.attachments.length} pièce(s) jointe(s)
          </Text>
        )}
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="4" style={{ maxWidth: "800px" }}>
      <Flex direction="column" gap="1">
        <Heading size="6">Inspection du message signalé</Heading>
        <Text color="gray" size="2">
          Rapport ID: {id}
        </Text>
      </Flex>

      {/* Infos du rapport */}
      <Card>
        <Flex direction="column" gap="3">
          <Heading size="4">Détails du signalement</Heading>
          <Flex gap="3" wrap="wrap">
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">Statut</Text>
              <Badge color={statusColor(report.status)}>{report.status || "Created"}</Badge>
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">Raison</Text>
              <Text size="2">{report.content?.report_reason ?? "—"}</Text>
            </Flex>
            {report.additional_context && (
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Contexte additionnel</Text>
                <Text size="2" style={{ fontStyle: "italic" }}>
                  {report.additional_context}
                </Text>
              </Flex>
            )}
          </Flex>
          {report.author_id && (
            <Link
              href={`/panel/revolt/inspect/user/${report.author_id}`}
              style={{ fontSize: "13px", color: "var(--blue-9)" }}
            >
              Auteur du signalement ({report.author_id.slice(-6)}) →
            </Link>
          )}
        </Flex>
      </Card>

      {/* Actions de modération */}
      {authorId && (
        <ModerationActions
          reportId={id}
          reportStatus={report.status ?? "Created"}
          messageId={content?._id ?? report.content?.id ?? ""}
          authorId={authorId}
          authorFlags={authorUser?.flags ?? 0}
          authorStrikes={authorStrikes}
        />
      )}

      {/* Contenu du snapshot */}
      {!snapshot ? (
        <Card>
          <Text color="gray">
            Aucun snapshot disponible pour ce signalement.
          </Text>
        </Card>
      ) : (
        <Card>
          <Flex direction="column" gap="3">
            <Flex align="center" justify="between">
              <Heading size="4">Contenu du message</Heading>
              {content?.channel && (
                <Text size="1" color="gray">
                  Channel: {content.channel}
                </Text>
              )}
            </Flex>

            <Flex direction="column" gap="2">
              {priorContext.length > 0 && (
                <>
                  <Text size="1" color="gray">
                    — {priorContext.length} message(s) de contexte avant —
                  </Text>
                  {priorContext.map((msg: any, i: number) => (
                    <MessageBubble key={i} msg={msg} />
                  ))}
                  <Box style={{ borderTop: "1px solid var(--gray-5)", margin: "4px 0" }} />
                </>
              )}

              {content && <MessageBubble msg={content} highlighted />}

              {leadingContext.length > 0 && (
                <>
                  <Box style={{ borderTop: "1px solid var(--gray-5)", margin: "4px 0" }} />
                  <Text size="1" color="gray">
                    — {leadingContext.length} message(s) de contexte après —
                  </Text>
                  {leadingContext.map((msg: any, i: number) => (
                    <MessageBubble key={i} msg={msg} />
                  ))}
                </>
              )}
            </Flex>
          </Flex>
        </Card>
      )}

      <Link
        href="/panel/reports"
        style={{ fontSize: "13px", color: "var(--gray-10)" }}
      >
        ← Retour aux signalements
      </Link>
    </Flex>
  );
}
