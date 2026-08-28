"use client";

import { useEffect, useState } from "react";
import { DESKTOP_MQ } from "@/lib/device";

export function useIsDesktop() {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MQ);
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return desktop;
}
