
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Radar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, AreaChart, Area
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Calendar,
  Info, Activity, AlertTriangle, Fish,
  BarChart3, ChevronRight, CheckCircle2,
  Wind, Lock, ArrowUpRight, ArrowDownRight, Gem
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  mockSpecies,
  mockMultiWeekTrend,
  mockFishTrendSummary,
  mockFestivalAlerts,
  mockSpeciesForecast,
  getCurrentMonsoon
} from "@/services/mockData";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function Market() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedSpecies, setSelectedSpecies] = useState<string>("YFT");

  const currentSpecies = mockSpecies.find(s => s.code === selectedSpecies) || mockSpecies[0];
  const currentTrend = mockFishTrendSummary.find(f => f.code === selectedSpecies) || mockFishTrendSummary[0];
  const currentMonsoon = getCurrentMonsoon();

  const predictedPrices = [
    { code: "YFT", name: "Yellowfin", price: 1540, growth: "+12%" },
    { code: "BET", name: "Bigeye", price: 1420, growth: "+8%" },
    { code: "SKJ", name: "Skipjack", price: 890, growth: "-2%" },
    { code: "COM", name: "Seer Fish", price: 2100, growth: "+15%" },
    { code: "SWO", name: "Swordfish", price: 1850, growth: "+5%" },
  ].sort((a,b) => b.price - a.price);

  // Color Constants
  const colors = {
    up: "#10b981",    // Emerald 500
    down: "#f43f5e",  // Rose 500
    neutral: "#94a3b8", // Slate 400
    primary: "#6366f1", // Indigo 500
    background: isDark ? "#0f172a" : "#ffffff",
    cardBg: isDark ? "#1e293b" : "#ffffff",
    grid: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#f8fafc" : "#0f172a",
    subText: isDark ? "#94a3b8" : "#64748b"
  };

  const renderTrendIcon = (trend: string, size: string = "w-6 h-6") => {
    if (trend === "Up") return <TrendingUp className={cn(size, "text-emerald-500")} />;
    if (trend === "Down") return <TrendingDown className={cn(size, "text-rose-500")} />;
    return <Minus className={cn(size, "text-slate-400")} />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "Up") return "text-emerald-600 dark:text-emerald-400";
    if (trend === "Down") return "text-rose-600 dark:text-rose-400";
    return "text-slate-600 dark:text-slate-400";
  };

  const getTrendBg = (trend: string) => {
    if (trend === "Up") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (trend === "Down") return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0C15] p-6 lg:p-8 font-sans space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
               <Gem className="w-5 h-5 text-white" />
             </div>
             <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Market Intelligence</h1>
           </div>
           <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">Advanced Forecasting & Price Analytics</p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="px-4 py-2 border-r border-slate-200 dark:border-slate-700 hidden sm:block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Species</span>
          </div>
          <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
            <SelectTrigger className="w-[200px] border-none shadow-none bg-transparent focus:ring-0 px-2 h-10 text-base font-bold text-slate-700 dark:text-slate-200">
              <SelectValue placeholder="Select Species" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {mockSpecies.map((species) => (
                <SelectItem key={species.id} value={species.code} className="py-3 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-400 text-xs w-8">{species.code}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{species.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* --- LEFT COL: MAIN ANALYSIS --- */}
          <div className="lg:col-span-8 space-y-6">
              
              {/* FEATURED INSIGHT CARD */}
              <Card className="border-none shadow-xl bg-gradient-to-br from-white to-indigo-50/50 dark:from-[#1E1E2E] dark:to-[#151621] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <CardContent className="p-8 relative z-10">
                   <div className="flex flex-col md:flex-row justify-between gap-8 md:items-center">
                      <div className="space-y-6 flex-1">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 dark:bg-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3 h-3" />
                            Next 7 Days Outlook
                          </div>
                          
                          <div>
                            <div className="flex items-baseline gap-4">
                               <h2 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                                  {currentTrend.trend.toUpperCase()}
                               </h2>
                               <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border", getTrendBg(currentTrend.trend))}>
                                  {currentTrend.trend === 'Up' ? <ArrowUpRight className="w-4 h-4" /> : currentTrend.trend === 'Down' ? <ArrowDownRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                  {(currentTrend.confidence * 100).toFixed(0)}% Confidence
                               </div>
                            </div>
                            <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg leading-relaxed max-w-xl">
                              Market signals indicate a <span className="font-bold text-slate-900 dark:text-white">{currentTrend.trend === 'Up' ? 'bullish' : 'bearish'}</span> movement for {currentSpecies.name}. 
                              This is primarily driven by <span className="font-semibold border-b-2 border-indigo-500/30">seasonal supply shifts</span> and recent weather patterns affecting catch rates.
                            </p>
                          </div>
                          
                          <div className="flex gap-4 pt-2">
                             <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                Strong Demand
                             </div>
                             <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                Low Supply
                             </div>
                             <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                Festival Impact
                             </div>
                          </div>
                      </div>

                      {/* Visual Graphic Ring */}
                      <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center hidden md:flex">
                          <div className={cn("absolute inset-0 rounded-full border-[12px] opacity-20", currentTrend.trend === 'Up' ? 'border-emerald-500' : 'border-rose-500')}></div>
                          <div className={cn("absolute inset-0 rounded-full border-[12px] border-t-transparent animate-[spin_3s_linear_infinite]", currentTrend.trend === 'Up' ? 'border-emerald-500' : 'border-rose-500')}></div>
                          <div className="text-center z-10">
                             <span className="block text-3xl font-bold text-slate-800 dark:text-white">{(currentTrend.confidence * 100).toFixed(0)}<span className="text-sm align-top">%</span></span>
                             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Probability</span>
                          </div>
                      </div>
                   </div>
                </CardContent>
              </Card>

              {/* FORECAST CHART */}
              <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E]">
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-2 gap-4">
                   <div>
                     <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Price Trajectory Forecast</CardTitle>
                     <CardDescription>Projected relative value index (Baseline 100)</CardDescription>
                   </div>
                   <div className="flex items-center gap-2">
                       <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                        <SelectTrigger className="h-8 w-[110px] text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mockSpecies.map((species) => (
                            <SelectItem key={species.id} value={species.code} className="text-xs">
                              {species.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                       <Tabs defaultValue="7d" className="w-auto">
                          <TabsList className="grid w-full grid-cols-2 h-8">
                            <TabsTrigger value="7d" className="text-xs h-6 px-2">7D</TabsTrigger>
                            <TabsTrigger value="30d" className="text-xs h-6 px-2">30D</TabsTrigger>
                          </TabsList>
                       </Tabs>
                   </div>
                </CardHeader>
                <CardContent className="h-[320px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockSpeciesForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorYFT" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: colors.subText, fontSize: 11, fontWeight: 500 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: colors.subText, fontSize: 11 }} 
                      />
                      <Tooltip 
                         contentStyle={{
                            backgroundColor: colors.cardBg,
                            borderColor: colors.grid,
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: colors.text
                         }}
                         itemStyle={{ color: colors.text }} // Fix for text visibility in tooltip
                         cursor={{ stroke: colors.grid, strokeWidth: 2 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey={selectedSpecies} 
                        stroke={colors.primary} 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorYFT)" 
                        activeDot={{ r: 8, strokeWidth: 0, fill: colors.primary }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* TOP PRICE PREDICTION CHART */}
              <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E]">
                <CardHeader>
                   <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Predicted Top Prices (Next Week)</CardTitle>
                   <CardDescription>Forecasted market value per kg for major species</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={predictedPrices} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.grid} />
                         <XAxis type="number" hide />
                         <YAxis 
                            dataKey="code" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: colors.subText, fontWeight: 'bold', fontSize: 12 }} 
                            width={30}
                         />
                         <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                               if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                     <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700">
                                        <div className="font-bold text-sm mb-1">{data.name}</div>
                                        <div className="text-slate-300">LKR {data.price} <span className="text-[10px]">/kg</span></div>
                                        <div className="text-emerald-400 font-bold mt-1 text-[10px] uppercase tracking-wider">{data.growth} growth</div>
                                     </div>
                                  );
                               }
                               return null;
                            }}
                         />
                         <Bar dataKey="price" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1000}>
                           {predictedPrices.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 0 ? colors.primary : colors.neutral} />
                           ))}
                         </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

          </div>

          {/* --- RIGHT COL: SIDEBAR WIDGETS --- */}
          <div className="lg:col-span-4 space-y-6">
              
              {/* SEASONAL CONTEXT */}
              <Card className="border-none shadow-lg bg-slate-900 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                 <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                       <Wind className="w-5 h-5 text-emerald-400" />
                       <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Seasonal Context</span>
                    </div>
                    <CardTitle className="text-2xl font-bold">{currentMonsoon}</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4 relative z-10">
                     <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-sm font-medium text-slate-300">Volatility</span>
                           <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10">Moderate</Badge>
                        </div>
                        <Progress value={65} className="h-1.5 bg-white/10" indicatorClassName="bg-amber-500" />
                     </div>
                     
                     <div className="space-y-3 pt-2">
                        <div className="flex gap-3 text-sm">
                           <div className="mt-1"><Activity className="w-4 h-4 text-slate-400" /></div>
                           <p className="text-slate-300 leading-snug">Southern coastal winds currently limiting small-boat activity.</p>
                        </div>
                        <div className="flex gap-3 text-sm">
                           <div className="mt-1"><Calendar className="w-4 h-4 text-slate-400" /></div>
                           <p className="text-slate-300 leading-snug">Pre-festival stocking expected to begin in <span className="text-white font-bold">3 days</span>.</p>
                        </div>
                     </div>
                 </CardContent>
              </Card>

              {/* MARKET ALERTS */}
              <Card className="border-none shadow-lg bg-white dark:bg-[#1E1E2E]">
                 <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Critical Alerts
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3">
                    {mockFestivalAlerts.slice(0, 3).map((alert, i) => (
                       <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                          <div className="flex-shrink-0 w-10 text-center">
                             <span className="block text-[10px] font-bold text-slate-400 uppercase">{format(new Date(alert.date), 'MMM')}</span>
                             <span className="block text-lg font-bold text-slate-700 dark:text-slate-200">{format(new Date(alert.date), 'dd')}</span>
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{alert.name}</h4>
                             <p className="text-xs text-slate-500 mt-0.5">{alert.impact} Impact Expected</p>
                          </div>
                       </div>
                    ))}
                 </CardContent>
              </Card>

              {/* MULTI WEEK MINI GRID */}
              <div>
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">4-Week Horizon</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {mockMultiWeekTrend.map((week, i) => (
                       <div key={i} className="p-3 bg-white dark:bg-[#1E1E2E] rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] font-bold text-slate-400 mb-1">Week {i + 1}</span>
                          {renderTrendIcon(week.trend)}
                          <span className={cn("text-xs font-bold mt-1", getTrendColor(week.trend))}>{week.trend}</span>
                       </div>
                    ))}
                 </div>
              </div>

          </div>
      </div>

      {/* --- BOTTOM SECTION: DETAILED TABLE --- */}
      <Card className="border-none shadow-xl bg-white dark:bg-[#1E1E2E] overflow-hidden">
         <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 pb-4">
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Global Species Watchlist</CardTitle>
                  <CardDescription>Live tracking across all major monitored species</CardDescription>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-slate-200 dark:border-slate-700">Download CSV</Button>
                  <Button size="sm" className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700">Full Report</Button>
               </div>
            </div>
         </CardHeader>
         <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                   <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                         <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Species</th>
                         <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Current Price</th>
                         <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Trend Signal</th>
                         <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Strength</th>
                         <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Algorithm Rec.</th>
                         <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {mockFishTrendSummary.map((fish, i) => (
                         <tr 
                            key={fish.code} 
                            onClick={() => setSelectedSpecies(fish.code)}
                            className={cn(
                               "group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                               selectedSpecies === fish.code ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                            )}
                         >
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className={cn(
                                     "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm",
                                     selectedSpecies === fish.code ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                  )}>
                                     {fish.code}
                                  </div>
                                  <div>
                                     <div className="font-bold text-slate-900 dark:text-slate-100">{fish.name}</div>
                                     <div className="text-xs text-slate-400">updated 2h ago</div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                  LKR 1,240 <span className="text-xs text-slate-400">/kg</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset", getTrendBg(fish.trend))}>
                                  {fish.trend === 'Up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                  {fish.trend.toUpperCase()}
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="w-24 space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                     <span>Signal</span>
                                     <span>{(fish.confidence * 100).toFixed(0)}%</span>
                                  </div>
                                  <Progress value={fish.confidence * 100} className="h-1.5" indicatorClassName={fish.confidence > 0.7 ? "bg-emerald-500" : "bg-amber-500"} />
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <Badge className={cn(
                                  "border-0 font-bold",
                                  fish.recommendedAction === 'Buy' ? "bg-emerald-500 hover:bg-emerald-600" : 
                                  fish.recommendedAction === 'Sell' ? "bg-rose-500 hover:bg-rose-600" : "bg-slate-500 hover:bg-slate-600"
                               )}>
                                  {fish.recommendedAction} Now
                               </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-500">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
         </CardContent>
         <CardFooter className="bg-slate-50 dark:bg-slate-900/40 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 font-medium hover:text-indigo-600">
               Load 15 more comparisons
            </Button>
         </CardFooter>
      </Card>

    </div>
  );
}
