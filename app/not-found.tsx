import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto px-4 py-24 flex flex-col items-center text-center gap-4">
      <Image src={"/cabala.svg"} alt="Cábala Logo" width={100} height={100} />
      <h1 className="text-2xl font-extrabold tracking-tight">
        Página no encontrada
      </h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        La página que buscás no existe o fue eliminada.
      </p>
      <Link
        href="/"
        className="mt-2 text-sm font-medium text-blue-600 hover:underline"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
