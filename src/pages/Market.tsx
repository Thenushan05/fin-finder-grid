import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Radar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Calendar,
  Info, Activity, AlertTriangle, Fish,
  BarChart3, ChevronRight, CheckCircle2,
  Wind, Lock
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import {
  mockSpecies,
  mockFeatureImportance,
  mockMultiWeekTrend,
  mockTrendDistribution,
  mockSeasonalTrends,
  mockFishTrendSummary,
  mockFestivalAccuracy,
  mockSpeciesForecast,
  mockFestivalAlerts,
  getCurrentMonsoon
} from "@/services/mockData";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function Market() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedSpecies, setSelectedSpecies] = useState<string>("YFT");

  // Colors
  const COLOR_UP = "#10b981";    // Emerald 500
  const COLOR_DOWN = "#ef4444";  // Red 500
  const COLOR_STABLE = "#94a3b8"; // Slate 400
  const PRIMARY_BLUE = "#3b82f6";
  const PRIMARY_PURPLE = "#8b5cf6"; // Violet 500

  const currentSpecies = mockSpecies.find(s => s.code === selectedSpecies) || mockSpecies[0];
  const currentTrend = mockFishTrendSummary.find(f => f.code === selectedSpecies) || mockFishTrendSummary[0];
  const currentMonsoon = getCurrentMonsoon();

  // Helper to render trend icon
  const renderTrendIcon = (trend: string, size: string = "w-6 h-6") => {
    if (trend === "Up") return <TrendingUp className={`${size} text-emerald-500`} />;
    if (trend === "Down") return <TrendingDown className={`${size} text-red-500`} />;
    return <Minus className={`${size} text-slate-400`} />;
  };

  // Helper for trend text color
  const getTrendColor = (trend: string) => {
    if (trend === "Up") return "text-emerald-600 dark:text-emerald-400";
    if (trend === "Down") return "text-red-600 dark:text-red-400";
    return "text-slate-600 dark:text-slate-400";
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0B0C15] p-6 lg:p-8 font-sans space-y-8">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Trend Forecasting
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Next-Gen Price Direction Analysis</p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-[#1E1E2E] p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="px-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Fish className="w-4 h-4 text-blue-500" />
            <span>Analyze Species:</span>
          </div>
          <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
            <SelectTrigger className="w-[180px] border-none shadow-none bg-transparent focus:ring-0 px-2 h-9 font-bold text-slate-700 dark:text-slate-200">
              <SelectValue placeholder="Select Species" />
            </SelectTrigger>
            <SelectContent>
              {mockSpecies.map((species) => (
                <SelectItem key={species.id} value={species.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{species.code}</span>
                    <span className="text-xs text-slate-400 truncate max-w-[100px]">{species.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- HERO: PREDICTION CARD --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main Prediction */}
        <Card className="lg:col-span-8 border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-[#1E1E2E] dark:to-[#151621] relative overflow-hidden">
          {/* Background Decoration */}
          <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl opacity-10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none 
            ${currentTrend.trend === 'Up' ? 'from-emerald-500 to-transparent' : currentTrend.trend === 'Down' ? 'from-red-500 to-transparent' : 'from-slate-500 to-transparent'}`}
          />

          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* Left Column: The Verdict */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Next Week Outlook
                  </h3>
                  <div className="flex items-center gap-4">
                    {renderTrendIcon(currentTrend.trend, "w-16 h-16")}
                    <div>
                      <span className={`text-5xl font-black tracking-tighter ${getTrendColor(currentTrend.trend)}`}>
                        {currentTrend.trend.toUpperCase()}
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Probability: <span className="text-slate-900 dark:text-white font-bold">{(currentTrend.confidence * 100).toFixed(0)}%</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Why this trend?
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                    Our models detect strong <strong>{currentMonsoon}</strong> signals combined with increased fuel costs.
                    Historical data suggests a <span className="font-semibold">{currentTrend.trend === 'Up' ? 'supply shortage' : 'surplus'}</span> for {currentSpecies.name} during this seasonal transition.
                  </p>
                </div>

              </div>



            </div>
          </CardContent>
        </Card>

        {/* Right: Seasonal Context Panel */}
        <Card className="lg:col-span-4 border-none shadow-md bg-[#2A2B36] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-32 bg-blue-500/20 blur-3xl rounded-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wind className="w-5 h-5 text-sky-400" />
              Seasonal Context
            </CardTitle>
            <CardDescription className="text-slate-300">Current Phase: <span className="text-white font-bold">{currentMonsoon}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">

            <div className="space-y-4">
              <div className="flex gap-3 items-start p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="p-2 bg-sky-500/20 rounded-md text-sky-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Market Volatility</h4>
                  <p className="text-xs text-slate-300 mt-1">Expect moderate fluctuations due to unpredictable weather patterns in the southern zones.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="p-2 bg-yellow-500/20 rounded-md text-yellow-300">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Festival Impact</h4>
                  <p className="text-xs text-slate-300 mt-1">Upcoming Poya days may spike demand for local varieties.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Historical Seasonal Trend</h4>
              <div className="flex justify-between items-center text-sm">
                <span>Typ. Price Movement</span>
                <span className="font-bold text-red-300">Usually Drops (-5%)</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span>Catch Volume</span>
                <span className="font-bold text-green-300">Typically High</span>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* --- SECTION 2: MULTI-WEEK OUTLOOK --- */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          Multi-Week Horizon
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mockMultiWeekTrend.map((week, idx) => (
            <Card key={idx} className={`border-none shadow-sm ${idx === 0 ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''} bg-white dark:bg-[#1E1E2E]`}>
              <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-[#0284C5]">
                  {idx === 0 ? "Next Week" : `Week +${idx}`}
                </span>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full">
                  {renderTrendIcon(week.trend)}
                </div>
                <div>
                  <span className={`block font-bold ${getTrendColor(week.trend)}`}>{week.trend}</span>
                  <span className="text-xs text-slate-400">Conf: {(week.confidence * 100).toFixed(0)}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* --- SECTION 2.5: SPECIES COMPARISONS (NEW LINE CHART) --- */}
      <Card className="border-none shadow-md bg-white dark:bg-[#1E1E2E]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Species Trend Comparison (Next 7 Days)
          </CardTitle>
          <CardDescription>Relative movement index (Baseline = 100)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockSpeciesForecast} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: isDark ? '#1E1E2E' : '#fff',
                    color: isDark ? '#fff' : '#000'
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />

                <Line type="monotone" dataKey="YFT" name="Yellowfin (YFT)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="BET" name="Bigeye (BET)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="SKJ" name="Skipjack (SKJ)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="COM" name="Seer Fish (COM)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>


      {/* --- SECTION 3: FESTIVAL ALERTS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-md bg-white dark:bg-[#1E1E2E]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Upcoming Festival Alerts
            </CardTitle>
            <CardDescription>Events that typically impact fish prices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {mockFestivalAlerts.filter(f => f.type === 'upcoming').map((festival) => (
                <div key={festival.id} className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 dark:bg-[#252636] border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
                  <div className="flex-shrink-0 w-12 text-center bg-white dark:bg-[#1E1E2E] rounded-lg p-1 shadow-sm border border-slate-100 dark:border-slate-700">
                    <span className="block text-xs text-slate-400 font-bold uppercase">{format(new Date(festival.date), 'MMM')}</span>
                    <span className="block text-lg font-bold text-slate-800 dark:text-slate-200">{format(new Date(festival.date), 'dd')}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{festival.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={`text-[10px] h-5 ${festival.impact === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'}`}>
                        {festival.impact} Impact
                      </Badge>
                      <span className="text-xs text-slate-400">in {Math.ceil((new Date(festival.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days</span>
                    </div>
                  </div>
                </div>
              ))}
              {mockFestivalAlerts.filter(f => f.type === 'upcoming').length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                  <Calendar className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">No major festivals in the next 30 days.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-[#1E1E2E]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-emerald-500" />
              Live Market Signals
            </CardTitle>
            <CardDescription>Real-time factors affecting today's trade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              <div className="flex gap-3 items-start p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <TrendingDown className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Fuel Prices Dropped</h4>
                  <p className="text-xs text-slate-500 mt-1">Diesel prices down by 5 LKR/L. Logistics costs expected to decrease.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <Wind className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">High Wind Warning</h4>
                  <p className="text-xs text-slate-500 mt-1">Galle & Matara coastal areas experiencing 40km/h winds. Small boats grounded.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* --- SECTION 4: FISH-WISE SUMMARY --- */}
      <Card className="border-none shadow-md bg-white dark:bg-[#1E1E2E] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Fish-Wise Market Pulse</CardTitle>
            <CardDescription>Live trend signals for key species</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
            View Full Report <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-[#151621]">
                <tr>
                  <th className="px-6 py-4 font-bold">Species</th>
                  <th className="px-6 py-4 font-bold">Trend Signal</th>
                  <th className="px-6 py-4 font-bold">Confidence</th>
                  <th className="px-6 py-4 font-bold">Action</th>
                  <th className="px-6 py-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockFishTrendSummary.map((fish, idx) => (
                  <tr key={fish.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setSelectedSpecies(fish.code)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                          {fish.code}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{fish.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {renderTrendIcon(fish.trend, "w-4 h-4")}
                        <span className={`font-bold ${getTrendColor(fish.trend)}`}>{fish.trend}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Progress value={fish.confidence * 100} className="w-16 h-2" indicatorClassName={fish.confidence > 0.8 ? "bg-emerald-500" : "bg-amber-500"} />
                        <span className="text-xs text-slate-500 font-mono">{(fish.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`${fish.recommendedAction === 'Buy' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-600 bg-slate-50'} dark:bg-transparent`}>
                        {fish.recommendedAction}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-semibold">Active</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
