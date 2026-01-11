// Frontend integration example for fuel consumption API
// Add this to your existing hotspot map component

import { useState } from "react";

interface FuelCalculationResult {
  distance_km: number;
  estimated_trip_duration_hours: number;
  fuel_consumption_liters: number;
  vessel_used: string;
  fuel_cost_usd: number;
}

interface Coordinates {
  lat: number;
  lon: number;
}

// Hook for fuel calculation
export const useFuelCalculation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateFuel = async (
    startCoords: Coordinates,
    endCoords: Coordinates,
    vesselId?: string
  ): Promise<FuelCalculationResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/fuel/calculate-fuel-consumption",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start_lat: startCoords.lat,
            start_lon: startCoords.lon,
            end_lat: endCoords.lat,
            end_lon: endCoords.lon,
            vessel_id: vesselId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: FuelCalculationResult = await response.json();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Fuel calculation error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { calculateFuel, isLoading, error };
};

// Example component that integrates with your map
export const FuelCalculator = ({
  startPoint,
  endPoint,
  onCalculationComplete,
}: {
  startPoint: Coordinates | null;
  endPoint: Coordinates | null;
  onCalculationComplete: (result: FuelCalculationResult) => void;
}) => {
  const { calculateFuel, isLoading, error } = useFuelCalculation();
  const [selectedVessel, setSelectedVessel] = useState<string>("");
  const [result, setResult] = useState<FuelCalculationResult | null>(null);

  const handleCalculate = async () => {
    if (!startPoint || !endPoint) {
      alert("Please select both start and end points on the map");
      return;
    }

    const calculationResult = await calculateFuel(
      startPoint,
      endPoint,
      selectedVessel || undefined
    );

    if (calculationResult) {
      setResult(calculationResult);
      onCalculationComplete(calculationResult);
    }
  };

  return (
    <div className="fuel-calculator p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        Fuel Consumption Calculator
      </h3>

      {startPoint && endPoint ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>
              Start: {startPoint.lat.toFixed(4)}, {startPoint.lon.toFixed(4)}
            </p>
            <p>
              End: {endPoint.lat.toFixed(4)}, {endPoint.lon.toFixed(4)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Vessel (optional):
            </label>
            <input
              type="text"
              placeholder="e.g., V0001 (leave empty for average)"
              value={selectedVessel}
              onChange={(e) => setSelectedVessel(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            onClick={handleCalculate}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Calculating..." : "Calculate Fuel Consumption"}
          </button>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              Error: {error}
            </div>
          )}

          {result && (
            <div className="bg-green-50 p-4 rounded space-y-2">
              <h4 className="font-semibold text-green-800">Trip Details:</h4>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Distance:</strong> {result.distance_km} km
                </p>
                <p>
                  <strong>Duration:</strong>{" "}
                  {result.estimated_trip_duration_hours} hours
                </p>
                <p>
                  <strong>Fuel needed:</strong> {result.fuel_consumption_liters}{" "}
                  liters
                </p>
                <p>
                  <strong>Estimated cost:</strong> ${result.fuel_cost_usd}
                </p>
                <p>
                  <strong>Vessel:</strong> {result.vessel_used}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          Click on the map to select start and end points for your trip.
        </p>
      )}
    </div>
  );
};

// Example of how to integrate this into your existing map component
export const HotspotMapWithFuelCalculation = () => {
  const [startPoint, setStartPoint] = useState<Coordinates | null>(null);
  const [endPoint, setEndPoint] = useState<Coordinates | null>(null);
  const [clickMode, setClickMode] = useState<"start" | "end">("start");

  const handleMapClick = (lat: number, lon: number) => {
    const coords = { lat, lon };

    if (clickMode === "start") {
      setStartPoint(coords);
      setClickMode("end");
    } else {
      setEndPoint(coords);
      setClickMode("start");
    }
  };

  const handleCalculationComplete = (result: FuelCalculationResult) => {
    // You can update your UI here, show notifications, etc.
    console.log("Fuel calculation completed:", result);
  };

  const resetPoints = () => {
    setStartPoint(null);
    setEndPoint(null);
    setClickMode("start");
  };

  return (
    <div className="flex">
      {/* Your existing map component */}
      <div className="flex-1">
        {/* Map component with onClick handler */}
        {/* <YourMapComponent onClick={handleMapClick} /> */}

        <div className="mt-2 text-sm text-gray-600">
          Click mode:{" "}
          {clickMode === "start" ? "Select start point" : "Select end point"}
        </div>
      </div>

      {/* Fuel calculator sidebar */}
      <div className="w-80 p-4">
        <div className="mb-4">
          <button
            onClick={resetPoints}
            className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            Reset Points
          </button>
        </div>

        <FuelCalculator
          startPoint={startPoint}
          endPoint={endPoint}
          onCalculationComplete={handleCalculationComplete}
        />
      </div>
    </div>
  );
};
