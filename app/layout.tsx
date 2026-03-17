import { ClientAuthProvider } from "@/lib/auth/clientProvider";
import { ClientQueryProvider } from "@/lib/query/queryProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Head from "next/head";

import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vokx Admin Panel",
  description: "Outils de gestion et de modération de la plateforme Vokx.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientAuthProvider>
      <ClientQueryProvider>
        <html lang="en" className={inter.variable}>
          <Head>
            <meta name="darkreader-lock" />
          </Head>
          <body>
            <Theme appearance="dark" panelBackground="solid">
              {children}
            </Theme>
          </body>
        </html>
      </ClientQueryProvider>
    </ClientAuthProvider>
  );
}
