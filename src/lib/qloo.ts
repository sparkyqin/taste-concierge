// src/lib/qloo.ts — Qloo Taste AI client (hackathon base URL)
// Doc: https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide
// Auth: X-Api-Key header. GET-only. No /recommendations (legacy, off-limits).

const BASE = "https://hackathon.api.qloo.com";

export type EntityType =
  | "urn:entity:artist"
  | "urn:entity:book"
  | "urn:entity:brand"
  | "urn:entity:destination"
  | "urn:entity:movie"
  | "urn:entity:person"
  | "urn:entity:place"
  | "urn:entity:podcast"
  | "urn:entity:tv_show"
  | "urn:entity:video_game";

export interface QlooEntity {
  id?: string;
  name?: string;
  type?: string;
  [k: string]: unknown;
}

export interface QlooClient {
  search(query: string, opts?: { type?: string; limit?: number }): Promise<QlooEntity[]>;
  insights(opts: {
    filterType: EntityType;
    entities?: string[];   // entity ids from search
    tags?: string[];       // tag ids from /v2/tags
    audiences?: string[];  // demographic audience urns
    limit?: number;
  }): Promise<QlooEntity[]>;
}

export function makeClient(apiKey: string): QlooClient {
  const get = async (path: string, params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE}${path}?${qs}`, {
      headers: { "X-Api-Key": apiKey },
    });
    if (!res.ok) {
      throw new Error(`Qloo ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    return res.json();
  };

  return {
    async search(query, opts = {}) {
      const params: Record<string, string> = { q: query };
      if (opts.type) params["filter.type"] = opts.type;
      if (opts.limit) params["limit"] = String(opts.limit);
      const data = await get("/search", params);
      return (data.entities ?? data.results ?? []) as QlooEntity[];
    },
    async insights({ filterType, entities, tags, audiences, limit }) {
      const params: Record<string, string> = { "filter.type": filterType };
      if (entities?.length) params["signal.interests.entities"] = entities.join(",");
      if (tags?.length) params["signal.interests.tags"] = tags.join(",");
      if (audiences?.length) params["signal.demographics.audiences"] = audiences.join(",");
      if (limit) params["take"] = String(limit);
      const data = await get("/v2/insights", params);
      return (data.entities ?? []) as QlooEntity[];
    },
  };
}
