"use client";

import { motion } from "motion/react";
import { Search, Shirt, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Partidos", href: "/matches", icon: Swords },
  { label: "Carrera", href: "/career", icon: Shirt },
  { label: "Ranking", href: "/leaderboard", icon: Trophy },
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
            <li key={item.label} className="relative">
              <Link
                href={item.href}
                className={`flex items-center gap-1.5 text-sm py-1 transition-colors ${
                  active
                    ? "text-[#f6f1e6] font-medium"
                    : "text-[#f6f1e6]/60 hover:text-[#f6f1e6]"
                }`}
              >
                <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
              {active && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#c9a227] rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
