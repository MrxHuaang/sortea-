import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "SORTEA | Gran Rifa Familiar",
  description: "Participa por premios increíbles y apoya sueños académicos. Gestión transparente, resultados oficiales y la oportunidad de ganar con tu número de la suerte.",
  keywords: ["rifa", "sorteo", "premios", "causa social", "ingeniería", "lotería"],
  authors: [{ name: "Juan Jose Pantoja" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "SORTEA | Gran Rifa Familiar",
    description: "Elige tus números y participa en nuestro sorteo oficial. ¡Tu apoyo nos ayuda a cumplir metas!",
    type: "website",
    locale: "es_CO",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-white text-gray-900 antialiased min-h-screen selection:bg-zinc-200 transition-colors duration-300`}>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
