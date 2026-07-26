"use client";

// Procedural 8-bit style sound effects via the Web Audio API — no external
// audio files. Every sound is a short sequence of square/triangle-wave
// beeps, which is how most real 8-bit game SFX are synthesized anyway.

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioContext = new Ctor();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

interface Note {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

function playNotes(notes: Note[]) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = note.type ?? "square";
    osc.frequency.value = note.freq;

    const startTime = now + note.start;
    const endTime = startTime + note.duration;
    const peakGain = note.gain ?? 0.15;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(endTime + 0.02);
  }
}

export function playGoalSound() {
  playNotes([
    { freq: 523.25, start: 0, duration: 0.12 },
    { freq: 659.25, start: 0.1, duration: 0.12 },
    { freq: 783.99, start: 0.2, duration: 0.12 },
    { freq: 1046.5, start: 0.3, duration: 0.35, gain: 0.2 },
  ]);
}

export function playAssistSound() {
  playNotes([
    { freq: 587.33, start: 0, duration: 0.1 },
    { freq: 783.99, start: 0.09, duration: 0.22, gain: 0.18 },
  ]);
}

export function playRedCardSound() {
  playNotes([
    { freq: 220, start: 0, duration: 0.2, type: "sawtooth", gain: 0.15 },
    { freq: 174.61, start: 0.18, duration: 0.35, type: "sawtooth", gain: 0.18 },
  ]);
}

export function playSaveSound() {
  playNotes([
    { freq: 180, start: 0, duration: 0.1, type: "triangle", gain: 0.18 },
    { freq: 140, start: 0.08, duration: 0.15, type: "sawtooth", gain: 0.12 },
  ]);
}

export function playMissSound() {
  playNotes([
    { freq: 392, start: 0, duration: 0.14, type: "sawtooth", gain: 0.14 },
    { freq: 261.63, start: 0.12, duration: 0.28, type: "sawtooth", gain: 0.12 },
  ]);
}

export function playInjurySound() {
  playNotes([
    { freq: 293.66, start: 0, duration: 0.18, type: "sine", gain: 0.14 },
    { freq: 246.94, start: 0.15, duration: 0.22, type: "sine", gain: 0.12 },
    { freq: 196, start: 0.32, duration: 0.4, type: "sine", gain: 0.1 },
  ]);
}

export function playWhistleSound() {
  playNotes([{ freq: 1568, start: 0, duration: 0.15, type: "triangle", gain: 0.1 }]);
}

export function playLevelUpSound() {
  playNotes([
    { freq: 523.25, start: 0, duration: 0.08 },
    { freq: 659.25, start: 0.07, duration: 0.08 },
    { freq: 783.99, start: 0.14, duration: 0.08 },
    { freq: 1046.5, start: 0.21, duration: 0.2, gain: 0.18 },
  ]);
}

export function playClickSound() {
  playNotes([{ freq: 440, start: 0, duration: 0.05, gain: 0.08 }]);
}
