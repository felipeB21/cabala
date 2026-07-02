import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  metadataBase: new URL("https://cabala.ar"),

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
    "pronósticos fútbol",
    "predicciones deportivas",
  ],

  applicationName: "Cábala",

  authors: [
    {
      name: "Felipe Bolgar",
      url: "https://www.linkedin.com/in/felipebolgar/",
    },
  ],

  creator: "Felipe Bolgar",

  category: "Sports",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },

  manifest: "/manifest.json",

  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "Cábala",
    title: "Cábala — Predicciones de fútbol argentino",
    description:
      "Predecí los resultados del fútbol argentino, acumulá puntos y competí con todos.",
  },

  twitter: {
    card: "summary_large_image",
    title: "Cábala — Predicciones de fútbol argentino",
    description:
      "Predecí los resultados del fútbol argentino, acumulá puntos y competí con todos.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Cábala",
              url: "https://cabala.ar",
              description: "Predicciones de fútbol argentino",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://cabala.ar/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <main className="max-w-5xl mx-auto p-4 my-20 flex-1 w-full">
          <Providers>{children}</Providers>
        </main>
        <Footer />
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
