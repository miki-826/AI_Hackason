"use client";

import { useGameStore } from "@/stores/gameStore";
import { Close } from "./icons";

const CONTROL_ROWS: ReadonlyArray<{ keyLabel: string; action: string; detail: string }> = [
  { keyLabel: "WASD", action: "移動", detail: "部屋の中を前後左右に歩きます" },
  { keyLabel: "マウス", action: "視点", detail: "周囲を見回し、調べる対象に照準を合わせます" },
  { keyLabel: "E", action: "調べる", detail: "照準を合わせた家具や装置に触れます" },
  { keyLabel: "J", action: "手掛かり帳", detail: "集めた記憶の断片やヒントを確認・解読します" },
  { keyLabel: "ESC", action: "一時停止 / 閉じる", detail: "視点固定を解除し、開いている画面を閉じます" },
  { keyLabel: "V", action: "読み上げ オン / オフ", detail: "字幕や語りの音声読み上げを切り替えます" },
  { keyLabel: "クリック", action: "視点操作開始", detail: "画面をクリックするとマウスによる視点移動が始まります" },
];

export function ControlsHelp() {
  const toggleControls = useGameStore((s) => s.toggleControls);

  const handleClose = () => toggleControls(false);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="controls-help-title"
        className="brass-panel relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <div className="flex items-center justify-between border-b border-brass-dim/40 pb-4">
          <h2 id="controls-help-title" className="font-mincho text-xl tracking-wider text-brass-bright">
            操作説明
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="操作説明を閉じる"
            className="flex h-11 w-11 items-center justify-center border border-brass-dim/50 bg-night text-parchment transition-colors hover:border-brass hover:text-brass-bright"
          >
            <Close size={18} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-mist">
          キー操作に慣れない場合は、視点固定を解除（ESC）した状態でも画面中央の案内ボタンをクリックして調査できます。
        </p>

        <div className="mt-5 overflow-hidden border border-brass-dim/40 bg-ink/60">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-brass-dim/40 bg-night-2/80 font-mincho text-brass-bright">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-normal">
                  入力
                </th>
                <th scope="col" className="px-4 py-2.5 font-normal">
                  動作
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-normal sm:table-cell">
                  説明
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brass-dim/25">
              {CONTROL_ROWS.map((row) => (
                <tr key={row.keyLabel} className="hover:bg-night/60">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <kbd className="inline-block min-w-14 border border-brass/60 bg-walnut px-2.5 py-1 text-center font-mincho text-sm text-brass-bright">
                      {row.keyLabel}
                    </kbd>
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-parchment">{row.action}</td>
                  <td className="hidden px-4 py-3 text-mist sm:table-cell">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end border-t border-brass-dim/40 pt-4">
          <button type="button" onClick={handleClose} className="brass-button min-h-11 px-6 py-2 text-sm">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
