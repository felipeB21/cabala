import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 mt-16">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <Link href={"/"} className="flex items-center gap-1">
            <Image
              src={"/cabala.svg"}
              alt="Cábala Logo"
              width={12}
              height={12}
            />
            <span className="text-sm font-medium">Cábala</span>
          </Link>
          <span className="text-xs text-muted-foreground">
            Predicciones de fútbol argentino
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground">
            ¿Querés ser sponsor?
          </span>
          <a
            href="mailto:bolgarfelipe@gmail.com"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            bolgarfelipe@gmail.com
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Buscar
          </Link>
          <Link
            href="/leaderboard"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ranking
          </Link>
          <a
            href="https://cafecito.app/felipebolgar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            ☕ Invitame un cafecito
          </a>
        </div>
      </div>
    </footer>
  );
}
