import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Info,
  Activity,
  AlertTriangle,
  Fish,
  BarChart3,
  ChevronRight,
  Wind,
  ArrowUpRight,
  ArrowDownRight,
  Gem,
  RefreshCw,
  Loader2,
  Cpu,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { format } from "date-fns";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  marketApi,
  type MarketSummaryResponse,
  type PredictResponse,
  type WeekOutlook,
  type SeasonalResponse,
  type FeatureImportance,
  type MultiSpeciesPoint,
  type FestivalEvent,
} from "@/services/marketApi";

const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#f43f5e",
  "#06b6d4",
  "#a3e635",
];

export default function Market() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { toast } = useToast();

  const [selectedSpecies, setSelectedSpecies] = useState("YFT");
  const [timeScale, setTimeScale] = useState<"7d" | "30d">("7d");
  const [forecastCodes, setForecastCodes] = useState(["YFT", "BET", "SKJ"]);

  const [summary, setSummary] = useState<MarketSummaryResponse | null>(null);
  const [predict, setPredict] = useState<PredictResponse | null>(null);
  const [weekOut, setWeekOut] = useState<WeekOutlook[] | null>(null);
  const [seasonal, setSeasonal] = useState<SeasonalResponse | null>(null);
  const [multiData, setMultiData] = useState<MultiSpeciesPoint[] | null>(null);
  const [featImp, setFeatImp] = useState<FeatureImportance[] | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingMulti, setLoadingMulti] = useState(true);
  const [loadingFestivals, setLoadingFestivals] = useState(true);
  const [festivals, setFestivals] = useState<FestivalEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── loaders ────────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const [s, fi] = await Promise.all([
        marketApi.summary(),
        marketApi.featureImportance(),
      ]);
      setSummary(s);
      setFeatImp(fi.features);
      setLastUpdated(new Date());
    } catch {
      toast({
        title: "Backend offline",
        description: "Market data unavailable",
        variant: "destructive",
      });
    } finally {
      setLoadingSummary(false);
    }
  }, [toast]);

  const loadDetail = useCallback(async (code: string) => {
    setLoadingDetail(true);
    try {
      const [p, w, sea] = await Promise.all([
        marketApi.predict(code),
        marketApi.weeklyOutlook(code),
        marketApi.seasonal(code),
      ]);
      setPredict(p);
      setWeekOut(w.weeks);
      setSeasonal(sea);
    } catch {
      /* silent */
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const loadMulti = useCallback(async (codes: string[], days: number) => {
    setLoadingMulti(true);
    try {
      const r = await marketApi.multiSpecies(codes, days);
      setMultiData(r.points);
    } catch {
      /* silent */
    } finally {
      setLoadingMulti(false);
    }
  }, []);

  const loadFestivals = useCallback(async () => {
    setLoadingFestivals(true);
    try {
      const r = await marketApi.festivals(60);
      setFestivals(r.festivals);
    } catch {
      /* silent */
    } finally {
      setLoadingFestivals(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
    loadFestivals();
  }, [loadSummary, loadFestivals]);
  useEffect(() => {
    loadDetail(selectedSpecies);
  }, [selectedSpecies, loadDetail]);
  useEffect(() => {
    loadMulti(forecastCodes, timeScale === "7d" ? 7 : 30);
  }, [forecastCodes, timeScale, loadMulti]);

  // ── derived ────────────────────────────────────────────────────────────────
  const currentSpeciesName =
    summary?.species?.find((s) => s.code === selectedSpecies)?.name ??
    selectedSpecies;
  const gridCol = isDark ? "#334155" : "#e2e8f0";
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const subText = isDark ? "#94a3b8" : "#64748b";
  const textMain = isDark ? "#f8fafc" : "#0f172a";

  const detailRow = summary?.species?.find((s) => s.code === selectedSpecies);
  const trendLabel = (t?: string) =>
    t === "Up" ? "Bullish" : t === "Down" ? "Bearish" : "Neutral";
  const trendBg = (t?: string) =>
    t === "Up"
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      : t === "Down"
        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
        : "bg-slate-500/10 text-slate-400 border-slate-500/20";

  /* inline sparkline */
  const SparkLine = ({ data, color }: { data: number[]; color: string }) => {
    if (!data?.length) return null;
    const w = 80;
    const h = 28;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data
      .map(
        (v, i) =>
          `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`,
      )
      .join(" ");
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="overflow-visible"
      >
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0C15] p-4 lg:p-8 font-sans space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Market Intelligence
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1 flex items-center gap-2">
            ML-powered price forecasting for Sri Lankan fish markets
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                · updated {format(lastUpdated, "HH:mm")}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSummary}
            disabled={loadingSummary}
            className="h-9 gap-2 text-xs font-bold"
          >
            {loadingSummary ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Refresh
          </Button>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
              <SelectTrigger className="w-[200px] border-none shadow-none bg-transparent focus:ring-0 px-2 h-9 text-sm font-bold">
                <SelectValue placeholder="Select Species" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {(summary?.species ?? []).map((s) => (
                  <SelectItem
                    key={s.code}
                    value={s.code}
                    className="py-2 cursor-pointer"
                  >
                    <span className="font-mono text-xs text-slate-400 mr-2">
                      {s.code}
                    </span>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── KPI STRIP ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loadingSummary
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="border-none shadow-md bg-white dark:bg-[#1E1E2E]"
              >
                <CardContent className="p-5">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3 w-20" />
                  <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32" />
                </CardContent>
              </Card>
            ))
          : (summary?.species?.slice(0, 4) ?? []).map((sp, i) => (
              <Card
                key={sp.code}
                onClick={() => setSelectedSpecies(sp.code)}
                className={cn(
                  "border-none shadow-md cursor-pointer transition-all hover:shadow-lg",
                  selectedSpecies === sp.code
                    ? "bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-2"
                    : "bg-white dark:bg-[#1E1E2E]",
                )}
              >
                <CardContent className="p-5">
                  <div
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider mb-1",
                      selectedSpecies === sp.code
                        ? "text-indigo-200"
                        : "text-slate-400",
                    )}
                  >
                    {sp.code} · {sp.name}
                  </div>
                  <div
                    className={cn(
                      "text-3xl font-black tracking-tight",
                      sp.wow_pct > 0
                        ? selectedSpecies === sp.code
                          ? "text-green-200"
                          : "text-emerald-500"
                        : sp.wow_pct < 0
                          ? selectedSpecies === sp.code
                            ? "text-red-200"
                            : "text-rose-500"
                          : selectedSpecies === sp.code
                            ? "text-indigo-100"
                            : "text-slate-500",
                    )}
                  >
                    {sp.wow_pct > 0 ? "+" : ""}
                    {sp.wow_pct.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* -- FESTIVAL BOOST BANNER ----------------------------------------------- */}
      {!loadingSummary && summary?.festival_name && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-sm">
          <span className="text-lg">🎉</span>
          <div className="flex-1">
            <span className="font-bold text-amber-700 dark:text-amber-400">
              Festival Boost Active:
            </span>{" "}
            <span className="text-amber-700 dark:text-amber-300">
              {summary.festival_name}
            </span>
            {summary.festival_days !== null && summary.festival_days > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {" "}
                (in {summary.festival_days} days)
              </span>
            )}
            {summary.festival_days === 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {" "}
                · Today
              </span>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              ML boost active
            </span>
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
              +{summary.festival_boost.toFixed(1)} pressure
            </Badge>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── MAIN COLUMN ───────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">
          {/* FEATURED INSIGHT */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-white to-indigo-50/50 dark:from-[#1E1E2E] dark:to-[#151621] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <CardContent className="p-8 relative z-10">
              {loadingDetail ? (
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading {selectedSpecies} forecast…
                </div>
              ) : (
                <div className="flex flex-col md:flex-row justify-between gap-8 md:items-center">
                  <div className="space-y-5 flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 dark:bg-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {currentSpeciesName} · {format(new Date(), "dd MMM yyyy")}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-4 flex-wrap">
                        <h2
                          className={cn(
                            "text-6xl font-black tracking-tighter",
                            predict != null && predict.wow_pct > 0
                              ? "text-emerald-500"
                              : predict != null && predict.wow_pct < 0
                                ? "text-rose-500"
                                : "text-slate-900 dark:text-white",
                          )}
                        >
                          {predict != null
                            ? `${predict.wow_pct > 0 ? "+" : ""}${predict.wow_pct.toFixed(1)}%`
                            : ""}
                        </h2>
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border",
                            trendBg(detailRow?.trend),
                          )}
                        >
                          {detailRow?.trend === "Up" ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : detailRow?.trend === "Down" ? (
                            <ArrowDownRight className="w-4 h-4" />
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                          {trendLabel(detailRow?.trend)}
                        </div>
                        {predict?.wow_pct !== undefined && (
                          <span
                            className={cn(
                              "text-sm font-bold",
                              predict.wow_pct > 0
                                ? "text-emerald-500"
                                : predict.wow_pct < 0
                                  ? "text-rose-500"
                                  : "text-slate-400",
                            )}
                          >
                            {predict.wow_pct > 0 ? "+" : ""}
                            {predict.wow_pct.toFixed(1)}% vs last week
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                        ML ensemble model signals a{" "}
                        <strong className="text-slate-900 dark:text-white">
                          {trendLabel(detailRow?.trend).toLowerCase()}
                        </strong>{" "}
                        outlook for {currentSpeciesName}. Forecast confidence:{" "}
                        <span className="font-semibold border-b-2 border-indigo-500/40">
                          {predict?.confidence !== undefined
                            ? `${(predict.confidence * 100).toFixed(0)}%`
                            : "—"}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 gap-1.5 py-1.5 pl-2 pr-3"
                      >
                        <Cpu className="w-3.5 h-3.5" /> VotingRegressor
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1.5 py-1.5 pl-2 pr-3"
                      >
                        <Activity className="w-3.5 h-3.5" /> XGBoost + Ridge
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          predict?.model_used === false
                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 gap-1.5 py-1.5 pl-2 pr-3"
                            : "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 gap-1.5 py-1.5 pl-2 pr-3"
                        }
                      >
                        <Wind className="w-3.5 h-3.5" />
                        {predict?.model_used === false
                          ? "Heuristic fallback"
                          : "Live ML model"}
                      </Badge>
                      {(predict?.festival_name || summary?.festival_name) && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1.5 py-1.5 pl-2 pr-3"
                        >
                          <Calendar className="w-3.5 h-3.5" />{" "}
                          {predict?.festival_name ??
                            summary?.festival_name ??
                            ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* confidence ring */}
                  <div className="relative w-44 h-44 flex-shrink-0 items-center justify-center hidden md:flex">
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full border-[12px] opacity-20",
                        detailRow?.trend === "Up"
                          ? "border-emerald-500"
                          : "border-rose-500",
                      )}
                    />
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full border-[12px] border-t-transparent animate-[spin_3s_linear_infinite]",
                        detailRow?.trend === "Up"
                          ? "border-emerald-500"
                          : "border-rose-500",
                      )}
                    />
                    <div className="text-center z-10">
                      <span className="block text-3xl font-bold text-slate-800 dark:text-white">
                        {predict?.confidence !== undefined
                          ? `${(predict.confidence * 100).toFixed(0)}`
                          : "—"}
                        <span className="text-sm align-top">%</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                        Probability
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 7-DAY AREA CHART */}
          <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold">
                  7-Day Price Forecast
                </CardTitle>
                <CardDescription>
                  Predicted % change vs today (baseline = 0%)
                </CardDescription>
              </div>
              {detailRow?.trend && (
                <Badge
                  className={cn(
                    "text-xs",
                    detailRow.trend === "Up"
                      ? "bg-emerald-500"
                      : detailRow.trend === "Down"
                        ? "bg-rose-500"
                        : "bg-slate-500",
                  )}
                >
                  {detailRow.trend}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="h-[260px] w-full pt-2">
              {loadingDetail ? (
                <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={predict?.forecast_7d ?? []}
                    margin={{ top: 10, right: 10, left: 55, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="priceGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={gridCol}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: subText, fontSize: 10 }}
                      dy={6}
                      tickFormatter={(v) => v?.slice(5) ?? v}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: subText, fontSize: 10 }}
                      tickFormatter={(v) =>
                        `${((v / (predict?.today_price ?? 1)) * 100 - 100).toFixed(1)}%`
                      }
                      width={70}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: cardBg,
                        borderColor: gridCol,
                        borderRadius: 10,
                        color: textMain,
                      }}
                      formatter={(v: number) => [
                        `${((v / (predict?.today_price ?? 1)) * 100 - 100).toFixed(1)}%`,
                        "Price",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fill="url(#priceGrad)"
                      dot={{
                        r: 4,
                        fill: cardBg,
                        strokeWidth: 2,
                        stroke: "#6366f1",
                      }}
                      activeDot={{ r: 7 }}
                    />
                    {/* Festival day markers */}
                    {(predict?.forecast_7d ?? [])
                      .filter((d) => (d as any).festival_boost > 0)
                      .map((d) => (
                        <ReferenceLine
                          key={d.date}
                          x={d.date}
                          stroke="#f59e0b"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: "Fest",
                            position: "top",
                            fontSize: 9,
                          }}
                        />
                      ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* MULTI-SPECIES INDEX CHART */}
          <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 gap-4 flex-wrap">
              <div>
                <CardTitle className="text-base font-bold">
                  Multi-Species Price Index
                </CardTitle>
                <CardDescription>
                  Normalized index (baseline 100)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-bold gap-1"
                    >
                      {forecastCodes.length} Species{" "}
                      <ChevronRight className="h-3 w-3 rotate-90" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {[
                      "YFT",
                      "BET",
                      "SKJ",
                      "COM",
                      "SWO",
                      "MAK",
                      "BUM",
                      "ALB",
                    ].map((code) => (
                      <DropdownMenuCheckboxItem
                        key={code}
                        checked={forecastCodes.includes(code)}
                        onCheckedChange={() =>
                          setForecastCodes((prev) =>
                            prev.includes(code)
                              ? prev.length > 1
                                ? prev.filter((c) => c !== code)
                                : prev
                              : prev.length < 5
                                ? [...prev, code]
                                : prev,
                          )
                        }
                        onSelect={(e) => e.preventDefault()}
                        className="text-xs"
                      >
                        {code}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Tabs
                  value={timeScale}
                  onValueChange={(v) => setTimeScale(v as "7d" | "30d")}
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="7d" className="text-xs h-6 px-2">
                      7D
                    </TabsTrigger>
                    <TabsTrigger value="30d" className="text-xs h-6 px-2">
                      30D
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="h-[280px] w-full pt-2">
              {loadingMulti ? (
                <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading
                  multi-series…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={multiData ?? []}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={gridCol}
                    />
                    <ReferenceLine
                      y={100}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      opacity={0.6}
                      label={{
                        value: "Baseline 100",
                        fill: "#f43f5e",
                        fontSize: 9,
                        position: "insideTopLeft",
                      }}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: subText, fontSize: 10 }}
                      tickFormatter={(v) => v?.slice(5) ?? v}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: subText, fontSize: 10 }}
                      tickFormatter={(v) => `${v}`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: cardBg,
                        borderColor: gridCol,
                        borderRadius: 10,
                        color: textMain,
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, fontWeight: "bold" }}
                    />
                    {forecastCodes.map((code, i) => (
                      <Line
                        key={code}
                        type="monotone"
                        dataKey={`${code}_idx`}
                        name={code}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* TOP PRICES BAR */}
          <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E] flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Week-on-Week % Change Ranking
              </CardTitle>
              <CardDescription>
                ML-predicted WoW % movement per species • VotingRegressor
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {loadingSummary ? (
                <div className="h-[220px] flex items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...(summary?.species ?? [])]
                        .sort((a, b) => b.wow_pct - a.wow_pct)
                        .slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 28, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke={gridCol}
                      />
                      <ReferenceLine x={0} stroke={gridCol} strokeWidth={1.5} />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: subText, fontSize: 10 }}
                        tickFormatter={(v) =>
                          `${v > 0 ? "+" : ""}${v.toFixed(1)}%`
                        }
                      />
                      <YAxis
                        dataKey="code"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: subText,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                        width={28}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: cardBg,
                          borderColor: gridCol,
                          borderRadius: 10,
                          color: textMain,
                        }}
                        formatter={(v: number, _n, p) => [
                          `${v > 0 ? "+" : ""}${v.toFixed(2)}%`,
                          `${p.payload.name} WoW`,
                        ]}
                      />
                      <Bar dataKey="wow_pct" radius={[0, 4, 4, 0]} barSize={20}>
                        {[...(summary?.species ?? [])]
                          .sort((a, b) => b.wow_pct - a.wow_pct)
                          .slice(0, 8)
                          .map((e, i) => (
                            <Cell
                              key={i}
                              fill={e.wow_pct >= 0 ? "#10b981" : "#f43f5e"}
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEASONAL CHART */}
          <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold">
                  Seasonal Price Pattern
                </CardTitle>
                <CardDescription>
                  12-month ML-predicted pricing cycle for {currentSpeciesName}
                </CardDescription>
              </div>
              {seasonal && (
                <div className="text-right text-xs text-slate-500">
                  <div>
                    Peak:{" "}
                    <strong className="text-emerald-500">
                      Month {seasonal.peak_month}
                    </strong>
                  </div>
                  <div>
                    Low:{" "}
                    <strong className="text-rose-500">
                      Month {seasonal.trough_month}
                    </strong>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="h-[260px] pt-2">
              {loadingDetail ? (
                <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={seasonal?.monthly ?? []}
                    margin={{ top: 10, right: 10, left: 55, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="seasonGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={gridCol}
                    />
                    <XAxis
                      dataKey="month_n"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: subText, fontSize: 10 }}
                      tickFormatter={(v) =>
                        [
                          "",
                          "",
                          ,
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ][v] ?? v
                      }
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: subText, fontSize: 10 }}
                      tickFormatter={(v) =>
                        `${((v / (seasonal?.avg_price ?? 1)) * 100 - 100).toFixed(1)}%`
                      }
                      width={55}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: cardBg,
                        borderColor: gridCol,
                        borderRadius: 10,
                        color: textMain,
                      }}
                      formatter={(v: number): [string, string] => [
                        `${((v / (seasonal?.avg_price ?? 1)) * 100 - 100).toFixed(1)}%`,
                        "vs Avg",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#seasonGrad)"
                      dot={{
                        r: 3,
                        fill: cardBg,
                        strokeWidth: 2,
                        stroke: "#10b981",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* SEASONAL STATS */}
          {seasonal && (
            <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <CardHeader>
                <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
                  Seasonal Stats
                </div>
                <CardTitle className="text-xl font-bold">
                  {currentSpeciesName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const pct =
                      seasonal.avg_price > 0
                        ? (
                            (seasonal.seasonal_range / seasonal.avg_price) *
                            100
                          ).toFixed(1)
                        : "0.0";
                    return [
                      {
                        label: "Season Swing",
                        value: `±${(Number(pct) / 2).toFixed(1)}%`,
                      },
                      {
                        label: "Confidence",
                        value: `${((detailRow?.confidence ?? 0) * 100).toFixed(0)}%`,
                      },
                    ];
                  })().map((s) => (
                    <div
                      key={s.label}
                      className="p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {s.label}
                      </div>
                      <div className="text-lg font-bold text-white">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4-WEEK OUTLOOK - show % trend rather than avg_price */}
          <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E]">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> 4-Week Outlook
              </CardTitle>
              <CardDescription>
                {currentSpeciesName} rolling forecast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingDetail ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (
                (weekOut ?? []).map((w, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                  >
                    <div className="shrink-0 text-center w-12">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Wk {i + 1}
                      </div>
                      <div
                        className={cn(
                          "text-sm font-black",
                          w.trend === "Up"
                            ? "text-emerald-500"
                            : w.trend === "Down"
                              ? "text-rose-500"
                              : "text-slate-400",
                        )}
                      >
                        {`${w.trend === "Up" ? "" : w.trend === "Down" ? "" : ""}${(w.confidence * 100).toFixed(0)}%`}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <SparkLine
                        data={w.daily.map((d) => d.price)}
                        color={
                          w.trend === "Up"
                            ? "#10b981"
                            : w.trend === "Down"
                              ? "#f43f5e"
                              : "#94a3b8"
                        }
                      />
                      {w.festivals && w.festivals.length > 0 && (
                        <div className="text-[9px] text-amber-500 font-bold truncate mt-0.5">
                          ?? {w.festivals[0]}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <Badge
                        className={cn(
                          "text-[10px] px-1.5 py-0.5",
                          w.trend === "Up"
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : w.trend === "Down"
                              ? "bg-rose-500 hover:bg-rose-600"
                              : "bg-slate-500",
                        )}
                      >
                        {w.trend}
                      </Badge>
                      <TrendingUp
                        className={cn(
                          "w-3 h-3",
                          w.trend === "Up"
                            ? "text-emerald-500"
                            : w.trend === "Down"
                              ? "text-rose-400 rotate-180"
                              : "text-slate-400",
                        )}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* FESTIVAL ALERTS */}
          <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E]">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Festival
                Market Alerts
              </CardTitle>
              <CardDescription>
                ML price impact from Sri Lanka public holidays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingFestivals ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading
                  holidays…
                </div>
              ) : festivals.filter((f) => !f.is_past).length === 0 ? (
                <div className="text-xs text-slate-400 py-2">
                  No upcoming festivals in the next 60 days.
                </div>
              ) : (
                festivals
                  .filter((f) => !f.is_past)
                  .slice(0, 6)
                  .map((a, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                    >
                      <div className="shrink-0 w-9 text-center">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">
                          {format(new Date(a.date), "MMM")}
                        </span>
                        <span className="block text-base font-bold text-slate-700 dark:text-slate-200">
                          {format(new Date(a.date), "dd")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                          {a.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {a.days_until === 0
                            ? "Today"
                            : `In ${a.days_until} days`}{" "}
                          • {a.monsoon}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={cn(
                            "text-sm font-black",
                            a.price_impact_pct > 0
                              ? "text-emerald-500"
                              : "text-slate-400",
                          )}
                        >
                          {a.price_impact_pct > 0 ? "+" : ""}
                          {a.price_impact_pct.toFixed(1)}%
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                          ML impact
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>

          {/* FEATURE IMPORTANCE */}
          <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E] flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Model Feature Importance (XGBoost)
              </CardTitle>
              <CardDescription>
                Which signals drive the price predictions most
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col justify-center">
              {featImp === null ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : featImp.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Model not loaded — feature importance unavailable.
                </p>
              ) : (
                (featImp ?? []).slice(0, 8).map((f, i) => (
                  <div key={f.feature} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 w-20 shrink-0">
                      {f.feature}
                    </span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(f.importance * 100).toFixed(1)}%`,
                          backgroundColor:
                            CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-10 text-right">
                      {(f.importance * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400 hidden lg:block truncate max-w-[160px]">
                      {f.feature}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* SEASONAL RADAR */}
          <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E] flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Seasonal Pattern (% vs Avg)
              </CardTitle>
              <CardDescription>
                Monthly price shape for {currentSpeciesName}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px] flex items-center justify-center">
              {loadingDetail ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={(seasonal?.monthly ?? []).map((m) => ({
                      month: m.month,
                      price: m.price,
                    }))}
                  >
                    <PolarGrid stroke={gridCol} />
                    <PolarAngleAxis
                      dataKey="month"
                      tick={{ fill: subText, fontSize: 9 }}
                    />
                    <PolarRadiusAxis
                      tick={{ fill: subText, fontSize: 8 }}
                      tickCount={4}
                      tickFormatter={(v) => `${v}`}
                    />
                    <Radar
                      dataKey="price"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── WATCHLIST TABLE ────────────────────────────────────────────────── */}
      <Card className="border-none shadow-xl bg-white dark:bg-[#1E1E2E] overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">
                Species Watchlist
              </CardTitle>
              <CardDescription>
                ML-predicted WoW % trends and signals • no raw prices
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={loadSummary}
              disabled={loadingSummary}
              className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 gap-1"
            >
              {loadingSummary ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {[
                    "Species",
                    "WoW %",
                    "Trend",
                    "Confidence",
                    "Sparkline",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingSummary
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : (summary?.species ?? []).map((sp, i) => (
                      <tr
                        key={sp.code}
                        onClick={() => setSelectedSpecies(sp.code)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                          selectedSpecies === sp.code
                            ? "bg-indigo-50/50 dark:bg-indigo-900/10"
                            : "",
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[10px] shadow-sm",
                                selectedSpecies === sp.code
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500",
                              )}
                            >
                              {sp.code}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {sp.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                live
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* WoW % • primary value */}
                        <td
                          className={cn(
                            "px-6 py-4 font-black text-lg",
                            sp.wow_pct > 0
                              ? "text-emerald-500"
                              : sp.wow_pct < 0
                                ? "text-rose-500"
                                : "text-slate-400",
                          )}
                        >
                          {sp.wow_pct > 0 ? "+" : ""}
                          {sp.wow_pct.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={cn(
                              "text-xs gap-1",
                              sp.trend === "Up"
                                ? "bg-emerald-500 hover:bg-emerald-600"
                                : sp.trend === "Down"
                                  ? "bg-rose-500 hover:bg-rose-600"
                                  : "bg-slate-500",
                            )}
                          >
                            {sp.trend === "Up" ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : sp.trend === "Down" ? (
                              <ArrowDownRight className="w-3 h-3" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                            {sp.trend}
                          </Badge>
                        </td>
                        {/* Confidence instead of raw price */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={cn(
                                  "h-1.5 rounded-full",
                                  sp.confidence > 0.75
                                    ? "bg-emerald-500"
                                    : "bg-amber-500",
                                )}
                                style={{
                                  width: `${(sp.confidence * 100).toFixed(0)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-500">
                              {(sp.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <SparkLine
                            data={sp.sparkline ?? []}
                            color={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={cn(
                              "font-bold",
                              sp.action === "Buy"
                                ? "bg-emerald-500 hover:bg-emerald-600"
                                : sp.action === "Sell"
                                  ? "bg-rose-500 hover:bg-rose-600"
                                  : "bg-slate-500",
                            )}
                          >
                            {sp.action}
                          </Badge>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 dark:bg-slate-900/40 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            {summary?.species?.length ?? 0} species · powered by VotingRegressor
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
