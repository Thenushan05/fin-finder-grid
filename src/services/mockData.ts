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
  isSpawningArea?: boolean;
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
  {
    id: "swo",
    name: "Swordfish",
    scientificName: "Xiphias gladius",
    code: "SWO",
    habitatDepth: { min: 200, max: 600 },
    sstRange: { min: 18, max: 28 },
    spawningMonths: [2, 3, 4, 5],
    recommendedGear: ["longline"],
    sustainabilityStatus: "Moderate",
    description: "Highly oceanic, caught mostly at night using deep longlines.",
  },
  {
    id: "mahi",
    name: "Mahi Mahi",
    scientificName: "Coryphaena hippurus",
    code: "MAHI",
    habitatDepth: { min: 0, max: 80 },
    sstRange: { min: 21, max: 30 },
    spawningMonths: [1, 2, 3, 4, 11, 12],
    recommendedGear: ["trolling", "longline"],
    sustainabilityStatus: "Good",
    description: "Fast-growing surface dweller often found near floating objects.",
  },
  {
    id: "bum",
    name: "Blue Marlin",
    scientificName: "Makaira nigricans",
    code: "BUM",
    habitatDepth: { min: 0, max: 200 },
    sstRange: { min: 22, max: 31 },
    spawningMonths: [6, 7, 8, 9],
    recommendedGear: ["trolling", "longline"],
    sustainabilityStatus: "At Risk",
    description: "Highly prized sportfish and commercial byproduct. Often catch-and-release.",
  },
  {
    id: "sax",
    name: "Sailfish",
    scientificName: "Istiophorus platypterus",
    code: "SAX",
    habitatDepth: { min: 0, max: 100 },
    sstRange: { min: 25, max: 30 },
    spawningMonths: [4, 5, 6, 7, 8],
    recommendedGear: ["trolling", "gillnet"],
    sustainabilityStatus: "Moderate",
    description: "Fastest fish in the ocean, common in coastal and offshore waters.",
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
  // 5 Hotspots in the Northern side of Sri Lanka (fishing boundaries)
  { lat: 9.9, lng: 80.0, probability: 0.95, species: "YFT", depth: 180, sst: 28.5, chl: 0.3 }, // North (Jaffna / Palk Strait edge)
  { lat: 9.7, lng: 80.6, probability: 0.99, species: "SKJ", depth: 120, sst: 29.1, chl: 0.4 }, // North East
  { lat: 9.4, lng: 80.8, probability: 0.95, species: "SKJ", depth: 150, sst: 28.8, chl: 0.38 }, // North center -> Adjusted East to Ocean
  { lat: 9.1, lng: 79.5, probability: 0.79, species: "YFT", depth: 200, sst: 28.9, chl: 0.35 }, // North West (Mannar side)
  { lat: 9.0, lng: 80.9, probability: 0.95, species: "BET", depth: 250, sst: 26.8, chl: 0.2 }, // North East (Mullaittivu side)
  
  // 5 Hotspots in other zones
  { lat: 7.0, lng: 82.2, probability: 0.88, species: "YFT", depth: 180, sst: 28.5, chl: 0.3 }, // East (Off Batticaloa)
  { lat: 7.8, lng: 82.0, probability: 0.92, species: "SKJ", depth: 120, sst: 29.1, chl: 0.4 }, // East (Off Kalkudah)
  { lat: 5.5, lng: 80.0, probability: 0.85, species: "COM", depth: 45, sst: 29.5, chl: 0.5 }, // Deep South
  { lat: 6.5, lng: 79.4, probability: 0.76, species: "YFT", depth: 150, sst: 28.9, chl: 0.35 }, // South West (Off Galle)
  { lat: 7.0, lng: 79.3, probability: 0.81, species: "COM", depth: 60, sst: 29.2, chl: 0.45 }, // West (Off Colombo)
  
  // 3 New Moderate Confidence Hotspots in North East (spread out towards boundary)
  { lat: 10.2, lng: 81.5, probability: 0.65, species: "YFT", depth: 460, sst: 28.6, chl: 0.35 }, // Moderate North East 1
  { lat: 9.8, lng: 81.8, probability: 0.55, species: "COM", depth: 310, sst: 29.0, chl: 0.4 },  // Moderate North East 2
  { lat: 8.5, lng: 82.1, probability: 0.61, species: "SKJ", depth: 580, sst: 28.7, chl: 0.38 }, // Moderate North East 3
  
  // 3 Spawning Warnings (spread out towards boundary)
  { lat: 9.5, lng: 79.6, probability: 0.20, species: "BET", depth: 250, sst: 26.8, chl: 0.2, isSpawningArea: true }, // North West Spawning Area
  { lat: 10.5, lng: 81.2, probability: 0.15, species: "SKJ", depth: 1200, sst: 27.5, chl: 0.1, isSpawningArea: true }, // Deep North East Spawning Area 1
  { lat: 9.1, lng: 81.9, probability: 0.25, species: "YFT", depth: 820, sst: 27.1, chl: 0.3, isSpawningArea: true }, // Deep North East Spawning Area 2
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

// Weather Hazards
export interface WeatherHazard {
  id: string;
  lat: number;
  lng: number;
  type: "storm" | "high-waves" | "tornado";
  severity: "low" | "medium" | "high";
  description: string;
  waveHeight?: number; // in meters
  windSpeed?: number; // in knots
}

export const mockWeatherHazards: WeatherHazard[] = [
  {
    id: "storm-1",
    lat: 7.5,
    lng: 82.0,
    type: "storm",
    severity: "high",
    description: "Tropical storm warning in Bay of Bengal",
    windSpeed: 45,
  },
  {
    id: "storm-2",
    lat: 6.0,
    lng: 81.0,
    type: "storm",
    severity: "medium",
    description: "Thunderstorm activity east of Sri Lanka",
    windSpeed: 30,
  },
  {
    id: "waves-1",
    lat: 8.8,
    lng: 81.5,
    type: "high-waves",
    severity: "high",
    description: "High wave warning in northeastern waters",
    waveHeight: 4.5,
  },
  {
    id: "waves-2",
    lat: 5.8,
    lng: 79.5,
    type: "high-waves",
    severity: "medium",
    description: "Moderate wave conditions southwest of Sri Lanka",
    waveHeight: 3.0,
  },
  {
    id: "waves-3",
    lat: 7.0,
    lng: 83.5,
    type: "high-waves",
    severity: "low",
    description: "Choppy sea conditions in eastern Bay of Bengal",
    waveHeight: 2.0,
  },
  {
    id: "tornado-1",
    lat: 6.8,
    lng: 82.2,
    type: "tornado",
    severity: "high",
    description: "Waterspout/Tornado warning - extreme danger",
    windSpeed: 65,
  },
  {
    id: "tornado-2",
    lat: 8.2,
    lng: 80.8,
    type: "tornado",
    severity: "medium",
    description: "Funnel cloud spotted",
    windSpeed: 45,
  },
];

// --- New ML Model & Market Prediction Mock Data ---

// 1. Confusion Matrix Data
export const mockConfusionMatrix = {
  labels: ["Up", "Stable", "Down"],
  matrix: [
    [45, 5, 2],  // True Up
    [8, 52, 6],  // True Stable
    [3, 7, 48],  // True Down
  ]
};

// 2. Accuracy Over Time
export const mockAccuracyOverTime = [
  { date: "2023-08", accuracy: 0.78 },
  { date: "2023-09", accuracy: 0.81 },
  { date: "2023-10", accuracy: 0.79 },
  { date: "2023-11", accuracy: 0.84 },
  { date: "2023-12", accuracy: 0.88 },
  { date: "2024-01", accuracy: 0.86 },
];

// 3. Festival vs Normal Accuracy
export const mockFestivalAccuracy = [
  { type: "Normal Days", accuracy: 82 },
  { type: "Festival Days", accuracy: 76 }, // Often harder to predict
];

// 4. Monthly Accuracy (Bar Chart)
export const mockMonthlyAccuracy = [
  { month: "Jan", accuracy: 85 },
  { month: "Feb", accuracy: 82 },
  { month: "Mar", accuracy: 88 },
  { month: "Apr", accuracy: 79 },
  { month: "May", accuracy: 81 },
  { month: "Jun", accuracy: 84 },
];

// 5. Feature Importance
export const mockFeatureImportance = [
  { feature: "Prev Week Price", importance: 0.35 },
  { feature: "Seasonality", importance: 0.25 },
  { feature: "Fuel Cost", importance: 0.15 },
  { feature: "Festival", importance: 0.12 },
  { feature: "Weather", importance: 0.08 },
  { feature: "Export Demand", importance: 0.05 },
];

// 6. Market Trend & Timeline
export const mockMarketPredictions = [
  {
    day: "Mon",
    price: 1250,
    trend: "up",
    confidence: 0.89,
    event: "Start of Week",
    explanation: "High export demand detected."
  },
  {
    day: "Tue",
    price: 1280,
    trend: "up",
    confidence: 0.85,
    event: null,
    explanation: "Supply constraints from poor weather."
  },
  {
    day: "Wed",
    price: 1260,
    trend: "down",
    confidence: 0.65,
    event: "Mid-week lull",
    explanation: "Local market saturation expected."
  },
  {
    day: "Thu",
    price: 1290,
    trend: "up",
    confidence: 0.92,
    event: "Pre-Festival Rush",
    explanation: "Upcoming festival weekend driving prices."
  },
  {
    day: "Fri",
    price: 1350,
    trend: "up",
    confidence: 0.95,
    event: "Festival Peak",
    explanation: "Peak festival demand."
  },
  {
    day: "Sat",
    price: 1320,
    trend: "stable",
    confidence: 0.78,
    event: null,
    explanation: "Market stabilizing after peak."
  },
  {
    day: "Sun",
    price: 1300,
    trend: "down",
    confidence: 0.81,
    event: "Close",
    explanation: "End of weekly cycle."
  },
];

export const mockFestivalAlerts = [
  { id: 1, name: "Sinhala New Year", date: "2024-04-14", impact: "High", type: "upcoming" },
  { id: 2, name: "Vesak", date: "2024-05-23", impact: "Medium", type: "upcoming" },
  { id: 3, name: "Christmas", date: "2023-12-25", impact: "High", type: "past" },
];

// 7. Multi-Week Trend Outlook
export const mockMultiWeekTrend = [
  { week: "W1", trend: "Up", confidence: 0.85, intensity: 80 },
  { week: "W2", trend: "Up", confidence: 0.72, intensity: 60 },
  { week: "W3", trend: "Stable", confidence: 0.65, intensity: 10 },
  { week: "W4", trend: "Down", confidence: 0.78, intensity: -40 },
];

// 8. Trend Distribution (Pie Chart)
export const mockTrendDistribution = [
  { name: "Up Trend", value: 45, color: "#10b981" },    // Green
  { name: "Stable", value: 25, color: "#94a3b8" },      // Slate
  { name: "Down Trend", value: 30, color: "#ef4444" },  // Red
];

// 9. Seasonal Trend Analysis (Radar or Line)
export const mockSeasonalTrends = [
  { subject: "Monsoon", A: 85, fullMark: 100 },
  { subject: "Inter-Monsoon", A: 45, fullMark: 100 },
  { subject: "Drought", A: 30, fullMark: 100 },
  { subject: "Festival", A: 90, fullMark: 100 },
  { subject: "Holiday", A: 60, fullMark: 100 },
];

// 10. Fish-Wise Trend Summary
export const mockFishTrendSummary = [
  { code: "YFT", name: "Yellowfin Tuna", trend: "Up", confidence: 0.92, recommendedAction: "Buy" },
  { code: "BET", name: "Bigeye Tuna", trend: "Stable", confidence: 0.81, recommendedAction: "Hold" },
  { code: "SKJ", name: "Skipjack Tuna", trend: "Down", confidence: 0.76, recommendedAction: "Wait" },
  { code: "COM", name: "Seer Fish", trend: "Up", confidence: 0.88, recommendedAction: "Buy" },
  { code: "SWO", name: "Swordfish", trend: "Stable", confidence: 0.70, recommendedAction: "Hold" },
  { code: "MAHI", name: "Mahi Mahi", trend: "Up", confidence: 0.85, recommendedAction: "Buy" },
  { code: "BUM", name: "Blue Marlin", trend: "Down", confidence: 0.65, recommendedAction: "Sell" },
  { code: "SAX", name: "Sailfish", trend: "Stable", confidence: 0.72, recommendedAction: "Hold" },
];

// 11. Next Week Forecast (Multi-Species Line Chart)
export const mockSpeciesForecast = [
  { day: "Mon", YFT: 100, BET: 100, SKJ: 100, COM: 100, SWO: 100, MAHI: 100, BUM: 100, SAX: 100 },
  { day: "Tue", YFT: 115, BET: 85, SKJ: 112, COM: 108, SWO: 102, MAHI: 118, BUM: 95, SAX: 105 },
  { day: "Wed", YFT: 92, BET: 108, SKJ: 95, COM: 122, SWO: 105, MAHI: 105, BUM: 92, SAX: 108 },
  { day: "Thu", YFT: 112, BET: 96, SKJ: 108, COM: 105, SWO: 100, MAHI: 125, BUM: 88, SAX: 112 },
  { day: "Fri", YFT: 125, BET: 82, SKJ: 120, COM: 118, SWO: 108, MAHI: 95, BUM: 85, SAX: 115 },
  { day: "Sat", YFT: 105, BET: 98, SKJ: 102, COM: 102, SWO: 110, MAHI: 130, BUM: 82, SAX: 105 },
  { day: "Sun", YFT: 118, BET: 90, SKJ: 115, COM: 120, SWO: 112, MAHI: 115, BUM: 80, SAX: 110 },
];

export const mockSpeciesForecast30d = Array.from({ length: 30 }, (_, i) => {
  const dayNum = i + 1;
  return {
    day: `D${dayNum}`,
    YFT: 100 + Math.floor(Math.random() * 60 - 20) + (i * 1.5), 
    BET: 100 + Math.floor(Math.random() * 50 - 25) - (i * 0.5), 
    SKJ: 100 + Math.floor(Math.random() * 70 - 35),             
    COM: 100 + Math.floor(Math.random() * 40 - 15) + (i * 2),   
    SWO: 100 + Math.floor(Math.random() * 30 - 15) + (i * 0.5), 
    MAHI: 100 + Math.floor(Math.random() * 80 - 40) + (i * 1.5), 
    BUM: 100 + Math.floor(Math.random() * 40 - 25) - (i * 1),   
    SAX: 100 + Math.floor(Math.random() * 50 - 20) + (i * 1),   
  };
});
