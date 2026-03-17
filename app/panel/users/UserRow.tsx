"use client";

import { useState } from "react";
import { Button, Flex, Text, Badge } from "@radix-ui/themes";

interface User {
  _id: string;
  username: string;
  discriminator: string;
  display_name?: string;
  badges?: number;
  disabled?: boolean;
  flags?: number;
}

export function UserRow({ user, onAction }: { user: User; onAction: () => void }) {
  const [loading, setLoading] = useState(false);

  async function doAction(action: string) {
    setLoading(true);
    await fetch("/api/users/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, action }),
    });
    setLoading(false);
    onAction();
  }

  const isBanned = user.disabled === true;
  const isDeleted = (user.flags ?? 0) & 8;

  return (
    <Flex
      align="center"
      gap="3"
      p="3"
      style={{ borderBottom: "1px solid var(--gray-4)", flexWrap: "wrap" }}
    >
      <Flex direction="column" flexGrow="1" gap="1">
        <Flex align="center" gap="2">
          <Text weight="bold">{user.display_name || user.username}</Text>
          <Text color="gray" size="2">@{user.username}#{user.discriminator}</Text>
          {isBanned && <Badge color="red">Banni</Badge>}
          {isDeleted ? <Badge color="gray">Supprimé</Badge> : null}
        </Flex>
        <Text size="1" color="gray">{user._id}</Text>
      </Flex>
      <Flex gap="2">
        <Button
          size="1"
          variant="soft"
          asChild
        >
          <a href={`/panel/revolt/inspect/${user._id}`}>Inspecter</a>
        </Button>
        {!isBanned && !isDeleted ? (
          <Button
            size="1"
            color="red"
            variant="soft"
            disabled={loading}
            onClick={() => doAction("ban")}
          >
            Bannir
          </Button>
        ) : isBanned ? (
          <Button
            size="1"
            color="green"
            variant="soft"
            disabled={loading}
            onClick={() => doAction("unban")}
          >
            Débannir
          </Button>
        ) : null}
      </Flex>
    </Flex>
  );
}
