"use client";

import { useEffect, useState } from "react";
import { Button, Flex, Heading, Text, TextField, Badge } from "@radix-ui/themes";

interface Server {
  _id: string;
  name: string;
  description?: string;
  owner?: string;
  flags?: number;
}

export function ServersList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const PER_PAGE = 50;

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/servers?page=${page}&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setServers(data.servers || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Flex direction="column" gap="3">
      <Flex align="center" justify="between" gap="3">
        <Heading size="4">Serveurs ({total.toLocaleString()})</Heading>
        <TextField.Root
          placeholder="Rechercher par nom..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          style={{ width: "300px" }}
        />
      </Flex>

      {loading ? (
        <Text color="gray">Chargement...</Text>
      ) : (
        <Flex direction="column" style={{ border: "1px solid var(--gray-4)", borderRadius: "8px" }}>
          {servers.length === 0 ? (
            <Text p="4" color="gray">Aucun serveur trouvé.</Text>
          ) : servers.map((s) => (
            <Flex
              key={s._id}
              align="center"
              gap="3"
              p="3"
              style={{ borderBottom: "1px solid var(--gray-4)", flexWrap: "wrap" }}
            >
              <Flex direction="column" flexGrow="1" gap="1">
                <Flex align="center" gap="2">
                  <Text weight="bold">{s.name}</Text>
                  {s.flags ? <Badge color="gray">flags: {s.flags}</Badge> : null}
                </Flex>
                <Text size="1" color="gray">ID: {s._id} · Owner: {s.owner || "N/A"}</Text>
                {s.description && (
                  <Text size="1" style={{ opacity: 0.7 }}>{s.description.slice(0, 100)}</Text>
                )}
              </Flex>
              <Flex gap="2">
                <Button size="1" variant="soft" asChild>
                  <a href={`/panel/revolt/inspect/${s.owner}`}>Voir owner</a>
                </Button>
                <Button size="1" variant="soft" color="blue" asChild>
                  <a href={`https://vokx.org/server/${s._id}`} target="_blank">
                    Ouvrir sur Vokx
                  </a>
                </Button>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}

      <Flex gap="2" align="center">
        <Button variant="soft" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Précédent</Button>
        <Text size="2" color="gray">Page {page + 1} / {Math.max(1, Math.ceil(total / PER_PAGE))}</Text>
        <Button variant="soft" disabled={(page + 1) * PER_PAGE >= total} onClick={() => setPage(p => p + 1)}>Suivant →</Button>
      </Flex>
    </Flex>
  );
}
