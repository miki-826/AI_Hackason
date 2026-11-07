"use client";

import Image from "next/image";
import { useEffect } from "react";
import { TitleMenu } from "@/components/ui/TitleMenu";
import { audio } from "@/lib/audio/audioEngine";
import { narrator } from "@/lib/audio/narrator";
import { useGameStore } from "@/stores/gameStore";
import titleBg from "../../../public/images/title-bg.jpg";

export function TitleScreen() {
  // BGM starts on the first interaction (browser autoplay policy) and keeps
  // playing into the game.
  useEffect(() => {
    const voice = () => {
      const { settings } = useGameStore.getState();
      narrator.configure({ enabled: settings.voiceEnabled, volume: settings.voiceVolume * settings.masterVolume });
    };
    voice();
    useGameStore.getState().closeManual();
    const start = () => {
      const { settings } = useGameStore.getState();
      audio.unlock();
      audio.setVolumes({
        master: settings.masterVolume,
        sfx: settings.sfxVolume,
        ambience: settings.ambienceVolume,
        bgm: settings.bgmVolume,
        voice: settings.voiceVolume,
      });
      audio.bgm("title");
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    const unsub = useGameStore.subscribe((s, prev) => {
      if (s.settings !== prev.settings) {
        voice();
        audio.setVolumes({
          master: s.settings.masterVolume,
          sfx: s.settings.sfxVolume,
          ambience: s.settings.ambienceVolume,
          bgm: s.settings.bgmVolume,
          voice: s.settings.voiceVolume,
        });
      }
    });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      unsub();
    };
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-ink">
      <Image
        src={titleBg}
        alt=""
        priority
        placeholder="blur"
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover opacity-90 motion-safe:animate-[kenburns_40s_ease-out_forwards]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(10,14,20,0.25) 0%, rgba(10,14,20,0.55) 55%, rgba(10,14,20,0.9) 100%)" }}
      />
      <div aria-hidden className="grain absolute inset-0 opacity-60" />
      <TitleMenu />
    </main>
  );
}
