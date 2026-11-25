import type { Metadata } from "next";
import { Cormorant_Garamond, Figtree } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Fräulein Franken – Geschenke für dich",
  description: "Warenverwaltung und Rechnungsstellung für Kleingewerbe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${figtree.variable} ${cormorant.variable}`}>
      <body className="antialiased min-h-screen">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
