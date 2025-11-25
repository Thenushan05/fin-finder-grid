import React, { createContext, useContext, useState, ReactNode } from "react";
import type { ViewState } from "react-map-gl";
import { mockHotspots } from "@/services/mockData";
import type { WeatherHazard } from "@/services/mockData";
import type { HazardResult } from "@/lib/hazardClassification";

// Define types locally to avoid circular dependencies or complex imports
// Ideally these should be shared types, but for now we replicate the shape
interface RoutePoint {
  lat: number;
  lng: number;
  distanceFromStart?: number;
  etaHours?: number;
  forecastTime?: Date;
  windspeed?: number | null;
  precipitation?: number | null;
  weathercode?: number | null;
  category?: string;
  hazard?: HazardResult;
  primaryReason?: string | null;
  wind_direction?: number | null;
  windgusts?: number | null;
  wave_height?: number | null;
  wave_direction?: number | null;
  ocean_current_velocity?: number | null;
  ocean_current_direction?: number | null;
}

interface AlternativeRoute {
  points: Array<{ lat: number; lng: number }>;
  routeWeatherPoints: RoutePoint[];
  hazardScore: number;
  counts: { LOW: number; MEDIUM: number; HIGH: number; DANGER: number };
  routeType: "main" | "north" | "south";
  offset: number;
}

interface MapContextType {
  // State
  selectedHotspot: (typeof mockHotspots)[0] | null;
  manualDestination: { lat: number; lng: number } | null;
  routeWeatherPoints: RoutePoint[];
  viewState: { longitude: number; latitude: number; zoom: number };
  alternativeRoutes: AlternativeRoute[];
  selectedRouteType: "main" | "north" | "south";
  originalMainRoute: RoutePoint[];
  
  // Setters
  setSelectedHotspot: (hotspot: (typeof mockHotspots)[0] | null) => void;
  setManualDestination: (dest: { lat: number; lng: number } | null) => void;
  setRouteWeatherPoints: (points: RoutePoint[]) => void;
  setViewState: (viewState: { longitude: number; latitude: number; zoom: number }) => void;
  setAlternativeRoutes: (routes: AlternativeRoute[]) => void;
  setSelectedRouteType: (type: "main" | "north" | "south") => void;
  setOriginalMainRoute: (points: RoutePoint[]) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const [selectedHotspot, setSelectedHotspot] = useState<(typeof mockHotspots)[0] | null>(null);
  const [manualDestination, setManualDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [routeWeatherPoints, setRouteWeatherPoints] = useState<RoutePoint[]>([]);
  const [viewState, setViewState] = useState({
    longitude: 81.0,
    latitude: 7.0,
    zoom: 7.5,
  });
  const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([]);
  const [selectedRouteType, setSelectedRouteType] = useState<"main" | "north" | "south">("main");
  const [originalMainRoute, setOriginalMainRoute] = useState<RoutePoint[]>([]);

  return (
    <MapContext.Provider
      value={{
        selectedHotspot,
        manualDestination,
        routeWeatherPoints,
        viewState,
        alternativeRoutes,
        selectedRouteType,
        originalMainRoute,
        setSelectedHotspot,
        setManualDestination,
        setRouteWeatherPoints,
        setViewState,
        setAlternativeRoutes,
        setSelectedRouteType,
        setOriginalMainRoute,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
}
