/**
 * Static reference data for Sri Lankan pelagic fisheries.
 *
 * FishSpecies and GearType are scientific/catalogue data — not placeholder
 * values. They represent real species biology and gear categories used in the
 * Sri Lankan fishing industry and are used throughout the app for species
 * lookup, camera identification mapping, and gear recommendations.
 *
 * NOTE: WeatherHazard type has been moved to @/lib/hazardClassification.
 */

// ---------------------------------------------------------------------------
// Species
// ---------------------------------------------------------------------------
export interface FishSpecies {
  id: string;
  name: string;
  scientificName: string;
  code: string;
  habitatDepth: { min: number; max: number };
  sstRange: { min: number; max: number };
  spawningMonths: number[];
  recommendedGear: string[];
  sustainabilityStatus: "Good" | "Moderate" | "At Risk";
  description: string;
}

export const mockSpecies: FishSpecies[] = [
  {
    id: "yft",
    name: "Yellowfin Tuna",
    scientificName: "Thunnus albacares",
    code: "YFT",
    habitatDepth: { min: 0, max: 250 },
    sstRange: { min: 26, max: 32 },
    spawningMonths: [4, 5, 6, 7, 8, 9],
    recommendedGear: ["Longlining", "Trolling", "Purse Seine"],
    sustainabilityStatus: "Moderate",
    description:
      "Highly migratory pelagic species. Sri Lanka's most commercially important tuna. Found in warm tropical waters year-round with peak abundance during the Southwest Monsoon.",
  },
  {
    id: "bet",
    name: "Bigeye Tuna",
    scientificName: "Thunnus obesus",
    code: "BET",
    habitatDepth: { min: 0, max: 500 },
    sstRange: { min: 20, max: 29 },
    spawningMonths: [4, 5, 6, 7, 8],
    recommendedGear: ["Longlining", "Deep-set Longline"],
    sustainabilityStatus: "Moderate",
    description:
      "Deep-swimming tuna species that migrates vertically. Prefers slightly cooler surface water compared to yellowfin. Highly valued for sashimi markets.",
  },
  {
    id: "skj",
    name: "Skipjack Tuna",
    scientificName: "Katsuwonus pelamis",
    code: "SKJ",
    habitatDepth: { min: 0, max: 260 },
    sstRange: { min: 28, max: 32 },
    spawningMonths: [1, 2, 3, 4, 5, 6, 10, 11, 12],
    recommendedGear: ["Purse Seine", "Pole & Line", "Trolling"],
    sustainabilityStatus: "Good",
    description:
      "Most abundant tuna in Sri Lankan waters. Surface-schooling species concentrated near warm upwelling zones. Key target of artisanal and semi-industrial fleets.",
  },
  {
    id: "swo",
    name: "Swordfish",
    scientificName: "Xiphias gladius",
    code: "SWO",
    habitatDepth: { min: 0, max: 800 },
    sstRange: { min: 18, max: 27 },
    spawningMonths: [5, 6, 7, 8, 9],
    recommendedGear: ["Longlining", "Harpoon"],
    sustainabilityStatus: "Moderate",
    description:
      "Solitary predator found in offshore deep waters. Active at night near the surface, diving deep during the day. Seasonal visitor to Sri Lankan EEZ.",
  },
  {
    id: "mahi",
    name: "Mahi-mahi",
    scientificName: "Coryphaena hippurus",
    code: "MAHI",
    habitatDepth: { min: 0, max: 85 },
    sstRange: { min: 26, max: 32 },
    spawningMonths: [3, 4, 5, 6, 7, 8],
    recommendedGear: ["Trolling", "Handline", "Driftnet"],
    sustainabilityStatus: "Good",
    description:
      "Fast-growing surface-dwelling species associated with drifting debris and floating objects. Fast reproduction makes it resilient to fishing pressure.",
  },
  {
    id: "bum",
    name: "Blue Marlin",
    scientificName: "Makaira nigricans",
    code: "BUM",
    habitatDepth: { min: 0, max: 600 },
    sstRange: { min: 26, max: 31 },
    spawningMonths: [6, 7, 8, 9],
    recommendedGear: ["Trolling", "Longlining"],
    sustainabilityStatus: "At Risk",
    description:
      "Apex predator of the Indian Ocean. Long-distance migrant reaching over 300 kg. Targeted by sport fishers; bycatch in tuna longlines. Stocks under pressure.",
  },
  {
    id: "alb",
    name: "Albacore",
    scientificName: "Thunnus alalunga",
    code: "ALB",
    habitatDepth: { min: 0, max: 600 },
    sstRange: { min: 16, max: 24 },
    spawningMonths: [6, 7, 8, 9],
    recommendedGear: ["Longlining", "Trolling", "Pole & Line"],
    sustainabilityStatus: "Good",
    description:
      "Prefers cooler sub-tropical waters. Seasonal in Sri Lankan waters, more common during northeast monsoon when cooler upwelling occurs off the east coast.",
  },
  {
    id: "wah",
    name: "Wahoo",
    scientificName: "Acanthocybium solandri",
    code: "WAH",
    habitatDepth: { min: 0, max: 200 },
    sstRange: { min: 24, max: 30 },
    spawningMonths: [1, 2, 3, 4, 5, 6],
    recommendedGear: ["Trolling", "Handline"],
    sustainabilityStatus: "Good",
    description:
      "One of the fastest fish in the ocean. Solitary hunter of offshore reefs and FADs. Popular for sport fishing along Sri Lanka's southern and western coasts.",
  },
  {
    id: "kin",
    name: "King Mackerel",
    scientificName: "Scomberomorus commerson",
    code: "KIN",
    habitatDepth: { min: 0, max: 100 },
    sstRange: { min: 27, max: 31 },
    spawningMonths: [2, 3, 4, 5, 10, 11],
    recommendedGear: ["Trolling", "Gillnet", "Handline"],
    sustainabilityStatus: "Moderate",
    description:
      "Highly prized coastal pelagic species. Abundant in Sri Lankan waters throughout the year. Important for artisanal fishers and domestic markets.",
  },
];

// ---------------------------------------------------------------------------
// Gear
// ---------------------------------------------------------------------------
export interface GearType {
  id: string;
  name: string;
  code: string;
  targetSpecies: string[];
  depthRange: string;
  selectivity: "High" | "Medium" | "Low";
  bycatchRisk: "Low" | "Medium" | "High";
  status: "Recommended" | "Regulated" | "Restricted";
}

export const mockGear: GearType[] = [
  {
    id: "ll",
    name: "Longlining",
    code: "LL",
    targetSpecies: [
      "YFT",
      "BET",
      "SWO",
      "ALB",
      "BUM",
      "Yellowfin Tuna",
      "Bigeye Tuna",
      "Swordfish",
      "Albacore",
      "Blue Marlin",
    ],
    depthRange: "50–400 m",
    selectivity: "Medium",
    bycatchRisk: "Medium",
    status: "Recommended",
  },
  {
    id: "trl",
    name: "Trolling Lines",
    code: "TRL",
    targetSpecies: [
      "YFT",
      "SKJ",
      "MAHI",
      "BUM",
      "WAH",
      "KIN",
      "Yellowfin Tuna",
      "Skipjack Tuna",
      "Mahi-mahi",
      "Blue Marlin",
      "Wahoo",
      "King Mackerel",
    ],
    depthRange: "0–50 m",
    selectivity: "High",
    bycatchRisk: "Low",
    status: "Recommended",
  },
  {
    id: "ps",
    name: "Purse Seine",
    code: "PS",
    targetSpecies: ["SKJ", "YFT", "Skipjack Tuna", "Yellowfin Tuna"],
    depthRange: "0–200 m",
    selectivity: "Low",
    bycatchRisk: "High",
    status: "Regulated",
  },
  {
    id: "pl",
    name: "Pole & Line",
    code: "PL",
    targetSpecies: ["SKJ", "ALB", "Skipjack Tuna", "Albacore"],
    depthRange: "0–100 m",
    selectivity: "High",
    bycatchRisk: "Low",
    status: "Recommended",
  },
  {
    id: "hl",
    name: "Handline",
    code: "HL",
    targetSpecies: [
      "MAHI",
      "WAH",
      "KIN",
      "Mahi-mahi",
      "Wahoo",
      "King Mackerel",
    ],
    depthRange: "0–150 m",
    selectivity: "High",
    bycatchRisk: "Low",
    status: "Recommended",
  },
  {
    id: "gn",
    name: "Driftnet / Gillnet",
    code: "GN",
    targetSpecies: [
      "YFT",
      "SKJ",
      "MAHI",
      "KIN",
      "Yellowfin Tuna",
      "Skipjack Tuna",
      "Mahi-mahi",
      "King Mackerel",
    ],
    depthRange: "0–100 m",
    selectivity: "Medium",
    bycatchRisk: "Medium",
    status: "Regulated",
  },
];

// ---------------------------------------------------------------------------
// Monsoon utility
// ---------------------------------------------------------------------------
/** Returns the current Sri Lankan monsoon season name based on the calendar month. */
export function getCurrentMonsoon(): string {
  const m = new Date().getMonth() + 1; // 1-based
  if (m === 12 || m <= 3) return "Northeast Monsoon";
  if (m <= 5) return "First Inter-Monsoon";
  if (m <= 9) return "Southwest Monsoon";
  return "Second Inter-Monsoon";
}
