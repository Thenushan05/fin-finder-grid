import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Fish,
  TrendingUp,
  MapPin,
  Calendar,
  Thermometer,
  Waves,
  Droplets,
  Activity,
  Clock,
  Navigation,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { marketApi, type SpeciesMeta } from "@/services/marketApi";

const HOTSPOT_LS_KEY = "fishspot_hotspot_scan";

interface Prediction {
  lat: number;
  lon: number;
  score: number;
  confidence_pct: number;
  hotspot_level: string;
  sst?: number | null;
  ssh?: number | null;
  chlo?: number | null;
  sss?: number | null;
  ssd?: number | null;
  depth?: number | null;
  spawn_probability?: number | null;
  spawning?: boolean;
  chlo_source?: string;
  sss_source?: string;
  sst_source?: string;
  data_date?: string;
  ocean_verified?: boolean;
  gebco_depth_m?: number | null;
}

interface ScanSummary {
  high: number;
  moderate: number;
  low: number;
  mean_confidence_pct: number;
  best_confidence_pct: number;
  mean_spacing_km: number;
}

interface ScanResult {
  start_point: { lat: number; lon: number };
  radius_km: number;
  total_points: number;
  ocean_verified_count: number;
  land_filtered: number;
  candidates_generated: number;
  predictions: Prediction[];
  summary: ScanSummary;
}

interface ScanData {
  result: ScanResult;
  startPoint: { lat: number; lng: number };
  meta: {
    species: string;
    threshold: number;
    nPoints: number;
    radiusMult?: number;
  };
  savedAt: number;
}

function avgOf(arr: (number | null | undefined)[]): number | null {
  const valid = arr.filter((v): v is number => v != null && !isNaN(Number(v)));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function levelVariant(
  level: string,
  score: number,
): "default" | "secondary" | "destructive" | "outline" {
  if (level === "core_hotspot") return "destructive";
  if (level === "candidate_hotspot") return "secondary";
  if (score >= 0.7) return "destructive";
  if (score >= 0.4) return "secondary";
  return "outline";
}

function levelLabel(level: string): string {
  if (level === "core_hotspot") return "Core";
  if (level === "candidate_hotspot") return "Candidate";
  return "Low";
}

function getCurrentMonsoon(): string {
  const month = new Date().getMonth() + 1; // 1-12
  if (month === 12 || month <= 3) return "Northeast Monsoon";
  if (month <= 5) return "First Inter-Monsoon";
  if (month <= 9) return "Southwest Monsoon";
  return "Second Inter-Monsoon";
}

export default function Dashboard() {
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [marketSpecies, setMarketSpecies] = useState<SpeciesMeta[]>([]);
  const currentMonsoon = getCurrentMonsoon();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HOTSPOT_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.result?.predictions?.length) {
          setScanData(parsed as ScanData);
        }
      }
    } catch {
      /* corrupted localStorage — ignore */
    }
  }, []);

  // Fetch live species prices from the market model
  useEffect(() => {
    marketApi
      .listSpecies()
      .then((res) => setMarketSpecies(res.species))
      .catch(() => {});
  }, []);

  const preds = scanData?.result?.predictions ?? [];
  const summary = scanData?.result?.summary;
  const totalPoints = scanData?.result?.total_points ?? 0;
  const oceanVerified = scanData?.result?.ocean_verified_count ?? 0;
  const spawnZones = preds.filter((p) => p.spawning === true).length;
  const topHotspots = [...preds].sort((a, b) => b.score - a.score).slice(0, 3);

  const avgSST = avgOf(preds.map((p) => p.sst));
  const avgSSH = avgOf(preds.map((p) => p.ssh));
  const avgCHLO = avgOf(preds.map((p) => p.chlo));
  const avgSSS = avgOf(preds.map((p) => p.sss));

  const savedAt = scanData?.savedAt ? new Date(scanData.savedAt) : null;
  const dataDate =
    preds.find((p) => p.data_date)?.data_date?.slice(0, 10) ?? null;
  const speciesLabel = scanData?.meta?.species ?? "—";
  const threshLabel =
    scanData?.meta?.threshold != null
      ? `${(scanData.meta.threshold * 100).toFixed(0)}%`
      : "—";

  // Top species by today's ML-predicted market price (real model output)
  const topMarketSpecies = [...marketSpecies]
    .sort((a, b) => b.current_price - a.current_price)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Dashboard Overview
          </h2>
          <p className="text-muted-foreground">
            {scanData
              ? `Last scan — ${speciesLabel} · ${totalPoints} points · Threshold ${threshLabel}`
              : "Welcome to your fisheries intelligence center"}
          </p>
        </div>
        {savedAt && (
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1 justify-end">
              <Clock className="h-3 w-3" />
              <span>
                Scanned{" "}
                {savedAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {dataDate && (
              <div className="mt-0.5 text-muted-foreground/70">
                Data: {dataDate}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Hotspot Points
            </CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {scanData ? totalPoints : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {scanData
                ? `${summary?.high ?? 0} high confidence`
                : "Run a scan to see data"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Current Season
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">
              {currentMonsoon}
            </div>
            <p className="text-xs text-muted-foreground">
              Active monsoon period
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Spawn Zones
            </CardTitle>
            <Fish className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {scanData ? spawnZones : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {scanData
                ? spawnZones > 0
                  ? "Spawning activity detected"
                  : "No spawning zones found"
                : "Run a scan to detect"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Best Confidence
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summary ? `${summary.best_confidence_pct}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary
                ? `Avg: ${summary.mean_confidence_pct}%`
                : "Run a scan to see data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ocean Conditions — only when real scan data exists */}
      {scanData && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Ocean Conditions</CardTitle>
            <CardDescription>
              Averages across {totalPoints} scan points
              {oceanVerified > 0 && ` · ${oceanVerified} GEBCO ocean-verified`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card">
                <Thermometer className="h-5 w-5 text-orange-500 mb-1" />
                <p className="text-xs text-muted-foreground text-center">
                  Sea Surface Temp
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {avgSST != null ? `${avgSST.toFixed(1)}°C` : "n/a"}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card">
                <Waves className="h-5 w-5 text-blue-500 mb-1" />
                <p className="text-xs text-muted-foreground text-center">
                  Sea Surface Height
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {avgSSH != null ? `${avgSSH.toFixed(3)} m` : "n/a"}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card">
                <Activity className="h-5 w-5 text-green-500 mb-1" />
                <p className="text-xs text-muted-foreground text-center">
                  Chlorophyll
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {avgCHLO != null
                    ? avgCHLO < 0.01
                      ? `${avgCHLO.toExponential(2)} mg/m³`
                      : `${avgCHLO.toFixed(3)} mg/m³`
                    : "n/a"}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card">
                <Droplets className="h-5 w-5 text-cyan-500 mb-1" />
                <p className="text-xs text-muted-foreground text-center">
                  Salinity
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {avgSSS != null ? `${avgSSS.toFixed(2)} PSU` : "n/a"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Hotspot Zones + Species */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              {scanData ? "Top Hotspot Zones" : "High-Probability Zones"}
            </CardTitle>
            <CardDescription>
              {scanData
                ? "Top-scoring ocean points from last scan"
                : "Run a scan on the Map to see hotspot zones"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scanData ? (
              topHotspots.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {h.lat.toFixed(3)}°N, {h.lon.toFixed(3)}°E
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {h.sst != null ? `SST ${Number(h.sst).toFixed(1)}°C` : ""}
                      {h.depth != null
                        ? ` · ${Math.abs(Number(h.depth)).toFixed(0)} m`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                    <Badge variant={levelVariant(h.hotspot_level, h.score)}>
                      {h.confidence_pct}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {levelLabel(h.hotspot_level)}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        h.spawning
                          ? "border-emerald-400 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0"
                          : "border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500 text-[10px] px-1.5 py-0"
                      }
                    >
                      {h.spawning ? "🥚 Spawn" : "No Spawn"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No scan data yet</p>
                <p className="text-xs mt-1">
                  Run a hotspot scan on the Map page
                </p>
              </div>
            )}
            <Link to="/hotspot-map">
              <Button variant="outline" className="w-full">
                {scanData ? "Rescan on Map" : "View Full Map"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Top Market Species
            </CardTitle>
            <CardDescription>
              Active species in Sri Lankan fish markets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topMarketSpecies.length > 0 ? (
              topMarketSpecies.map((sp) => (
                <div
                  key={sp.code}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{sp.name}</p>
                    <p className="text-sm text-muted-foreground">{sp.code}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Market Active
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <Fish className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Loading market data…</p>
              </div>
            )}
            <Link to="/market">
              <Button variant="outline" className="w-full">
                View Full Market
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Distribution + Scan Details — only when scan data exists */}
      {scanData && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                Confidence Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of {totalPoints} predicted points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: "High Confidence (≥70%)",
                  count: summary?.high ?? 0,
                  color: "bg-green-500",
                },
                {
                  label: "Moderate (40–70%)",
                  count: summary?.moderate ?? 0,
                  color: "bg-yellow-400",
                },
                {
                  label: "Low (<40%)",
                  count: summary?.low ?? 0,
                  color: "bg-red-400",
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold text-foreground">
                      {row.count}
                    </span>
                  </div>
                  <div className="bg-muted rounded-full h-2">
                    <div
                      className={`${row.color} h-2 rounded-full transition-all duration-500`}
                      style={{
                        width:
                          totalPoints > 0
                            ? `${(row.count / totalPoints) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
              {spawnZones > 0 && (
                <div className="mt-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 flex items-center gap-2">
                  <span className="text-lg">🥚</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                      {spawnZones} Spawn Zone{spawnZones > 1 ? "s" : ""}{" "}
                      Detected
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Spawning activity flagged by spawn model (prob ≥65%)
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Last Scan Details
              </CardTitle>
              <CardDescription>
                Scan metadata &amp; ocean data sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Start Point</span>
                <span className="font-medium text-foreground">
                  {scanData.startPoint?.lat?.toFixed(3)}°N,{" "}
                  {scanData.startPoint?.lng?.toFixed(3)}°E
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Target Species</span>
                <span className="font-medium text-foreground">
                  {speciesLabel}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Threshold</span>
                <span className="font-medium text-foreground">
                  {threshLabel}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Scan Radius</span>
                <span className="font-medium text-foreground">
                  {scanData.result.radius_km?.toFixed(1)} km
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Ocean Verified</span>
                <span className="font-medium text-foreground">
                  {oceanVerified}/{totalPoints} pts
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Land Filtered</span>
                <span className="font-medium text-foreground">
                  {scanData.result.land_filtered ?? 0} pts excluded
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Data Date</span>
                <span className="font-medium text-foreground">
                  {dataDate ?? "—"}
                </span>
              </div>
              {preds[0]?.sst_source && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">SST Source</span>
                  <span className="font-medium text-foreground text-right max-w-[160px] truncate">
                    {String(preds[0].sst_source).split("|")[0].trim()}
                  </span>
                </div>
              )}
              {preds[0]?.chlo_source && (
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">CHLO Source</span>
                  <span className="font-medium text-foreground text-right max-w-[160px] truncate">
                    {String(preds[0].chlo_source).split("|")[0].trim()}
                  </span>
                </div>
              )}
              {preds[0]?.sss_source && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">SSS Source</span>
                  <span className="font-medium text-foreground text-right max-w-[160px] truncate">
                    {String(preds[0].sss_source).split("|")[0].trim()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* No scan yet — call to action */}
      {!scanData && (
        <Card className="border-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Navigation className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground mb-1">
              No scan data yet
            </p>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Run a hotspot scan from the map to see live predictions, ocean
              conditions, and spawn zone data here.
            </p>
            <Link to="/hotspot-map">
              <Button>
                <MapPin className="mr-2 h-4 w-4" />
                Open Hotspot Map
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

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
              {scanData ? "Rescan Hotspots" : "View Hotspot Map"}
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
