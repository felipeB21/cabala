"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

// The one page-load reveal moment used across list views (match feed,
// leaderboard, search results) — a single orchestrated stagger rather than
// scattered per-element effects.
const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

interface StaggerFadeProps {
  children: ReactNode;
  className?: string;
}

export function StaggerFade({ children, className }: StaggerFadeProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerFadeItem({ children, className }: StaggerFadeProps) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
