import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockPriceData, mockSpecies } from "@/services/mockData";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Market() {
  const latestPrices = mockPriceData[mockPriceData.length - 1];
  const previousPrices = mockPriceData[mockPriceData.length - 2];

  const speciesWithPrices = mockSpecies.map((species) => {
    const current = latestPrices[species.code as keyof typeof latestPrices] as number;
    const previous = previousPrices[species.code as keyof typeof previousPrices] as number;
    const change = ((current - previous) / previous) * 100;
    return { ...species, currentPrice: current, priceChange: change };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Market Trends & Price Intelligence</h2>
        <p className="text-muted-foreground">Track wholesale prices and economic indicators</p>
      </div>

      {/* Top 3 Most Valuable */}
      <div className="grid gap-4 md:grid-cols-3">
        {speciesWithPrices
          .sort((a, b) => b.currentPrice - a.currentPrice)
          .slice(0, 3)
          .map((species, idx) => (
            <Card key={species.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={idx === 0 ? "default" : "secondary"}>
                    {idx === 0 ? "Highest Value" : `Top ${idx + 1}`}
                  </Badge>
                  {species.priceChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-primary" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <CardTitle className="text-foreground">{species.name}</CardTitle>
                <CardDescription>{species.code}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-3xl font-bold text-foreground">
                    {species.currentPrice}
                  </span>
                  <span className="text-sm text-muted-foreground">/kg</span>
                </div>
                <p className={`text-sm mt-2 ${species.priceChange > 0 ? "text-primary" : "text-destructive"}`}>
                  {species.priceChange > 0 ? "+" : ""}
                  {species.priceChange.toFixed(1)}% from last month
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Price Trends Chart */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">6-Month Price Trends</CardTitle>
          <CardDescription>Wholesale market prices per kilogram</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={mockPriceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{ value: "Price ($/kg)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="YFT"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Yellowfin Tuna"
              />
              <Line
                type="monotone"
                dataKey="BET"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                name="Bigeye Tuna"
              />
              <Line
                type="monotone"
                dataKey="SKJ"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                name="Skipjack Tuna"
              />
              <Line
                type="monotone"
                dataKey="COM"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                name="Seer Fish"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* All Species Prices */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Current Market Prices</CardTitle>
          <CardDescription>Latest wholesale prices by species</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {speciesWithPrices.map((species) => (
              <div
                key={species.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{species.name}</p>
                  <p className="text-sm text-muted-foreground">{species.code}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">${species.currentPrice}</p>
                    <p className="text-xs text-muted-foreground">per kg</p>
                  </div>
                  <Badge
                    variant={species.priceChange > 0 ? "default" : "secondary"}
                    className="min-w-[80px] justify-center"
                  >
                    {species.priceChange > 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {species.priceChange > 0 ? "+" : ""}
                    {species.priceChange.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
