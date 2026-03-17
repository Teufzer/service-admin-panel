"use server";

import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { col } from "@/lib/db";
import { ulid } from "ulid";

export async function createCase(title: string, notes?: string) {
  const email = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  const id = ulid();
  await col("safety_cases").insertOne({ _id: id, title, notes: notes || "", author: email, status: "Open", category: [] } as any);
  return id;
}

export async function closeCaseAction(id: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await col("safety_cases").updateOne({ _id: id } as any, { $set: { status: "Closed", closed_at: new Date() } } as any);
}

export async function reopenCaseAction(id: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await col("safety_cases").updateOne({ _id: id } as any, { $set: { status: "Open" }, $unset: { closed_at: 1 } } as any);
}

export async function linkReportToCase(reportId: string, caseId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await col("safety_reports").updateOne({ _id: reportId } as any, { $set: { case_id: caseId } } as any);
}

export async function unlinkReportFromCase(reportId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await col("safety_reports").updateOne({ _id: reportId } as any, { $unset: { case_id: 1 } } as any);
}
