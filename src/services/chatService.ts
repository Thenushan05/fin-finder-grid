const HOTSPOT_LS_KEY = "fishspot_hotspot_scan";

import api from "@/services/api";
import { marketApi } from "@/services/marketApi";

export type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  suggestions?: string[];
  relatedLink?: string;
};

const SYSTEM_PROMPT = `
You are 'Fin', the AI fishing assistant for Ocelyn. 
You help fishermen with hotspots, market trends, species info, and maintenance tips.
Current Capabilities:
- Check Hotspots: "Where to fish today?"
- Market Prices: "Price of Tuna?"
- Weather Safety: "Is it safe to go out?"
- Species Identification: "Identify this fish"
`;

function buildHotspotContext() {
  try {
    const raw = localStorage.getItem(HOTSPOT_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const predsAll: any[] = parsed?.result?.predictions ?? [];
    const preds: any[] = predsAll
      .slice()
      .sort((a: any, b: any) => Number(b?.score ?? 0) - Number(a?.score ?? 0));
    const lowest = predsAll
      .slice()
      .sort(
        (a: any, b: any) => Number(a?.score ?? 0) - Number(b?.score ?? 0),
      )[0];
    return {
      species: parsed?.meta?.species ?? "YFT",
      strongest_prediction: preds[0]
        ? {
            lat: preds[0]?.lat,
            lon: preds[0]?.lon,
            score: preds[0]?.score,
            hotspot_level: preds[0]?.hotspot_level,
            spawn_probability: preds[0]?.spawn_probability,
          }
        : null,
      lowest_prediction: lowest
        ? {
            lat: lowest?.lat,
            lon: lowest?.lon,
            score: lowest?.score,
            hotspot_level: lowest?.hotspot_level,
            spawn_probability: lowest?.spawn_probability,
          }
        : null,
      top_predictions: preds.slice(0, 5).map((p: any) => ({
        lat: p?.lat,
        lon: p?.lon,
        score: p?.score,
        hotspot_level: p?.hotspot_level,
        spawn_probability: p?.spawn_probability,
      })),
    };
  } catch {
    return null;
  }
}

async function buildMarketContext(lowerText: string) {
  const needsMarket =
    lowerText.includes("market") ||
    lowerText.includes("price") ||
    lowerText.includes("sell") ||
    lowerText.includes("cost") ||
    lowerText.includes("trend") ||
    lowerText.includes("eat") ||
    lowerText.includes("tasty") ||
    lowerText.includes("delicious") ||
    lowerText.includes("recommend");

  if (!needsMarket) {
    return null;
  }

  try {
    const summary = await marketApi.summary();
    const species = (summary?.species ?? [])
      .slice()
      .sort((a: any, b: any) => Number(b?.price ?? 0) - Number(a?.price ?? 0))
      .slice(0, 5)
      .map((s: any) => ({
        code: s?.code,
        name: s?.name,
        wow_pct: s?.wow_pct,
        trend: s?.trend,
      }));

    const leader = species[0];
    const overallTrend = leader?.trend ?? null;

    return {
      date: summary?.date ?? null,
      trend: overallTrend,
      top_species: species,
    };
  } catch {
    return null;
  }
}

// Simple keyword-based mock analysis
export async function processUserMessage(text: string): Promise<ChatMessage> {
  const lowerText = text.toLowerCase();
  let responseText =
    "I'm not sure about that. Try asking about fishing hotspots, market prices, or species info.";
  let suggestions: string[] = [];
  let relatedLink: string | undefined = undefined;

  // Try backend LLM agent first with live system context.
  try {
    const hotspotContext = buildHotspotContext();
    const marketContext = await buildMarketContext(lowerText);

    const payload = {
      text,
      context: {
        hotspot_scan: hotspotContext,
        market_summary: marketContext,
      },
    };

    let res: any = null;
    const endpoints = [
      "/api/v1/agent/query-public",
      "/api/v1/agent/chat-public",
      "/api/v1/agent/chat",
      "/api/v1/agent/query",
    ];
    for (const ep of endpoints) {
      try {
        res = await api.post(ep, payload);
        break;
      } catch {
        // try next endpoint variant
      }
    }

    const botText = String(res?.data?.text ?? "").trim();
    if (botText) {
      let relatedLink: string | undefined;
      if (lowerText.includes("market") || lowerText.includes("price")) {
        relatedLink = "/market";
      } else if (lowerText.includes("hotspot") || lowerText.includes("fish")) {
        relatedLink = "/hotspot-map";
      }

      return {
        id: Date.now().toString(),
        sender: "bot",
        text: botText,
        timestamp: new Date(),
        suggestions: [
          "Top hotspot now?",
          "Best market species today?",
          "Safe route recommendation",
        ],
        relatedLink,
      };
    }
  } catch {
    // Fallback to local rules below.
  }

  // 1. Hotspot Queries (local fallback)
  if (
    lowerText.includes("hotspot") ||
    lowerText.includes("where") ||
    lowerText.includes("location") ||
    lowerText.includes("fish today")
  ) {
    try {
      const raw = localStorage.getItem(HOTSPOT_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const preds: any[] = (parsed?.result?.predictions ?? [])
          .slice()
          .sort((a: any, b: any) => b.score - a.score);
        const best = preds[0];
        const species: string = parsed?.meta?.species ?? "fish";
        if (best) {
          responseText = `Based on the latest satellite scan, the best spot for **${species}** is around **${best.lat.toFixed(2)}°N, ${best.lon.toFixed(2)}°E** with **${best.confidence_pct}%** confidence.`;
        } else {
          responseText =
            "No scan data found yet. Run a hotspot scan on the Map page to find the best fishing spots.";
        }
      } else {
        responseText =
          "No scan data found yet. Run a hotspot scan on the Map page to find the best fishing spots.";
      }
    } catch {
      responseText =
        "Could not read scan data. Try running a new scan on the Map page.";
    }
    suggestions = ["Show map", "Check weather there"];
    relatedLink = "/hotspot-map";
  }

  // 2. Weather/Safety
  else if (
    lowerText.includes("weather") ||
    lowerText.includes("safe") ||
    lowerText.includes("wind") ||
    lowerText.includes("rain")
  ) {
    responseText =
      "Current conditions show moderate winds (15km/h) in the northern sectors. It is generally **Safe** for vessels > 20ft. Be cautious of afternoon squalls.";
    suggestions = ["Detailed forecast", "Route safety check"];
    relatedLink = "/hotspot-map"; // Assuming map has weather
  }

  // 3. Market/Price
  else if (
    lowerText.includes("price") ||
    lowerText.includes("market") ||
    lowerText.includes("cost") ||
    lowerText.includes("sell")
  ) {
    responseText =
      "Check the Market page for trend direction, week-over-week percentage change, and demand signals.";
    suggestions = ["See full market trend", "Check Tuna momentum"];
    relatedLink = "/market";
  }

  // 4. Species
  else if (
    lowerText.includes("species") ||
    lowerText.includes("identify") ||
    lowerText.includes("what fish")
  ) {
    responseText =
      "I can help identify catches. Upload a photo on the Species page or describe the fish (color, fin shape).";
    suggestions = ["Go to Identifier", "Browse Library"];
    relatedLink = "/species";
  }

  // 5. Maintenance
  else if (
    lowerText.includes("maintenance") ||
    lowerText.includes("repair") ||
    lowerText.includes("engine")
  ) {
    responseText =
      "Don't forget to log your daily checks. You have 2 pending maintenance tasks for the engine cooling system.";
    suggestions = ["View Maintenance Log", "Schedule Repair"];
    relatedLink = "/maintenance";
  }

  // Gratitude / Greetings
  else if (
    lowerText.includes("hello") ||
    lowerText.includes("hi ") ||
    lowerText === "hi"
  ) {
    responseText = "Hello, Captain! Ready to plan today's trip?";
    suggestions = ["Where are the fish?", "Market outlook"];
  }

  return {
    id: Date.now().toString(),
    sender: "bot",
    text: responseText,
    timestamp: new Date(),
    suggestions,
    relatedLink,
  };
}
