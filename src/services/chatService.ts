const HOTSPOT_LS_KEY = "fishspot_hotspot_scan";

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

// Simple keyword-based mock analysis
export async function processUserMessage(text: string): Promise<ChatMessage> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const lowerText = text.toLowerCase();
  let responseText =
    "I'm not sure about that. Try asking about fishing hotspots, market prices, or species info.";
  let suggestions: string[] = [];
  let relatedLink: string | undefined = undefined;

  // 1. Hotspot Queries
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
      "Check the Market page for live fish prices, trends, and demand forecasts based on real-time data.";
    suggestions = ["See full market report", "Check Tuna prices"];
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
