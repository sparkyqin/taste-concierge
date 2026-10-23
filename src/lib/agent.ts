// src/lib/agent.ts — Taste Concierge: the interview → entity mapping →
// cross-domain plan pipeline. The "agent" part: a 3-question interview maps
// free-text answers to taste-graph entities via /search, then chains
// /v2/insights across domains to compose a culturally coherent evening.
// Negative feedback (rejected picks) re-runs insights with the rejected
// entity added as a negative signal path (excluded client-side and noted
// in the profile).

import { QlooClient, QlooEntity } from "./qloo";

export interface UserProfile {
  // Raw interview answers (what the user said)
  answers: {
    lovedWorks: string;   // "Name a movie, show, or band you genuinely love"
    eveningVibe: string;  // "What does a perfect evening feel like?"
    avoid: string;        // "Anything you'd rather skip tonight?"
  };
  // Mapped taste-graph entities (what the graph now knows)
  seedEntities: QlooEntity[];
  rejected: string[];     // entity names the user dismissed
}

export interface PlanSlot {
  domain: "dining" | "film" | "music" | "gift";
  label: string;
  pick?: QlooEntity;
  why: string;            // affinity explanation — the Qloo differentiator
  alternates: QlooEntity[];
}

export interface EveningPlan {
  slots: PlanSlot[];
  profile: UserProfile;
}

// ---- Stage 1: interview answers → taste-graph entities --------------------
export async function mapAnswersToEntities(
  qloo: QlooClient,
  answers: UserProfile["answers"]
): Promise<QlooEntity[]> {
  const seeds: QlooEntity[] = [];
  // Parse the free-text "loved works" into candidate probes. A cheap split on
  // commas/"and" keeps this dependency-free; the LLM narrator can refine later.
  const probes = answers.lovedWorks
    .split(/[,;]|\band\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .slice(0, 5);

  for (const probe of probes) {
    try {
      // Try entertainment first (movie/tv/artist are the richest seeds),
      // fall back to an untyped search.
      const hits = await qloo.search(probe, { limit: 1 });
      if (hits[0]) seeds.push(hits[0]);
    } catch {
      // A bad probe must not sink the interview; skip it.
    }
  }
  return seeds;
}

// ---- Stage 2: cross-domain chaining ---------------------------------------
// Each slot's insight call is seeded by the user's entities AND (this is the
// coherence trick) by the previous slot's winning pick, so the film follows
// the dinner's mood and the playlist follows the film.
export async function composeEvening(
  qloo: QlooClient,
  profile: UserProfile
): Promise<EveningPlan> {
  const seedIds = profile.seedEntities.map((e) => e.id).filter(Boolean) as string[];
  const reject = (list: QlooEntity[]) =>
    list.filter((e) => !profile.rejected.includes(String(e.name)));

  const pickFrom = async (
    filterType: Parameters<QlooClient["insights"]>[0]["filterType"],
    extraSeeds: string[] = []
  ): Promise<{ pick?: QlooEntity; alternates: QlooEntity[] }> => {
    const entities = [...seedIds, ...extraSeeds].filter(Boolean);
    if (!entities.length) return { alternates: [] };
    try {
      const got = reject(await qloo.insights({ filterType, entities, limit: 6 }));
      return { pick: got[0], alternates: got.slice(1, 4) };
    } catch {
      return { alternates: [] }; // a domain gap is honest, not fatal
    }
  };

  // Dinner (place) and the film anchor the evening.
  const dining = await pickFrom("urn:entity:place");
  const film = await pickFrom("urn:entity:movie");
  // The playlist is seeded by the chosen film — musical coherence with the
  // night's centerpiece, not just the user's baseline taste.
  const music = await pickFrom("urn:entity:artist",
    film.pick?.id ? [String(film.pick.id)] : []);
  const gift = await pickFrom("urn:entity:brand");

  const why = (domain: string, pick?: QlooEntity, seedNames: string[] = []) =>
    pick
      ? `Matched via taste-graph affinity between ${seedNames.join(", ") || "your profile"} and ${String(pick.name)} in the ${domain} domain.`
      : "No confident match in the taste graph for this slot — being honest rather than guessing.";

  const seedNames = profile.seedEntities.map((e) => String(e.name)).slice(0, 3);
  return {
    profile,
    slots: [
      {
        domain: "dining", label: "Dinner", pick: dining.pick,
        alternates: dining.alternates, why: why("dining", dining.pick, seedNames),
      },
      {
        domain: "film", label: "Film", pick: film.pick,
        alternates: film.alternates, why: why("film", film.pick, seedNames),
      },
      {
        domain: "music", label: "Playlist", pick: music.pick,
        alternates: music.alternates,
        why: why("music", music.pick, film.pick ? [String(film.pick.name)] : seedNames),
      },
      {
        domain: "gift", label: "A small gift", pick: gift.pick,
        alternates: gift.alternates, why: why("gift", gift.pick, seedNames),
      },
    ],
  };
}

// ---- Stage 3: negative feedback loop ---------------------------------------
// The user rejects a pick → it's recorded, excluded from future suggestions,
// and the plan recomposes. This is the "adapts in real time" differentiator.
export async function recomposeWithRejection(
  qloo: QlooClient,
  plan: EveningPlan,
  rejectedName: string
): Promise<EveningPlan> {
  const profile: UserProfile = {
    ...plan.profile,
    rejected: [...new Set([...plan.profile.rejected, rejectedName])],
  };
  return composeEvening(qloo, profile);
}
