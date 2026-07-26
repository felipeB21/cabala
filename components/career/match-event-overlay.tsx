"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  playAssistSound,
  playGoalSound,
  playInjurySound,
  playRedCardSound,
} from "@/lib/sfx";

export type MatchEventType = "goal" | "assist" | "redCard" | "injury";

interface EventConfig {
  label: string;
  emoji: string;
  accent: string;
  sound: () => void;
}

const EVENT_CONFIG: Record<MatchEventType, EventConfig> = {
  goal: {
    label: "¡Gol!",
    emoji: "⚽",
    accent: "bg-emerald-600",
    sound: playGoalSound,
  },
  assist: {
    label: "Asistencia",
    emoji: "🎯",
    accent: "bg-secondary",
    sound: playAssistSound,
  },
  redCard: {
    label: "Tarjeta roja",
    emoji: "🟥",
    accent: "bg-destructive",
    sound: playRedCardSound,
  },
  injury: {
    label: "Lesión",
    emoji: "🩹",
    accent: "bg-destructive/80",
    sound: playInjurySound,
  },
};

const EVENT_DURATION_MS = 1600;

interface MatchEventOverlayProps {
  events: MatchEventType[];
  onDone: () => void;
}

export function MatchEventOverlay({ events, onDone }: MatchEventOverlayProps) {
  // No reset effect needed: the parent only mounts this component while
  // `events` is non-empty and unmounts it via `onDone`, so a fresh instance
  // (and a fresh `index` of 0) is guaranteed for every new event batch.
  const [index, setIndex] = useState(0);

  const current = events[index];

  useEffect(() => {
    if (!current) return;
    EVENT_CONFIG[current].sound();

    const timeout = setTimeout(() => {
      if (index + 1 < events.length) {
        setIndex((i) => i + 1);
      } else {
        onDone();
      }
    }, EVENT_DURATION_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, index]);

  if (!current) return null;
  const config = EVENT_CONFIG[current];

  function advance() {
    if (index + 1 < events.length) setIndex((i) => i + 1);
    else onDone();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 cursor-pointer"
      onClick={advance}
    >
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "flex flex-col items-center gap-3 px-10 py-8 rounded-2xl shadow-xl",
          config.accent,
        )}
      >
        <span className="text-6xl">{config.emoji}</span>
        <span className="font-heading text-xl sm:text-2xl font-extrabold text-white text-center">
          {config.label}
        </span>
      </motion.div>
    </motion.div>
  );
}
