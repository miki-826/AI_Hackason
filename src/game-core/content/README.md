# game-core/content

Contains spoilers (the seal answer, truth text, clue facts).

* Import ONLY from server code (`src/lib/**`, `src/app/api/**`) and from the
  demo gateway, which is loaded behind `NEXT_PUBLIC_ENABLE_DEMO === "true"`.
* Never import from regular client components.
