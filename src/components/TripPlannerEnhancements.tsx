import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import {
  MapPin,
  Route,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Waves,
  Thermometer,
  Wind,
  Eye,
  CloudRain,
  Satellite,
} from "lucide-react";
import { getVessels } from "@/services/api";
import { SeaCondition, WeatherCodes } from "@/services/weatherConditions";

interface TripPlannerEnhancementsProps {
  selectedVessel: string;
  selectedHotspots: number[];
  fuelCalculation: any;
  seaCondition: string;
  realWeatherCondition?: SeaCondition | null;
  useRealWeather?: boolean;
}

export default function TripPlannerEnhancements({
  selectedVessel,
  selectedHotspots,
  fuelCalculation,
  seaCondition,
  realWeatherCondition,
  useRealWeather = false,
}: TripPlannerEnhancementsProps) {
  const [vesselData, setVesselData] = useState<any>(null);

  useEffect(() => {
    if (selectedVessel) {
      loadVesselMaintenanceData();
    }
  }, [selectedVessel]);

  const loadVesselMaintenanceData = async () => {
    try {
      const vessels = await getVessels();
      const vessel = vessels.find((v: any) => v.id === selectedVessel);
      setVesselData(vessel);
    } catch (error) {
      console.error("Failed to load vessel data:", error);
    }
  };

  const getMaintenanceStatus = () => {
    if (!vesselData?.systems) return { status: "unknown", issues: [] };

    const issues: string[] = [];
    let overallStatus = "good";

    vesselData.systems.forEach((system: any) => {
      if (system.status === "critical" || system.status === "offline") {
        issues.push(`${system.name}: ${system.status}`);
        overallStatus = "critical";
      } else if (system.status === "overdue" || system.status === "due-soon") {
        issues.push(`${system.name}: maintenance ${system.status}`);
        if (overallStatus !== "critical") overallStatus = "warning";
      }
    });

    return { status: overallStatus, issues };
  };

  const getWeatherImpact = () => {
    if (useRealWeather && realWeatherCondition) {
      return {
        fuel: realWeatherCondition.fuelMultiplier,
        speed: realWeatherCondition.speedMultiplier,
        safety: realWeatherCondition.safetyLevel,
        description: realWeatherCondition.description,
        windSpeed: realWeatherCondition.windSpeed,
        waveHeight: realWeatherCondition.waveHeight,
        visibility: realWeatherCondition.visibility,
        timestamp: realWeatherCondition.timestamp,
      };
    }

    // Fallback to manual conditions
    const impacts = {
      calm: {
        fuel: 1.0,
        speed: 1.0,
        safety: "low",
        description: "Ideal conditions",
      },
      choppy: {
        fuel: 1.15,
        speed: 0.85,
        safety: "medium",
        description: "Moderate seas, experienced crew recommended",
      },
      rough: {
        fuel: 1.3,
        speed: 0.7,
        safety: "high",
        description: "Dangerous conditions, avoid if possible",
      },
    };

    return impacts[seaCondition as keyof typeof impacts] || impacts.calm;
  };

  const maintenanceStatus = getMaintenanceStatus();
  const weatherImpact = getWeatherImpact();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="route" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="route">Route Analysis</TabsTrigger>
          <TabsTrigger value="maintenance">Vessel Status</TabsTrigger>
          <TabsTrigger value="weather">Weather Impact</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="route" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" />
                Route Breakdown
              </CardTitle>
              <CardDescription>
                Detailed analysis of your planned route segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fuelCalculation?.segments ? (
                <div className="space-y-3">
                  {fuelCalculation.segments.map(
                    (segment: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-accent rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">
                              Segment {index + 1}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {segment.distance_km.toFixed(1)} km •{" "}
                              {segment.estimated_trip_duration_hours.toFixed(1)}
                              h
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {segment.fuel_consumption_liters.toFixed(1)} L
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${segment.fuel_cost_usd.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total Route</span>
                      <div className="text-right">
                        <div>
                          {fuelCalculation.totals.fuel_consumption_liters.toFixed(
                            1
                          )}{" "}
                          L
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${fuelCalculation.totals.fuel_cost_usd.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Enable real fuel calculations to see route breakdown
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Vessel Maintenance Status
              </CardTitle>
              <CardDescription>Pre-trip vessel readiness check</CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceStatus.status === "critical" && (
                <Alert className="mb-4 border-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium text-red-700">
                    CRITICAL: Vessel has critical maintenance issues. DO NOT
                    DEPART.
                  </AlertDescription>
                </Alert>
              )}

              {maintenanceStatus.status === "warning" && (
                <Alert className="mb-4 border-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium text-amber-700">
                    WARNING: Some systems require maintenance attention.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {maintenanceStatus.issues.length > 0 ? (
                  maintenanceStatus.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-accent rounded"
                    >
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">{issue}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      All systems operational
                    </span>
                  </div>
                )}
              </div>

              {selectedVessel && (
                <div className="mt-4 p-3 bg-card border rounded-lg">
                  <div className="text-sm font-medium mb-2">Quick Actions</div>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule Maintenance
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Pre-Trip Inspection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weather" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-primary" />
                Weather Impact Analysis
                {useRealWeather && (
                  <Badge
                    variant="outline"
                    className="ml-auto bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <Satellite className="h-3 w-3 mr-1" />
                    Live Data
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {useRealWeather
                  ? "Real-time weather conditions from Open-Meteo Marine API"
                  : "How current conditions affect your trip"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Wind Speed</span>
                  </div>
                  <div className="text-lg font-bold">
                    {weatherImpact.windSpeed
                      ? `${weatherImpact.windSpeed.toFixed(1)} m/s`
                      : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {weatherImpact.windSpeed
                      ? `${(weatherImpact.windSpeed * 1.94384).toFixed(
                          1
                        )} knots`
                      : "Wind data unavailable"}
                  </div>
                </div>

                <div className="p-3 bg-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Waves className="h-4 w-4 text-cyan-500" />
                    <span className="text-sm font-medium">Wave Height</span>
                  </div>
                  <div className="text-lg font-bold">
                    {weatherImpact.waveHeight
                      ? `${weatherImpact.waveHeight.toFixed(1)} m`
                      : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {weatherImpact.waveHeight
                      ? `${(weatherImpact.waveHeight * 3.28084).toFixed(
                          1
                        )} feet`
                      : "Wave data unavailable"}
                  </div>
                </div>

                <div className="p-3 bg-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Fuel Impact</span>
                  </div>
                  <div className="text-lg font-bold">
                    +{((weatherImpact.fuel - 1) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((1 - weatherImpact.speed) * 100).toFixed(0)}% speed
                    reduction
                  </div>
                </div>

                {weatherImpact.visibility && (
                  <div className="p-3 bg-accent rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Visibility</span>
                    </div>
                    <div className="text-lg font-bold">
                      {(weatherImpact.visibility / 1000).toFixed(1)} km
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(weatherImpact.visibility * 0.000621371).toFixed(1)}{" "}
                      miles
                    </div>
                  </div>
                )}
              </div>

              <Alert
                className={`${
                  weatherImpact.safety === "high"
                    ? "border-red-500"
                    : weatherImpact.safety === "medium"
                    ? "border-amber-500"
                    : "border-green-500"
                } mb-4`}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center gap-2 mb-2">
                    <strong className="capitalize">
                      Safety Level: {weatherImpact.safety}
                    </strong>
                    {useRealWeather && realWeatherCondition && (
                      <Badge variant="outline" className="text-xs">
                        Sea State: {realWeatherCondition.condition}
                      </Badge>
                    )}
                  </div>
                  <div>{weatherImpact.description}</div>
                  {useRealWeather && weatherImpact.timestamp && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Updated: {weatherImpact.timestamp.toLocaleTimeString()}
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {useRealWeather ? (
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Satellite className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm text-green-800 dark:text-green-400">
                        Live Weather Data
                      </span>
                    </div>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      <li>• Real-time marine conditions from Open-Meteo</li>
                      <li>• Automatic fuel adjustment based on sea state</li>
                      <li>• Combined wind and wave impact analysis</li>
                      <li>• Updated every few minutes for accuracy</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Thermometer className="h-4 w-4 mr-2" />
                    Temperature
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Wind className="h-4 w-4 mr-2" />
                    Wind Speed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visibility
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Route Optimization
              </CardTitle>
              <CardDescription>
                Suggestions to improve your trip efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedHotspots.length > 2 && (
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Optimization Available</strong>
                      <br />
                      Reordering your hotspots could save approximately 15% fuel
                      and 30 minutes.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-accent rounded-lg">
                    <div className="font-medium text-sm mb-1">
                      Fuel Efficiency Tips
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Maintain steady speeds between hotspots</li>
                      <li>• Plan fishing times around tidal conditions</li>
                      <li>• Consider weather windows for return journey</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-accent rounded-lg">
                    <div className="font-medium text-sm mb-1">
                      Safety Recommendations
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• File float plan with harbor master</li>
                      <li>• Check emergency equipment expiry dates</li>
                      <li>• Verify communication equipment function</li>
                    </ul>
                  </div>

                  <Button className="w-full">
                    <Route className="h-4 w-4 mr-2" />
                    Optimize Route Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
