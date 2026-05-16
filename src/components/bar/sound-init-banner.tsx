"use client";

import { useState } from "react";
import { initAudioContext } from "@/lib/sound";

export function SoundInitBanner() {
  const [dismissed, setDismissed] = useState(false);

  const handleClick = async () => {
    await initAudioContext();
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-amber-900/80 border border-amber-600 text-amber-200 text-sm px-4 py-2 text-center hover:bg-amber-800/80 transition-colors"
    >
      🔔 Klicke hier, um Sound-Benachrichtigungen zu aktivieren
    </div>
  );
}
