import Image from "next/image";
import Link from "next/link";
import Navbar from "./navbar";
import Session from "./auth/session";

export default function Header() {
  return (
    <header className="fixed top-0 w-full bg-primary z-80">
      <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="text-xl font-extrabold flex items-center gap-2 text-white"
          >
            <Image
              src="/cabala.svg"
              alt="Cábala Logo"
              width={32}
              height={32}
              className="invert"
            />
            Cábala
          </Link>
          <Navbar />
        </div>
        <Session />
      </div>
    </header>
  );
}
