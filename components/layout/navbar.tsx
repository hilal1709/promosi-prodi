"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { IconCompass, IconMenu, IconX } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/kuis", label: "Pilih Jalurmu" },
  { href: "/ruang-kerja/enterprise-system", label: "Ruang Kerja Digital" },
  { href: "/info", label: "Info Prodi" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-primary" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <IconCompass className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            SISFOR UISI
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pilih Jalurmu
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href.split("/").slice(0, 2).join("/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <Button asChild size="sm" variant="accent">
            <a href="https://pmb.uisi.ac.id" target="_blank" rel="noreferrer">
              Daftar Sekarang
            </a>
          </Button>
        </div>

        <button
          className="rounded-full p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Buka menu"
        >
          {open ? <IconX className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild size="sm" variant="accent" className="mt-2">
              <a href="https://pmb.uisi.ac.id" target="_blank" rel="noreferrer">
                Daftar Sekarang
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
