import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaveClean · Entregas",
  description: "Acompanhe sua entrega da LaveClean",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2563EB" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
