# ADR 0001: Stateless signed-cookie sessions instead of PostgreSQL (v2.0)

- Status: accepted (2026-11-07)

## Context
仕様書 §8 は Supabase PostgreSQL + Drizzle を想定している。ハッカソン提出では、Vercel に
外部 DB なしでそのままデプロイでき、なおかつ「正解はサーバーだけが知る」「他人の進捗を読めない」
「進捗はサーバーが検証する」を守る必要がある。

## Decision
- 進捗は小さな `SessionRecord` として HMAC-SHA256 署名付き HttpOnly Cookie に保存する。
- 家具配置・GamePlan・キャストは seed とバージョン文字列から決定的に再生成する（保存不要）。
- すべての状態遷移はサーバーの純粋関数 `game-core/rules/sessionRules.ts` が検証する。

## Consequences
- + 追加インフラ不要、Preview/Production で同じ挙動、所有権は Cookie で自然に保証。
- − 生成済み AI ストーリーはサーバーのメモリ LRU とクライアントの sessionStorage にしか残らない
  （再生成時は内容が変わり得るが、手掛かり・正解は固定なので進行には影響しない）。
- − 監査ログ・利用量テーブル（§8.1）は未実装。DB 導入時は `SessionRecord` をそのまま行に写像できる。
