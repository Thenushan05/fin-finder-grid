import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockHotspots } from "@/services/mockData";
import { useState } from "react";
import { Ship, Fuel, DollarSign, Map, Calculator } from "lucide-react";

export default function TripPlanner() {
  const [fuelRate, setFuelRate] = useState("25");
  const [fuelPrice, setFuelPrice] = useState("1.2");
  const [selectedHotspots, setSelectedHotspots] = useState<number[]>([0, 1]);

  const calculateDistance = (spots: number[]) => {
    // Simple estimation: 50-150 km per hotspot
    return spots.length * 85;
  };

  const distance = calculateDistance(selectedHotspots);
  const fuelUsed = (distance / 10) * parseFloat(fuelRate || "0");
  const fuelCost = fuelUsed * parseFloat(fuelPrice || "0");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Trip Planner & Fuel Estimation</h2>
        <p className="text-muted-foreground">Optimize routes and calculate costs</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <Card className="border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Trip Configuration
            </CardTitle>
            <CardDescription>Set vessel and route parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="harbor">Departure Harbor</Label>
              <Select defaultValue="colombo">
                <SelectTrigger id="harbor">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="colombo">Colombo</SelectItem>
                  <SelectItem value="galle">Galle</SelectItem>
                  <SelectItem value="trinco">Trincomalee</SelectItem>
                  <SelectItem value="negombo">Negombo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vessel">Vessel Type</Label>
              <Select defaultValue="medium">
                <SelectTrigger id="vessel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small Boat (&lt;15m)</SelectItem>
                  <SelectItem value="medium">Medium Vessel (15-24m)</SelectItem>
                  <SelectItem value="large">Large Vessel (&gt;24m)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelRate">Fuel Consumption (L/hr)</Label>
              <Input
                id="fuelRate"
                type="number"
                value={fuelRate}
                onChange={(e) => setFuelRate(e.target.value)}
                placeholder="25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelPrice">Fuel Price ($/L)</Label>
              <Input
                id="fuelPrice"
                type="number"
                step="0.1"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                placeholder="1.2"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Hotspots</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mockHotspots.map((hotspot, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-accent cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedHotspots.includes(idx)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedHotspots([...selectedHotspots, idx]);
                        } else {
                          setSelectedHotspots(selectedHotspots.filter((i) => i !== idx));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-foreground">{hotspot.species}</p>
                      <p className="text-xs text-muted-foreground">
                        {hotspot.lat.toFixed(2)}°N, {hotspot.lng.toFixed(2)}°E
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {(hotspot.probability * 100).toFixed(0)}%
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            <Button variant="default" className="w-full">
              <Map className="mr-2 h-4 w-4" />
              Calculate Route
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Preview */}
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="relative w-full h-[400px] bg-gradient-to-br from-primary/10 via-accent to-primary/20 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 p-6 bg-card/90 backdrop-blur rounded-lg border border-border max-w-md">
                    <Ship className="h-16 w-16 mx-auto text-primary" />
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Route Visualization</h3>
                      <p className="text-muted-foreground">
                        Interactive map showing optimized route from harbor to selected hotspots
                      </p>
                    </div>
                    <Badge variant="default">Route Optimization Ready</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Map className="h-4 w-4 text-primary" />
                  <span>Total Distance</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{distance}</p>
                <p className="text-sm text-muted-foreground">kilometers</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Fuel className="h-4 w-4 text-primary" />
                  <span>Fuel Required</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{fuelUsed.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">liters</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span>Estimated Cost</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">${fuelCost.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">fuel only</p>
              </CardContent>
            </Card>
          </div>

          {/* Trip Summary */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Trip Summary</CardTitle>
              <CardDescription>Estimated trip details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-accent">
                <span className="text-muted-foreground">Selected Hotspots:</span>
                <span className="font-semibold text-foreground">{selectedHotspots.length} locations</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-accent">
                <span className="text-muted-foreground">Estimated Duration:</span>
                <span className="font-semibold text-foreground">{(distance / 20).toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-accent">
                <span className="text-muted-foreground">Average Catch Probability:</span>
                <span className="font-semibold text-foreground">
                  {(
                    (selectedHotspots.reduce((sum, idx) => sum + mockHotspots[idx].probability, 0) /
                      selectedHotspots.length) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
