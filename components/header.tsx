import Image from "next/image";
import Link from "next/link";
import Navbar from "./navbar";
import MobileMenu from "./mobile-menu";
import Session from "./auth/session";

export default function Header() {
  return (
    <header className="fixed top-0 w-full bg-[#12141c] z-80 min-h-14.25">
      <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="font-heading text-lg font-extrabold flex items-center gap-2 text-[#f6f1e6]"
          >
            <Image src="/icon.svg" alt="Cábala Logo" width={22} height={22} />
            Cábala
          </Link>
          <div className="hidden md:block">
            <Navbar />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Session />
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
