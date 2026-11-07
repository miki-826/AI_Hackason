import { CLUE_BY_ID } from "../content/clues";
import { STORY_BIBLE } from "../content/storyBible";
import type { GamePlan } from "../generation/generateGamePlan";
import { isLayoutTraversable } from "../generation/placeFurniture";

export type SolveReport = {
  solvable: boolean;
  problems: string[];
};

/**
 * Static clearability check for a plan (spec 6.2 依存グラフの検証):
 * every required clue has a holder in the room, the dependency graph is
 * acyclic and only points at existing clues, and the room is traversable.
 */
export function analyzePlan(plan: GamePlan): SolveReport {
  const problems: string[] = [];
  for (const id of STORY_BIBLE.requiredClueIds) {
    if (!plan.clueSources[id]) problems.push(`required clue ${id} has no furniture`);
  }
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (id: string, path: string[]): void => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      problems.push(`cycle: ${[...path, id].join(" -> ")}`);
      return;
    }
    const def = CLUE_BY_ID.get(id);
    if (!def) {
      problems.push(`unknown clue ${id}`);
      return;
    }
    visiting.add(id);
    for (const dep of def.relatedClueIds) visit(dep, [...path, id]);
    visiting.delete(id);
    done.add(id);
  };
  for (const id of Object.keys(plan.clueSources)) visit(id, []);
  if (!isLayoutTraversable(plan.furniture)) problems.push("layout not traversable");
  return { solvable: problems.length === 0, problems };
}
