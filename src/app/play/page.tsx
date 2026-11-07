import type { Metadata } from "next";
import { Suspense } from "react";
import { GameShell } from "@/components/game/GameShell";

export const metadata: Metadata = { title: "追体験 | 真実を求めて" };

export default function PlayPage() {
  return (
    <Suspense fallback={<main className="fixed inset-0 bg-ink" />}>
      <GameShell />
    </Suspense>
  );
}
