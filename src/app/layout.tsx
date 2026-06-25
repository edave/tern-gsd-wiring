import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tern GSD Gen2 Wiring Diagram",
  description:
    "Interactive electrical wiring simulator for the Tern GSD Gen2 (Bosch System 2) — model and verify the Supernova M99 Mini 3 Pro headlight swap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
