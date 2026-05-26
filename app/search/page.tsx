import { SearchClient } from "@/components/search";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Buscá usuarios y partidos de fútbol en Cábala.",
};

export default function SearchPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Buscar</h1>
        <p className="text-sm text-muted-foreground">
          Encontrá usuarios y partidos de fútbol
        </p>
      </div>
      <SearchClient />
    </main>
  );
}
