
export interface RegularGround {
  id: string;
  name: string;
  lat: number;
  lng: number;
  catchProbability: number; // 0-100
  predictionLevel: 'Good' | 'Moderate' | 'Poor';
  weatherFactors: {
    windSpeed: number; // km/h
    waveHeight: number; // m
    rainProbability: number; // %
    cloudCover: number; // %
  };
  historicalInfluence: {
    lastTrips: number;
    trend: 'Rising' | 'Stable' | 'Falling'; // "Seasonal pattern" representation
  };
  aiConfidence: 'High' | 'Medium' | 'Low';
}

export const mockRegularGrounds: RegularGround[] = [
  {
    id: "rg1",
    name: "North Point Reef",
    lat: 9.85,
    lng: 80.12,
    catchProbability: 85,
    predictionLevel: "Good",
    weatherFactors: {
      windSpeed: 12,
      waveHeight: 0.8,
      rainProbability: 10,
      cloudCover: 25,
    },
    historicalInfluence: {
      lastTrips: 5,
      trend: "Rising",
    },
    aiConfidence: "High",
  },
  {
    id: "rg2",
    name: "Deep Blue Trench",
    lat: 9.72,
    lng: 80.35,
    catchProbability: 45,
    predictionLevel: "Moderate",
    weatherFactors: {
      windSpeed: 22,
      waveHeight: 1.5,
      rainProbability: 40,
      cloudCover: 60,
    },
    historicalInfluence: {
      lastTrips: 3,
      trend: "Stable",
    },
    aiConfidence: "Medium",
  },
  {
    id: "rg3",
    name: "Coral Banks",
    lat: 9.60,
    lng: 79.95,
    catchProbability: 25,
    predictionLevel: "Poor",
    weatherFactors: {
      windSpeed: 30,
      waveHeight: 2.2,
      rainProbability: 80,
      cloudCover: 95,
    },
    historicalInfluence: {
      lastTrips: 8,
      trend: "Falling",
    },
    aiConfidence: "High",
  },
  {
    id: "rg4",
    name: "Sandy Shoals",
    lat: 9.92,
    lng: 80.05,
    catchProbability: 72,
    predictionLevel: "Good",
    weatherFactors: {
      windSpeed: 15,
      waveHeight: 1.0,
      rainProbability: 5,
      cloudCover: 10,
    },
    historicalInfluence: {
      lastTrips: 4,
      trend: "Rising",
    },
    aiConfidence: "Medium",
  },
  {
    id: "rg5",
    name: "Old Wreckage",
    lat: 9.55,
    lng: 80.25,
    catchProbability: 55,
    predictionLevel: "Moderate",
    weatherFactors: {
      windSpeed: 18,
      waveHeight: 1.2,
      rainProbability: 30,
      cloudCover: 50,
    },
    historicalInfluence: {
      lastTrips: 6,
      trend: "Stable",
    },
    aiConfidence: "Low",
  }
];
