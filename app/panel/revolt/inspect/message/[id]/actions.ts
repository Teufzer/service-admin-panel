"use server";

import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { col } from "@/lib/db";

export async function deleteReportedMessage(messageId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await col("messages").deleteOne({ _id: messageId } as any);
}

export async function resolveReport(reportId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await col("safety_reports").updateOne(
    { _id: reportId } as any,
    { $set: { status: "Resolved", closed_at: new Date().toISOString() } } as any
  );
}

export async function rejectReport(reportId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await col("safety_reports").updateOne(
    { _id: reportId } as any,
    { $set: { status: "Rejected", closed_at: new Date().toISOString() } } as any
  );
}
