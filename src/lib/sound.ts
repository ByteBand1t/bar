"use client";

let audioCtx: AudioContext | null = null;
let notificationBuffer: AudioBuffer | null = null;
let contextStarted = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export async function initAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  contextStarted = true;
}

export function isAudioReady(): boolean {
  return contextStarted && audioCtx?.state === "running";
}

async function loadNotificationBuffer(): Promise<AudioBuffer | null> {
  if (notificationBuffer) return notificationBuffer;
  try {
    const ctx = getAudioContext();
    const res = await fetch("/sounds/notification.mp3");
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    notificationBuffer = await ctx.decodeAudioData(arrayBuffer);
    return notificationBuffer;
  } catch {
    return null;
  }
}

export function getVolume(): number {
  try {
    const v = localStorage.getItem("bar.volume");
    if (v === null) return 0.7;
    const n = parseFloat(v);
    return isNaN(n) ? 0.7 : Math.max(0, Math.min(1, n));
  } catch {
    return 0.7;
  }
}

export function setVolume(v: number) {
  try {
    localStorage.setItem("bar.volume", String(Math.max(0, Math.min(1, v))));
  } catch {}
}

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem("bar.soundEnabled") !== "false";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem("bar.soundEnabled", String(enabled));
  } catch {}
}

export async function playNotification() {
  if (!isSoundEnabled() || !isAudioReady()) return;
  const ctx = getAudioContext();
  const buffer = await loadNotificationBuffer();
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = getVolume();
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}
