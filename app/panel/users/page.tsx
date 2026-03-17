import { Metadata } from "next";
import { UsersList } from "./UsersList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Utilisateurs — Vokx Admin",
};

export default function UsersPage() {
  return <UsersList />;
}
