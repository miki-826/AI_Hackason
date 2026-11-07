# 真実を求めて — Web 3D 脱出ゲーム

窓も扉もない部屋で目覚めた主人公が、家具が見てきた過去を **その物の視点で** 追体験し、
記憶の断片をつなげて真実を解き明かす一人称 3D 脱出ゲーム。仕様は [`仕様書.md`](./仕様書.md)、
イメージは [`イメージ資料/`](./イメージ資料)。

- **Stack:** Next.js 16 (App Router) / React 19 / TypeScript strict / three.js + @react-three/fiber 9 + drei / Zustand / Zod / Tailwind CSS v4 / Vitest
- **Hosting:** Vercel（追加設定なしでデプロイ可能）

## 遊び方

| 操作 | キー |
|---|---|
| 移動 | W A S D（矢印キー可） |
| 視点 | マウス（画面クリックで視点操作を開始） |
| 調べる / 欠片に触れる | E（またはクリック） |
| 手掛かり帳 | J / Tab |
| 一時停止・閉じる | ESC |

1. 部屋の家具（椅子・振り子時計・書斎机は必ずある）に照準を合わせ **E**。
2. 「物の記憶を見る」で、その家具の視点から過去を追体験。琥珀色に光る欠片に触れると手掛かりを得る。
3. 手掛かり帳で記憶をつなげて「解読」。三つの必須の記憶が揃うと東の壁に封印装置が現れる。
4. 4 桁を入力して扉を開き、真実へ。追加の記憶の数でエピローグが変わる。

## 開発

```bash
npm install
cp .env.example .env.local   # SESSION_COOKIE_SECRET を設定
npm run dev                  # http://localhost:3000
npm run typecheck && npm run lint && npm test && npm run build
```

## Vercel へのデプロイ

1. Vercel で GitHub リポジトリを Import（Framework: Next.js、Build: `npm run build` は自動検出）。
2. Environment Variables（Production / Preview）:
   - `SESSION_COOKIE_SECRET` — **必須**。長いランダム文字列（`openssl rand -hex 32`）。未設定でも動作するが、
     開発用の固定鍵になるためセッション改ざんを防げない。
   - `OPENAI_API_KEY` + `OPENAI_MODEL` — 任意。設定すると AI が記憶の語りを生成（失敗時は固定ストーリー）。
   - `DISABLE_AI_GENERATION=true` — AI 費用の緊急停止スイッチ。
3. Deploy。`/api/health` で稼働確認できる。

## アーキテクチャ

```
src/
├─ game-core/          純粋 TypeScript（React/Three/Node 非依存）
│  ├─ definitions/     家具・部屋・ヒント（クライアント公開可）
│  ├─ content/         正解・真相・手掛かり本文（サーバー専用 / ネタバレ）
│  ├─ generation/      Seed → 家具配置（AABB + BFS 導線検証）→ GamePlan
│  ├─ puzzle/          4 桁判定・クルーグラフ検証
│  ├─ rules/           権威的なセッション規則（取得・解読・解除・エンディング）
│  └─ state/           GamePhase 状態機械
├─ lib/server, api/    Route Handlers（/api/v1）・署名付き Cookie セッション・レート制限
├─ lib/ai/             OpenAI Responses API + Structured Outputs + Zod 検証 + 固定フォールバック
├─ stores/gameStore.ts Zustand（画面遷移・進捗イベントのみ。毎フレームの値は ref）
├─ components/game     R3F: 部屋・家具・一人称操作・Raycast・暗転
├─ components/memory   R3F: 記憶の部屋・人物・タイムライン・物の視点カメラ
└─ components/hud, ui  HUD・調査パネル・手掛かり帳・封印装置・エンディング
```

**最重要原則:** AI は語りを変えるが、正解・因果・クリア可能性は変えない。正解 `answer` はサーバー内でのみ比較し、
クライアントへは取得済みの手掛かりだけを返す。AI 出力は Zod + 意味検証を通り、`action` / `actorId` /
`cameraTargetId` / `clueId` は許可リストのみ。字幕はプレーンテキストで描画する。

### セーブデータ

- 進捗は `SessionRecord`（seed・取得手掛かり・解読・試行回数・チェックポイント等）を HMAC-SHA256 署名した
  HttpOnly Cookie（`ts_session`、30 日）に保存。家具配置と GamePlan は seed から決定的に再生成するため保存不要。
- 位置は 20 秒ごと／タブ非表示時に保存（進捗のリビジョンは進めない）。
- 生成済みの記憶はタブ内（sessionStorage）とサーバーのメモリ LRU にキャッシュ。
- 設定は `localStorage`（`ts:settings:v1`）。

### デバッグ用 Seed

`tests/unit/gameCore.test.ts` は 1,000 Seed で必須家具の存在・非重複・導線・クリア可能性を検証する。
特定の配置を調べるには `generateGamePlan("<32桁hex>")` を呼ぶ。

## 既知の制約

- 家具・人物はプリミティブで構成した自作モデル（GLB 差し替え可能な構造）。テクスチャと音はコード生成のため外部素材ライセンスなし（[`docs/ASSET_LICENSES.md`](./docs/ASSET_LICENSES.md)）。
- 仕様の PostgreSQL 永続化は v2.0 では署名付き Cookie に置き換えている（理由は [`docs/ADR/0001-stateless-sessions.md`](./docs/ADR/0001-stateless-sessions.md)）。レート制限はインスタンス単位のメモリ実装。
- PC ブラウザ（Chrome / Edge, WebGL2）向け。スマートフォンの一人称操作は非対応（仕様の非目標）。
- Playwright E2E は未整備（単体・統合テストと手動プレイで検証）。
