"use client";

import { create } from "zustand";

export interface BarState {
  acceptingOrders: boolean;
  pauseMessage: string | null;
  pauseUntil: string | null;
}

interface LiveState {
  barState: BarState;
  barStateLoaded: boolean;
  /** id -> isAvailable, overrides server-rendered availability when present */
  availability: Record<string, boolean>;
  setBarState: (s: BarState) => void;
  setAvailability: (id: string, isAvailable: boolean) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  barState: { acceptingOrders: true, pauseMessage: null, pauseUntil: null },
  barStateLoaded: false,
  availability: {},
  setBarState: (barState) => set({ barState, barStateLoaded: true }),
  setAvailability: (id, isAvailable) =>
    set((s) => ({ availability: { ...s.availability, [id]: isAvailable } })),
}));
