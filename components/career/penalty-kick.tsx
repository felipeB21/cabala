"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  resolvePenaltyKick,
  type PenaltyKeeperState,
  type PenaltyOutcome,
} from "@/lib/career";
import {
  playGoalSound,
  playMissSound,
  playSaveSound,
  playWhistleSound,
} from "@/lib/sfx";

interface PenaltyKickGameProps {
  keeper: PenaltyKeeperState;
  onResolve: (outcome: PenaltyOutcome) => void;
}

const FRAME_LEFT = 20;
const FRAME_TOP = 20;
const FRAME_WIDTH = 260;
const FRAME_HEIGHT = 160;
const SPOT = { left: FRAME_LEFT + FRAME_WIDTH / 2, top: FRAME_TOP + FRAME_HEIGHT + 30 };
const IDLE_KEEPER = { left: FRAME_LEFT + FRAME_WIDTH / 2, top: FRAME_TOP + FRAME_HEIGHT * 0.55 };

// Ball reaches its target, then a brief hit-stop beat holds before the
// outcome (sound/shake/banner) reveals — the "moment of impact" pause.
const FLIGHT_S = 0.42;
const HIT_STOP_MS = 130;
const RESULT_HOLD_MS = 1100;

function toPosition(x: number, y: number) {
  return {
    left: FRAME_LEFT + x * FRAME_WIDTH,
    top: FRAME_TOP + (1 - y) * FRAME_HEIGHT,
  };
}

// Feedback scales with the outcome's importance — a goal gets the full
// treatment (biggest shake, squash-and-stretch, a burst), a save is medium,
// a wide shot barely registers.
const SHAKE_AMPLITUDE: Record<PenaltyOutcome, number> = {
  goal: 9,
  save: 5,
  wide: 2,
};

function shakeKeyframes(amplitude: number) {
  return [0, -amplitude, amplitude * 0.8, -amplitude * 0.45, amplitude * 0.25, 0];
}

const RESULT_CONFIG: Record<
  PenaltyOutcome,
  { label: string; sound: () => void; flash: string }
> = {
  goal: { label: "¡GOOOL!", sound: playGoalSound, flash: "rgba(59,109,17,0.35)" },
  save: { label: "¡ATAJADA!", sound: playSaveSound, flash: "rgba(255,255,255,0.2)" },
  wide: { label: "¡AFUERA!", sound: playMissSound, flash: "rgba(156,59,46,0.25)" },
};

type Phase = "aiming" | "flying" | "result";

export function PenaltyKickGame({ keeper, onResolve }: PenaltyKickGameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("aiming");
  const [aim, setAim] = useState<{ x: number; y: number } | null>(null);
  const [outcome, setOutcome] = useState<PenaltyOutcome | null>(null);

  function handleAim(e: React.PointerEvent<HTMLDivElement>) {
    if (phase !== "aiming") return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(
      Math.max(1 - (e.clientY - rect.top) / rect.height, 0),
      1,
    );

    playWhistleSound();
    setAim({ x, y });
    setPhase("flying");

    const resolved = resolvePenaltyKick(x, y, keeper);
    setTimeout(() => {
      // Hit-stop: the ball has visually arrived — hold on the freeze-frame
      // for a beat before the sound/shake/banner sell the impact.
      setTimeout(() => {
        setOutcome(resolved);
        setPhase("result");
        RESULT_CONFIG[resolved].sound();
        setTimeout(() => onResolve(resolved), RESULT_HOLD_MS);
      }, HIT_STOP_MS);
    }, FLIGHT_S * 1000);
  }

  const ballTarget = aim ? toPosition(aim.x, aim.y) : SPOT;
  const keeperTarget =
    phase === "aiming" ? IDLE_KEEPER : toPosition(keeper.diveX, keeper.diveY);
  const diveLean =
    phase === "aiming" ? 0 : Math.max(-1, Math.min(1, keeper.diveX - 0.5)) * 55;

  const shakeX =
    phase === "result" && outcome ? shakeKeyframes(SHAKE_AMPLITUDE[outcome]) : 0;
  const ballPop =
    phase === "result" && outcome === "goal" ? [1, 1.45, 0.85, 1] : 1;
  const keeperPop =
    phase === "result" && outcome === "save" ? [1, 1.3, 0.9, 1] : 1;

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4 px-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 32%, rgba(0,0,0,0.35), rgba(0,0,0,0.88)), repeating-linear-gradient(to right, rgba(24,64,32,0.9) 0px, rgba(24,64,32,0.9) 40px, rgba(18,52,26,0.9) 40px, rgba(18,52,26,0.9) 80px)",
      }}
    >
      <p className="font-heading text-sm font-bold text-white uppercase tracking-wider">
        ¡Penal!
      </p>

      <motion.div
        className="relative"
        animate={{ x: shakeX }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ width: FRAME_LEFT * 2 + FRAME_WIDTH, height: SPOT.top + 20 }}
      >
        <svg
          className="absolute pointer-events-none"
          style={{ left: FRAME_LEFT, top: FRAME_TOP }}
          width={FRAME_WIDTH}
          height={FRAME_HEIGHT}
          viewBox={`0 0 ${FRAME_WIDTH} ${FRAME_HEIGHT}`}
        >
          <rect width={FRAME_WIDTH} height={FRAME_HEIGHT} fill="#173322" />
          {Array.from({ length: 14 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 20}
              y1={0}
              x2={i * 20}
              y2={FRAME_HEIGHT}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 20}
              x2={FRAME_WIDTH}
              y2={i * 20}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth={1}
            />
          ))}
        </svg>

        <div
          ref={frameRef}
          onPointerDown={handleAim}
          className={cn(
            "absolute border-t-[8px] border-l-[8px] border-r-[8px] border-white/90",
            phase === "aiming" ? "cursor-crosshair" : "cursor-default",
          )}
          style={{
            left: FRAME_LEFT,
            top: FRAME_TOP,
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
          }}
        />

        <div
          className="absolute w-1.5 h-1.5 rounded-full bg-white/70 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: SPOT.left, top: SPOT.top }}
        />

        <motion.div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          animate={{
            left: keeperTarget.left,
            top: keeperTarget.top,
            rotate: diveLean,
            scale: keeperPop,
          }}
          transition={{
            left: { duration: phase === "aiming" ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] },
            top: { duration: phase === "aiming" ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] },
            rotate: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: 0.45, times: [0, 0.35, 0.65, 1] },
          }}
        >
          <GoalkeeperFigure />
        </motion.div>

        <motion.div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          animate={{
            left: ballTarget.left,
            top: ballTarget.top,
            rotate: phase === "aiming" ? 0 : 900,
            scale: ballPop,
          }}
          transition={{
            left: { duration: phase === "aiming" ? 0 : FLIGHT_S, ease: [0.16, 1, 0.3, 1] },
            top: { duration: phase === "aiming" ? 0 : FLIGHT_S, ease: [0.16, 1, 0.3, 1] },
            rotate: { duration: FLIGHT_S, ease: "linear" },
            scale: { duration: 0.5, times: [0, 0.3, 0.6, 1] },
          }}
        >
          <BallFigure />
        </motion.div>

        {phase === "result" && outcome === "goal" && (
          <GoalBurst originLeft={ballTarget.left} originTop={ballTarget.top} />
        )}

        <AnimatePresence>
          {phase === "result" && outcome && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ backgroundColor: RESULT_CONFIG[outcome].flash }}
            >
              <span className="font-heading text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
                {RESULT_CONFIG[outcome].label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {phase === "aiming" && (
        <p className="text-[12px] text-white/70">Tocá donde querés patear</p>
      )}
    </div>
  );
}

function GoalBurst({ originLeft, originTop }: { originLeft: number; originTop: number }) {
  const [particles, setParticles] = useState<
    { angle: number; distance: number; delay: number }[]
  >([]);

  useEffect(() => {
    // Math.random() is inherently impure, so it can't live in a render-time
    // computation (useMemo) — this component only ever mounts fresh (when
    // the "goal" outcome first reveals), so a one-time effect is safe here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(
      Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
        const distance = 28 + Math.random() * 24;
        return { angle, distance, delay: Math.random() * 0.05 };
      }),
    );
  }, []);

  return (
    <>
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute text-sm pointer-events-none"
          style={{ left: originLeft, top: originTop }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: 0.4,
          }}
          transition={{ duration: 0.6, delay: p.delay, ease: "easeOut" }}
        >
          ✨
        </motion.span>
      ))}
    </>
  );
}

function BallFigure() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#f6f1e6" stroke="#12141c" strokeWidth="1" />
      <path d="M12 6 L15.5 8.5 L14.2 12.8 L9.8 12.8 L8.5 8.5 Z" fill="#12141c" />
      <path
        d="M12 6 L8.5 8.5 M12 6 L15.5 8.5 M9.8 12.8 L6.5 15 M14.2 12.8 L17.5 15 M9.8 12.8 L12 18 M14.2 12.8 L12 18"
        stroke="#12141c"
        strokeWidth="0.8"
        fill="none"
      />
    </svg>
  );
}

function GoalkeeperFigure() {
  return (
    <svg viewBox="0 0 40 56" width="34" height="48" aria-hidden="true">
      <circle cx="20" cy="10" r="8" fill="var(--foreground)" />
      <rect x="10" y="18" width="20" height="26" rx="6" fill="var(--secondary)" />
      <rect
        x="-2"
        y="20"
        width="16"
        height="8"
        rx="4"
        fill="var(--secondary)"
        transform="rotate(-25 6 24)"
      />
      <rect
        x="26"
        y="20"
        width="16"
        height="8"
        rx="4"
        fill="var(--secondary)"
        transform="rotate(25 34 24)"
      />
      <rect x="12" y="42" width="7" height="12" rx="3" fill="var(--foreground)" />
      <rect x="21" y="42" width="7" height="12" rx="3" fill="var(--foreground)" />
    </svg>
  );
}
