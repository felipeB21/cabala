import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  preload: true,
});

const fontSerif = DM_Sans({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "Cábala — Predicciones de fútbol argentino",
    template: "%s | Cábala",
  },
  description:
    "Predecí los resultados del fútbol argentino, acumulá puntos y competí con todos. Liga Profesional Argentina.",
  keywords: [
    "predicciones fútbol",
    "fútbol argentino",
    "liga profesional argentina",
    "pronosticos futbol",
    "predicciones deportivas",
  ],
  authors: [{ name: "Cábala" }],
  creator: "Cábala",
  metadataBase: new URL("https://cabala.app"), // ← cambiá por tu dominio real
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://cabala.app",
    siteName: "Cábala",
    title: "Cábala — Predicciones de fútbol argentino",
    description:
      "Predecí los resultados del fútbol argentino, acumulá puntos y competí con todos.",
    images: [
      {
        url: "/og-image.png", // creá una imagen 1200x630
        width: 1200,
        height: 630,
        alt: "Cábala — Predicciones de fútbol argentino",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cábala — Predicciones de fútbol argentino",
    description:
      "Predecí los resultados del fútbol argentino, acumulá puntos y competí con todos.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <Header />
        <main className="max-w-5xl mx-auto p-4 my-20">
          <Providers>{children}</Providers>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
