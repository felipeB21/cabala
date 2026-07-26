"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, Swords, Shirt, Trophy, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Partidos", href: "/matches", icon: Swords },
  { label: "Carrera", href: "/career", icon: Shirt },
  { label: "Ranking", href: "/leaderboard", icon: Trophy },
  { label: "Buscar", href: "/search", icon: Search },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="text-[#f6f1e6] p-1 w-8.5 h-8.5 flex items-center justify-center"
        aria-label="Menú"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="fixed top-16 left-0 right-0 z-50 bg-[#12141c] border-t border-white/10 px-4 py-3 flex flex-col gap-1"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-white/10 text-[#f6f1e6] font-medium"
                        : "text-[#f6f1e6]/70 hover:bg-white/5 hover:text-[#f6f1e6]",
                    )}
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    {item.label}
                  </Link>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
