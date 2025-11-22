import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Droplets, Thermometer, Waves } from "lucide-react";
import { mockHotspots } from "@/services/mockData";
import { useState } from "react";

export default function HotspotMap() {
  const [selectedHotspot, setSelectedHotspot] = useState(mockHotspots[0]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Fish Hotspot Map</h2>
        <p className="text-muted-foreground">Interactive predictions for optimal fishing zones</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map Placeholder */}
        <Card className="border-border lg:col-span-2">
          <CardContent className="p-0">
            <div className="relative w-full h-[600px] bg-gradient-to-br from-primary/10 via-accent to-primary/20 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 p-6 bg-card/90 backdrop-blur rounded-lg border border-border">
                  <MapPin className="h-16 w-16 mx-auto text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Interactive Map View</h3>
                    <p className="text-muted-foreground max-w-md">
                      The interactive map displays predicted hotspots, depth contours, and environmental layers.
                      Click on markers to view detailed information.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center pt-4">
                    <Badge variant="default">Leaflet/Mapbox Integration Ready</Badge>
                    <Badge variant="secondary">Real-time Data</Badge>
                  </div>
                </div>
              </div>
              
              {/* Mock Hotspot Markers */}
              {mockHotspots.map((hotspot, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedHotspot(hotspot)}
                  className={`absolute w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                    selectedHotspot === hotspot
                      ? "bg-primary border-primary-foreground scale-125 z-10"
                      : "bg-primary/70 border-background hover:scale-110"
                  }`}
                  style={{
                    left: `${15 + idx * 15}%`,
                    top: `${25 + (idx % 3) * 20}%`,
                  }}
                  title={`${hotspot.species} - ${(hotspot.probability * 100).toFixed(0)}%`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hotspot Details */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Selected Hotspot</CardTitle>
              <CardDescription>Environmental conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="text-lg font-semibold text-foreground">
                  {selectedHotspot.lat.toFixed(3)}°N, {selectedHotspot.lng.toFixed(3)}°E
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Target Species</p>
                <Badge variant="default" className="text-base">{selectedHotspot.species}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Catch Probability</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${selectedHotspot.probability * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {(selectedHotspot.probability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-accent">
                  <Waves className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Depth</p>
                    <p className="font-medium text-foreground">{selectedHotspot.depth}m</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg bg-accent">
                  <Thermometer className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">SST</p>
                    <p className="font-medium text-foreground">{selectedHotspot.sst}°C</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg bg-accent">
                  <Droplets className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Chlorophyll</p>
                    <p className="font-medium text-foreground">{selectedHotspot.chl} mg/m³</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">All Hotspots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockHotspots.map((hotspot, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedHotspot(hotspot)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedHotspot === hotspot
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{hotspot.species}</p>
                      <p className="text-xs text-muted-foreground">
                        {hotspot.lat.toFixed(2)}°N, {hotspot.lng.toFixed(2)}°E
                      </p>
                    </div>
                    <Badge variant="outline">{(hotspot.probability * 100).toFixed(0)}%</Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
