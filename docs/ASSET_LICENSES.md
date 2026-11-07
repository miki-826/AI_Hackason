# Asset licenses

| Asset | Source | License / notes |
|---|---|---|
| BGM `public/audio/bgm-house-at-evening.mp4` ("A House at Evening") | Provided by the project owner (`追加資料/`) | Owner-provided; confirm redistribution rights before public release |
| Title background `public/images/title-bg.jpg` | Generated with ChatGPT image generation (Codex CLI) for this project | Generated for this project |
| Manual illustrations `public/images/manual/*.jpg` | Generated with ChatGPT image generation (Codex CLI) | Generated for this project |
| Textures `public/textures/*.jpg` (floor, wallpaper, wood, memory wallpaper) | Generated with ChatGPT image generation, made tileable and compressed locally | Generated for this project |
| 3D furniture, room, actors | Built from three.js primitives in `src/components/game/furniture`, `src/components/memory` | Project code (original) |
| Ambience and sound effects | Synthesised with WebAudio in `src/lib/audio/audioEngine.ts` | Project code (original) |
| Voice | Browser Web Speech API, or OpenAI TTS when `OPENAI_TTS_MODEL` is set | Generated at runtime |
| Fonts: Shippori Mincho B1, Zen Kaku Gothic New | Google Fonts via `next/font` | SIL Open Font License 1.1 |
| Concept images in `イメージ資料/` | Provided by the project owner (reference only, not shipped) | Owner-provided |
