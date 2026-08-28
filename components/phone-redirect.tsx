"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/components/use-is-desktop";

export function PhoneRedirect({ to }: { to: string }) {
  const desktop = useIsDesktop();
  const router = useRouter();
  useEffect(() => {
    if (desktop === false) router.replace(to);
  }, [desktop, router, to]);
  return null;
}
