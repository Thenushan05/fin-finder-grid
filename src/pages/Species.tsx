import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockSpecies } from "@/services/mockData";
import { useState } from "react";
import { Search, Fish, Anchor, Thermometer, Calendar } from "lucide-react";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Species() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState(mockSpecies[0]);

  const filteredSpecies = mockSpecies.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Species & Spawning Intelligence</h2>
        <p className="text-muted-foreground">Browse fish species profiles and spawning patterns</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Species List */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Species Library</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search species..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredSpecies.map((species) => (
              <button
                key={species.id}
                onClick={() => setSelectedSpecies(species)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedSpecies.id === species.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-foreground">{species.name}</p>
                  <Badge variant="outline">{species.code}</Badge>
                </div>
                <p className="text-xs text-muted-foreground italic">{species.scientificName}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Species Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Fish className="h-6 w-6 text-primary" />
                    {selectedSpecies.name}
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    {selectedSpecies.scientificName} • {selectedSpecies.code}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    selectedSpecies.sustainabilityStatus === "Good"
                      ? "default"
                      : selectedSpecies.sustainabilityStatus === "Moderate"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-sm"
                >
                  {selectedSpecies.sustainabilityStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{selectedSpecies.description}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Anchor className="h-4 w-4 text-primary" />
                    <span>Habitat Depth</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedSpecies.habitatDepth.min}m - {selectedSpecies.habitatDepth.max}m
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Thermometer className="h-4 w-4 text-primary" />
                    <span>SST Range</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedSpecies.sstRange.min}°C - {selectedSpecies.sstRange.max}°C
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Spawning Season</span>
                </div>
                <div className="grid grid-cols-12 gap-1">
                  {monthNames.map((month, idx) => (
                    <div
                      key={month}
                      className={`text-center p-2 rounded text-xs font-medium transition-colors ${
                        selectedSpecies.spawningMonths.includes(idx + 1)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {month}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Recommended Gear</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSpecies.recommendedGear.map((gear) => (
                    <Badge key={gear} variant="secondary">
                      {gear}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
