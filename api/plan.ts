// api/plan.ts — Vercel serverless function: the agent's HTTP surface.
// POST { answers: {lovedWorks, eveningVibe, avoid} }
//   → { plan }   (interview → entities → cross-domain evening)
// POST { plan, reject: "entity name" }
//   → { plan }   (negative-feedback recompose)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { makeClient } from "../src/lib/qloo";
import {
  mapAnswersToEntities, composeEvening, recomposeWithRejection,
  EveningPlan, UserProfile,
} from "../src/lib/agent";

const KEY = process.env.QLOO_API_KEY || "";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!KEY) {
    return res.status(503).json({
      error: "QLOO_API_KEY not configured on the server",
    });
  }

  const qloo = makeClient(KEY);
  try {
    if (req.body?.reject && req.body?.plan) {
      // Negative-feedback loop.
      const plan: EveningPlan = req.body.plan;
      const next = await recomposeWithRejection(qloo, plan, String(req.body.reject));
      return res.status(200).json({ plan: next });
    }

    const answers = req.body?.answers;
    if (!answers?.lovedWorks || !answers?.eveningVibe) {
      return res.status(400).json({ error: "answers.lovedWorks and answers.eveningVibe are required" });
    }
    const profile: UserProfile = {
      answers: {
        lovedWorks: String(answers.lovedWorks),
        eveningVibe: String(answers.eveningVibe),
        avoid: String(answers.avoid ?? ""),
      },
      seedEntities: [],
      rejected: [],
    };
    profile.seedEntities = await mapAnswersToEntities(qloo, profile.answers);
    const plan = await composeEvening(qloo, profile);
    return res.status(200).json({ plan });
  } catch (e) {
    return res.status(500).json({ error: String(e).slice(0, 300) });
  }
}
