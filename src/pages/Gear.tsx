import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockGear } from "@/services/mockData";
import { Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function Gear() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Gear Management</h2>
          <p className="text-muted-foreground">Fishing equipment library and regulations</p>
        </div>
        <Button variant="default">
          <Wrench className="mr-2 h-4 w-4" />
          Add New Gear
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockGear.map((gear) => (
          <Card key={gear.id} className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-foreground">{gear.name}</CardTitle>
                  <CardDescription>{gear.code}</CardDescription>
                </div>
                <Badge
                  variant={
                    gear.status === "Permitted"
                      ? "default"
                      : gear.status === "Restricted"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {gear.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Target Species</p>
                <div className="flex flex-wrap gap-1">
                  {gear.targetSpecies.map((species) => (
                    <Badge key={species} variant="outline" className="text-xs">
                      {species}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Depth Range:</span>
                  <span className="font-medium text-foreground">
                    {gear.depthRange.min}m - {gear.depthRange.max}m
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selectivity:</span>
                  <Badge
                    variant={gear.selectivity === "High" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {gear.selectivity}
                  </Badge>
                </div>

                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Bycatch Risk:</span>
                  <div className="flex items-center gap-1">
                    {gear.bycatchRisk === "Low" ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <Badge
                      variant={gear.bycatchRisk === "Low" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {gear.bycatchRisk}
                    </Badge>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-accent/50">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Gear Regulations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Permitted Gear</p>
              <p className="text-sm text-muted-foreground">
                Longline, Purse Seine, and Pole & Line fishing methods are fully permitted for registered vessels.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Restricted Gear</p>
              <p className="text-sm text-muted-foreground">
                Gillnets require special permits and seasonal restrictions apply. High bycatch risk zones monitored.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
