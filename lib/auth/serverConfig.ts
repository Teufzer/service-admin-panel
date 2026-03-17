import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Parse ADMIN_CREDENTIALS env var.
 * Format: "email:password,email2:password2"
 */
function getAdmins() {
  return (process.env.ADMIN_CREDENTIALS ?? "")
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(":");
      return { email: pair.slice(0, idx).trim(), password: pair.slice(idx + 1).trim() };
    })
    .filter((a) => a.email && a.password);
}

/**
 * Authentication options
 */
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Panel",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const admins = getAdmins();
        const admin = admins.find(
          (a) => a.email === credentials.email && a.password === credentials.password,
        );
        if (!admin) return null;
        return { id: admin.email, email: admin.email, name: admin.email.split("@")[0] };
      },
    }),
  ],
  session: { strategy: "jwt" },
  jwt: { maxAge: 8 * 60 * 60 }, // 8 hours
  pages: { signIn: "/" },
};
