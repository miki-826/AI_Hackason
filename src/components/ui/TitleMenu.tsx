"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/stores/gameStore";
import { ControlsHelp } from "./ControlsHelp";
import { SettingsDialog } from "./SettingsDialog";

/** SC-01: title, start, continue, controls, settings. */
export function TitleMenu() {
  const router = useRouter();
  const { hasSavedGame, controlsOpen, settingsOpen, checkSavedGame, hydrateSettings, toggleControls, openSettings } = useGameStore(
    useShallow((s) => ({
      hasSavedGame: s.hasSavedGame,
      controlsOpen: s.controlsOpen,
      settingsOpen: s.settingsOpen,
      checkSavedGame: s.checkSavedGame,
      hydrateSettings: s.hydrateSettings,
      toggleControls: s.toggleControls,
      openSettings: s.openSettings,
    })),
  );

  useEffect(() => {
    hydrateSettings();
    void checkSavedGame();
  }, [checkSavedGame, hydrateSettings]);

  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
      <h1
        className="font-mincho text-[clamp(3.2rem,11vw,8.5rem)] font-extrabold leading-none tracking-[0.12em] text-transparent motion-safe:animate-[fadein_2.8s_ease-out]"
        style={{
          backgroundImage: "linear-gradient(180deg, #f6efe0 0%, #cfc6b4 42%, #8f8676 58%, #e8dcc4 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          filter: "drop-shadow(0 0 18px rgba(227,197,143,0.25)) drop-shadow(0 4px 2px rgba(0,0,0,0.8))",
        }}
      >
        真実を求めて
      </h1>
      <p className="mt-6 max-w-[30em] font-mincho text-lg leading-relaxed text-parchment/90">
        窓も扉もない部屋で目覚めた。家具たちは、あの夜を覚えている。
      </p>
      <div className="mt-12 flex w-[min(86vw,20rem)] flex-col gap-3">
        <button type="button" className="brass-button py-4 text-2xl tracking-widest" onClick={() => router.push("/play?mode=new")}>
          追体験する
        </button>
        <button
          type="button"
          className="brass-button py-3 text-lg"
          disabled={hasSavedGame !== true}
          aria-describedby={hasSavedGame === false ? "no-save" : undefined}
          onClick={() => router.push("/play?mode=continue")}
        >
          続きから
        </button>
        {hasSavedGame === false ? (
          <p id="no-save" className="text-sm text-mist">
            保存された記録はありません
          </p>
        ) : null}
        <div className="mt-2 flex justify-center gap-6 text-parchment/85">
          <button type="button" className="min-h-11 px-2 underline-offset-4 hover:text-parchment hover:underline" onClick={() => toggleControls(true)}>
            操作説明
          </button>
          <button type="button" className="min-h-11 px-2 underline-offset-4 hover:text-parchment hover:underline" onClick={openSettings}>
            設定
          </button>
        </div>
      </div>
      <p className="absolute bottom-5 text-xs text-mist">PC ブラウザ（Chrome / Edge）推奨・マウスとキーボードで遊びます</p>
      {controlsOpen ? <ControlsHelp /> : null}
      {settingsOpen ? <SettingsDialog /> : null}
    </div>
  );
}
