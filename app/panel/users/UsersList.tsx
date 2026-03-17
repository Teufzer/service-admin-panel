"use client";

import { useEffect, useState } from "react";
import { Button, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { UserRow } from "./UserRow";

interface User {
  _id: string;
  username: string;
  discriminator: string;
  display_name?: string;
  badges?: number;
  disabled?: boolean;
  flags?: number;
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const PER_PAGE = 50;

  async function load() {
    setLoading(true);
    const res = await fetch(
      `/api/users/list?page=${page}&search=${encodeURIComponent(search)}`
    );
    const data = await res.json();
    setUsers(data.users);
    setTotal(data.total);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, search]);

  return (
    <Flex direction="column" gap="3">
      <Flex align="center" justify="between" gap="3">
        <Heading size="4">Utilisateurs ({total.toLocaleString()})</Heading>
        <TextField.Root
          placeholder="Rechercher par username..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          style={{ width: "300px" }}
        />
      </Flex>

      {loading ? (
        <Text color="gray">Chargement...</Text>
      ) : (
        <Flex direction="column" style={{ border: "1px solid var(--gray-4)", borderRadius: "8px" }}>
          {users.length === 0 ? (
            <Text p="4" color="gray">Aucun utilisateur trouvé.</Text>
          ) : (
            users.map((u) => <UserRow key={u._id} user={u} onAction={load} />)
          )}
        </Flex>
      )}

      <Flex gap="2" align="center">
        <Button
          variant="soft"
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
        >← Précédent</Button>
        <Text size="2" color="gray">Page {page + 1} / {Math.ceil(total / PER_PAGE)}</Text>
        <Button
          variant="soft"
          disabled={(page + 1) * PER_PAGE >= total}
          onClick={() => setPage(p => p + 1)}
        >Suivant →</Button>
      </Flex>
    </Flex>
  );
}
