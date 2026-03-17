"use server";

import { getScopedUser } from "@/lib/auth";
import { createPerson, deletePersonRequest, updatePersonApproved } from "@/lib/database/hr/people";

export async function approveMember(id: string) {
  await getScopedUser("hr.people.approve");
  await updatePersonApproved(id);
}

export async function rejectMember(id: string) {
  await getScopedUser("hr.people.approve");
  await deletePersonRequest(id);
}

export async function inviteMember(name: string, email: string, reason: string) {
  const requestee = await getScopedUser("hr.people.create");
  await createPerson(name, email, reason, requestee);
}
