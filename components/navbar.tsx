"use client";

import { Search, Swords } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Partidos", href: "/matches", icon: Swords },
  { label: "Buscar", href: "/search", icon: Search },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav>
      <ul className="flex items-center gap-5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`text-muted flex items-center gap-1 text-sm hover:text-white ${
                  active ? "font-bold" : "font-light"
                }`}
              >
                <Icon size={14} strokeWidth={active ? 3 : 2} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
