import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { checkPermission, flattenPermissionsFor } from "./rbacEngine";

const IS_AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_TYPE === "none";
const OWNER_EMAIL = "owner@vokx.org";

/**
 * Check if the given email is listed in ADMIN_CREDENTIALS.
 * Those users have full ("*") permissions automatically.
 */
function isCredentialAdmin(email: string): boolean {
  return (process.env.ADMIN_CREDENTIALS ?? "")
    .split(",")
    .map((pair) => pair.trim().split(":")[0].trim())
    .includes(email);
}

/**
 * Check whether the currently authorised user has a given scope and return them if such
 * @param scope Required scope
 * @returns User email
 */
export async function getScopedUser(scope: string) {
  if (IS_AUTH_DISABLED) return OWNER_EMAIL;

  const session = await getServerSession();
  if (!session?.user?.email) return redirect("/panel/access-denied");

  const email = session.user.email;

  // Admins defined in ADMIN_CREDENTIALS get full permissions
  if (isCredentialAdmin(email)) return email;

  let permissions: string[];
  try {
    permissions = await flattenPermissionsFor({ email });
  } catch {
    return redirect("/panel/access-denied?missing=account");
  }

  if (!checkPermission(permissions, scope)) {
    console.debug(`${email} rejected, lacking ${scope}`);
    return redirect("/panel/access-denied?missing=" + scope);
  }

  return email;
}

/**
 * Check which of the given scopes are allowed to the given user
 * @param scopes Scopes to check
 * @returns User email and scope information
 */
export async function getUserWithScopes<T extends string>(
  scopes: T[],
): Promise<[string, Record<T, boolean>]> {
  if (IS_AUTH_DISABLED) {
    return [
      OWNER_EMAIL,
      scopes.reduce(
        (r, s) => ({ ...r, [s]: true }),
        {} as Record<T, boolean>,
      ),
    ];
  }

  const session = await getServerSession();
  if (!session?.user?.email) return redirect("/panel/access-denied");

  const email = session.user.email;

  // Admins defined in ADMIN_CREDENTIALS get all scopes
  if (isCredentialAdmin(email)) {
    return [
      email,
      scopes.reduce((r, s) => ({ ...r, [s]: true }), {} as Record<T, boolean>),
    ];
  }

  let permissions: string[];
  try {
    permissions = await flattenPermissionsFor({ email });
  } catch {
    return redirect("/panel/access-denied?missing=account");
  }

  return [
    email,
    scopes.reduce(
      (r, s) => ({ ...r, [s]: checkPermission(permissions, s) }),
      {} as Record<T, boolean>,
    ),
  ];
}

