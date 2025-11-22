// Mock data for demonstration purposes

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

export interface GearType {
  id: string;
  name: string;
  code: string;
  targetSpecies: string[];
  depthRange: { min: number; max: number };
  selectivity: "High" | "Medium" | "Low";
  bycatchRisk: "Low" | "Medium" | "High";
  status: "Permitted" | "Restricted" | "Banned";
}

export interface HotspotData {
  lat: number;
  lng: number;
  probability: number;
  species: string;
  depth: number;
  sst: number;
  chl: number;
}

export const mockSpecies: FishSpecies[] = [
  {
    id: "yft",
    name: "Yellowfin Tuna",
    scientificName: "Thunnus albacares",
    code: "YFT",
    habitatDepth: { min: 0, max: 250 },
    sstRange: { min: 20, max: 30 },
    spawningMonths: [5, 6, 7, 8],
    recommendedGear: ["longline", "purse-seine"],
    sustainabilityStatus: "Moderate",
    description: "Large pelagic species, highly migratory. Peak season: May-August.",
  },
  {
    id: "bet",
    name: "Bigeye Tuna",
    scientificName: "Thunnus obesus",
    code: "BET",
    habitatDepth: { min: 100, max: 400 },
    sstRange: { min: 17, max: 27 },
    spawningMonths: [4, 5, 6, 7, 8, 9],
    recommendedGear: ["longline"],
    sustainabilityStatus: "At Risk",
    description: "Deep-diving tuna species. Found in cooler, deeper waters.",
  },
  {
    id: "skj",
    name: "Skipjack Tuna",
    scientificName: "Katsuwonus pelamis",
    code: "SKJ",
    habitatDepth: { min: 0, max: 200 },
    sstRange: { min: 22, max: 29 },
    spawningMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    recommendedGear: ["purse-seine", "pole-line"],
    sustainabilityStatus: "Good",
    description: "Most abundant tuna species. Year-round availability.",
  },
  {
    id: "seer",
    name: "Seer Fish (King Mackerel)",
    scientificName: "Scomberomorus commerson",
    code: "COM",
    habitatDepth: { min: 10, max: 80 },
    sstRange: { min: 24, max: 30 },
    spawningMonths: [3, 4, 5, 9, 10],
    recommendedGear: ["gillnet", "trolling"],
    sustainabilityStatus: "Moderate",
    description: "Coastal pelagic fish popular in regional markets.",
  },
];

export const mockGear: GearType[] = [
  {
    id: "longline",
    name: "Longline",
    code: "LL",
    targetSpecies: ["YFT", "BET", "SWO"],
    depthRange: { min: 50, max: 400 },
    selectivity: "High",
    bycatchRisk: "Medium",
    status: "Permitted",
  },
  {
    id: "purse-seine",
    name: "Purse Seine",
    code: "PS",
    targetSpecies: ["YFT", "SKJ"],
    depthRange: { min: 0, max: 150 },
    selectivity: "Medium",
    bycatchRisk: "Low",
    status: "Permitted",
  },
  {
    id: "gillnet",
    name: "Gillnet",
    code: "GN",
    targetSpecies: ["COM", "KIN"],
    depthRange: { min: 10, max: 100 },
    selectivity: "Low",
    bycatchRisk: "High",
    status: "Restricted",
  },
  {
    id: "pole-line",
    name: "Pole and Line",
    code: "PL",
    targetSpecies: ["SKJ"],
    depthRange: { min: 0, max: 50 },
    selectivity: "High",
    bycatchRisk: "Low",
    status: "Permitted",
  },
];

export const mockHotspots: HotspotData[] = [
  { lat: 6.5, lng: 80.2, probability: 0.85, species: "YFT", depth: 180, sst: 28.5, chl: 0.3 },
  { lat: 7.2, lng: 81.5, probability: 0.72, species: "SKJ", depth: 120, sst: 29.1, chl: 0.4 },
  { lat: 5.8, lng: 79.8, probability: 0.68, species: "BET", depth: 250, sst: 26.8, chl: 0.2 },
  { lat: 8.1, lng: 82.3, probability: 0.91, species: "YFT", depth: 200, sst: 28.9, chl: 0.35 },
  { lat: 6.9, lng: 80.8, probability: 0.76, species: "COM", depth: 45, sst: 29.5, chl: 0.5 },
];

export const mockPriceData = [
  { month: "Jan", YFT: 850, BET: 920, SKJ: 450, COM: 680 },
  { month: "Feb", YFT: 880, BET: 950, SKJ: 470, COM: 700 },
  { month: "Mar", YFT: 920, BET: 980, SKJ: 490, COM: 720 },
  { month: "Apr", YFT: 950, BET: 1020, SKJ: 510, COM: 750 },
  { month: "May", YFT: 1020, BET: 1100, SKJ: 550, COM: 800 },
  { month: "Jun", YFT: 1050, BET: 1150, SKJ: 580, COM: 850 },
];

export const monsoonSeasons = {
  southwest: { months: [5, 6, 7, 8, 9], name: "Southwest Monsoon" },
  northeast: { months: [11, 12, 1, 2], name: "Northeast Monsoon" },
  inter1: { months: [3, 4], name: "First Inter-Monsoon" },
  inter2: { months: [10], name: "Second Inter-Monsoon" },
};

export function getCurrentMonsoon(): string {
  const month = new Date().getMonth() + 1;
  if (monsoonSeasons.southwest.months.includes(month)) return monsoonSeasons.southwest.name;
  if (monsoonSeasons.northeast.months.includes(month)) return monsoonSeasons.northeast.name;
  if (monsoonSeasons.inter1.months.includes(month)) return monsoonSeasons.inter1.name;
  return monsoonSeasons.inter2.name;
}
