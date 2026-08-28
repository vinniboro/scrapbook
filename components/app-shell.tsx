"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageShell, cn } from "@/components/ui";

const phoneLinks = [
  { href: "/qr", label: "QR" },
  { href: "/up", label: "Place" },
  { href: "/me", label: "Me" },
];

const desktopLinks = [
  { href: "/today", label: "Today" },
  { href: "/up", label: "Place" },
  { href: "/me", label: "Me" },
  { href: "/qr", label: "Code" },
];

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-11 items-center px-3 text-caption tracking-wide",
        active ? "font-medium" : "font-normal opacity-50",
      )}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <nav className="sticky top-0 z-20 hidden bg-background/90 px-8 py-6 backdrop-blur-md md:block">
        <ul className="mx-auto flex max-w-[95ch] gap-2">
          {desktopLinks.map((link) => (
            <li key={link.href}>
              <NavLink {...link} pathname={pathname} />
            </li>
          ))}
        </ul>
      </nav>
      <PageShell width="prose" className="pb-28 pt-8 md:pb-16 md:pt-4">
        {children}
      </PageShell>
      <nav className="fixed inset-x-0 bottom-4 z-20 px-4 md:hidden">
        <ul className="mx-auto flex max-w-sm justify-around rounded-pill bg-background/90 px-2 py-1 shadow-raised backdrop-blur-md">
          {phoneLinks.map((link) => (
            <li key={link.href}>
              <NavLink {...link} pathname={pathname} />
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
