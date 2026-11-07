"use client";

import dynamic from "next/dynamic";
import { TitleMenu } from "@/components/ui/TitleMenu";

const TitleBackdrop = dynamic(() => import("./TitleBackdrop"), { ssr: false });

export function TitleScreen() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-ink">
      <TitleBackdrop />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(10,14,20,0.2) 0%, rgba(10,14,20,0.85) 75%)" }}
      />
      <div aria-hidden className="grain absolute inset-0 opacity-70" />
      <TitleMenu />
    </main>
  );
}
