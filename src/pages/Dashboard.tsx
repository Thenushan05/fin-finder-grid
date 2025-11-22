import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fish, TrendingUp, MapPin, Calendar } from "lucide-react";
import { mockSpecies, mockHotspots, getCurrentMonsoon } from "@/services/mockData";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const currentMonsoon = getCurrentMonsoon();
  const topSpecies = mockSpecies.slice(0, 3);
  const activeHotspots = mockHotspots.length;
  const highProbabilitySpots = mockHotspots.filter(h => h.probability > 0.8).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome to your fisheries intelligence center</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Active Hotspots</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeHotspots}</div>
            <p className="text-xs text-muted-foreground">
              {highProbabilitySpots} high probability
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Current Season</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">{currentMonsoon}</div>
            <p className="text-xs text-muted-foreground">Active monsoon period</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Species Tracked</CardTitle>
            <Fish className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mockSpecies.length}</div>
            <p className="text-xs text-muted-foreground">Commercial species</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Market Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">+12%</div>
            <p className="text-xs text-muted-foreground">Average price increase</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top Species This Season</CardTitle>
            <CardDescription>Best catches for current conditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topSpecies.map((species) => (
              <div key={species.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{species.name}</p>
                  <p className="text-sm text-muted-foreground">{species.code}</p>
                </div>
                <Badge
                  variant={
                    species.sustainabilityStatus === "Good"
                      ? "default"
                      : species.sustainabilityStatus === "Moderate"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {species.sustainabilityStatus}
                </Badge>
              </div>
            ))}
            <Link to="/species">
              <Button variant="outline" className="w-full">View All Species</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">High-Probability Zones</CardTitle>
            <CardDescription>Active fishing hotspots today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockHotspots.slice(0, 3).map((hotspot, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                <div>
                  <p className="font-medium text-foreground">
                    {hotspot.lat.toFixed(2)}°N, {hotspot.lng.toFixed(2)}°E
                  </p>
                  <p className="text-sm text-muted-foreground">{hotspot.species} • Depth: {hotspot.depth}m</p>
                </div>
                <Badge variant="default">
                  {(hotspot.probability * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
            <Link to="/hotspot-map">
              <Button variant="outline" className="w-full">View Full Map</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription>Navigate to key features</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/hotspot-map">
            <Button variant="secondary" className="w-full justify-start">
              <MapPin className="mr-2 h-4 w-4" />
              View Hotspot Map
            </Button>
          </Link>
          <Link to="/trip-planner">
            <Button variant="secondary" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Plan Trip
            </Button>
          </Link>
          <Link to="/market">
            <Button variant="secondary" className="w-full justify-start">
              <Fish className="mr-2 h-4 w-4" />
              Check Prices
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
