# Taste Concierge 🎬🍽️🎵🎁

**Three answers in, one culturally coherent evening out — powered by the Qloo taste graph.**

Most agents answer well. Taste Concierge *knows what people like*: it maps a
3-question interview to Qloo's taste-graph entities (250M+), then chains
insights across dining, film, music and retail to compose an evening that
fits **that person** — not the charts.

## Why this isn't "an LLM with extra steps"

An LLM alone recommends *popular* things. Taste Concierge recommends
*that person's* things:

1. **Interview → entities.** Your answers ("Studio Ghibli, Radiohead") are
   resolved to real taste-graph entities via Qloo `/search`.
2. **Cross-domain chaining.** Each slot's `/v2/insights` call is seeded by
   your entities — and the playlist is additionally seeded by the chosen
   *film*, so the music follows the night's centerpiece. That's cultural
   coherence, not four independent top-10s.
3. **Provenance on every pick.** Each card shows *why* it was chosen (which
   affinities connected it). No black-box recommendations.
4. **A live feedback loop.** Dismiss any pick — the plan recomposes instantly
   with the rejection recorded in your entity profile. Negative signals are
   first-class.

Remove Qloo and the product collapses: without the taste graph there is no
entity affinity, no cross-domain coherence, and no grounding — just generic
popular answers.

## Run it

```bash
# 1. Get a hackathon API key: see the Devpost overview page / docs.qloo.com
# 2. Configure and start
cp .env.example .env        # put your key in QLOO_API_KEY
npx vercel dev              # local dev server
```

Deploy:

```bash
npx vercel --prod           # set QLOO_API_KEY in the Vercel dashboard
```

## Architecture

```
index.html          the interview UI + plan cards (zero-framework, fast)
api/plan.ts         serverless endpoint: the agent loop
src/lib/qloo.ts     Qloo client (X-Api-Key, GET-only, hackathon base URL)
src/lib/agent.ts    the pipeline: mapAnswersToEntities → composeEvening
                    → recomposeWithRejection (the negative-feedback loop)
```

The agent pipeline is deliberately small and inspectable — every Qloo call
and every affinity decision can be traced in the code.

## Hackathon

Built for the [Qloo Agentic Hackathon](https://qloo.devpost.com/).
License: MIT.
