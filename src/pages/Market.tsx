
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Radar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, AreaChart, Area, ReferenceLine
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp, TrendingDown, Minus, Calendar,
  Info, Activity, AlertTriangle, Fish,
  BarChart3, ChevronRight, CheckCircle2,
  Wind, Lock, ArrowUpRight, ArrowDownRight, Gem
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  mockSpecies,
  mockMultiWeekTrend,
  mockFishTrendSummary,
  mockFestivalAlerts,
  mockSpeciesForecast,
  mockSpeciesForecast30d,
  getCurrentMonsoon
} from "@/services/mockData";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Market() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { toast } = useToast();
  const [selectedSpecies, setSelectedSpecies] = useState<string>("YFT");
  const [timeScale, setTimeScale] = useState<"7d" | "30d">("7d");
  const [selectedForecastSpecies, setSelectedForecastSpecies] = useState<string[]>(["YFT"]);

  const handleForecastSpeciesChange = (code: string) => {
    setSelectedForecastSpecies(prev => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(s => s !== code);
      }
      if (prev.length >= 5) {
        toast({
          title: "Selection Limit Reached",
          description: "You can only select up to 5 species at a time to keep the chart readable.",
          variant: "destructive"
        });
        return prev; // Max 5 selections
      }
      return [...prev, code];
    });
  };

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
                          
                          <div className="space-y-3 pt-4">
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Key Market Drivers</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="w-3 h-3 text-slate-300 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px] bg-slate-900 text-white border-slate-800">
                                      <p>These factors are the primary reasons for the current price trend. Use this insight to decide whether to sell now or wait.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 gap-1.5 py-1.5 pl-2 pr-3">
                                   <Activity className="w-3.5 h-3.5" />
                                   Strong Demand
                                </Badge>
                                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1.5 py-1.5 pl-2 pr-3">
                                   <Fish className="w-3.5 h-3.5" />
                                   Limited Supply
                                </Badge>
                                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1.5 py-1.5 pl-2 pr-3">
                                   <Calendar className="w-3.5 h-3.5" />
                                   Festival Season
                                </Badge>
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
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-8 w-[120px] text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 justify-between">
                            {selectedForecastSpecies.length} Species
                            <ChevronRight className="h-4 w-4 opacity-50 rotate-90" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                          {mockSpecies.map((species) => (
                            <DropdownMenuCheckboxItem
                              key={species.id}
                              checked={selectedForecastSpecies.includes(species.code)}
                              onCheckedChange={() => handleForecastSpeciesChange(species.code)}
                              onSelect={(e) => e.preventDefault()}
                              className="text-xs font-bold cursor-pointer"
                            >
                              {species.name} ({species.code})
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                       <Tabs defaultValue="7d" className="w-auto" onValueChange={(val) => setTimeScale(val as "7d" | "30d")}>
                          <TabsList className="grid w-full grid-cols-2 h-8">
                            <TabsTrigger value="7d" className="text-xs h-6 px-2">7D</TabsTrigger>
                            <TabsTrigger value="30d" className="text-xs h-6 px-2">30D</TabsTrigger>
                          </TabsList>
                       </Tabs>
                   </div>
                </CardHeader>
                <CardContent className="h-[320px] w-full pt-4 relative">
                  {(() => {
                    const activeData = timeScale === "7d" ? mockSpeciesForecast : mockSpeciesForecast30d;
                    const mainSpecies = selectedForecastSpecies[0] || "YFT";
                    const firstValue = activeData[0][mainSpecies as keyof typeof activeData[0]] as number;
                    const lastValue = activeData[activeData.length - 1][mainSpecies as keyof typeof activeData[0]] as number;
                    const isIncrease = lastValue >= firstValue;
                    const percentageDiff = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100) : 0;
                    const percentageChange = percentageDiff.toFixed(1);
                    const lineColor = isIncrease ? "#10b981" : "#f43f5e";
                    
                    return (
                      <>
                        {selectedForecastSpecies.length === 1 && (
                          <div className={cn(
                            "absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full z-10 border shadow-sm backdrop-blur-sm",
                            isIncrease ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
                          )}>
                             {isIncrease ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                             <span className={cn("font-bold text-sm", isIncrease ? "text-emerald-500" : "text-rose-500")}>
                               {isIncrease ? '+' : ''}{percentageChange}%
                             </span>
                          </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={activeData} margin={{ top: 20, right: 10, left: 15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                            <ReferenceLine 
                              y={100} 
                              stroke="#f43f5e" 
                              strokeDasharray="4 4" 
                              opacity={0.7}
                              label={{ position: 'insideTopLeft', value: 'Baseline (100)', fill: '#f43f5e', fontSize: 10, fontWeight: 'bold', offset: 10 }} 
                            />
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
                              tickFormatter={(value) => `${value}%`}
                              label={{ 
                                 value: 'Price %', 
                                 angle: -90, 
                                 position: 'insideLeft', 
                                 style: { textAnchor: 'middle', fill: colors.subText, fontSize: 10 } 
                              }}
                            />
                            <RechartsTooltip 
                               contentStyle={{
                                  backgroundColor: colors.cardBg,
                                  borderColor: colors.grid,
                                  borderRadius: '12px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                  color: colors.text
                               }}
                               itemStyle={{ color: colors.text }}
                               cursor={{ stroke: colors.grid, strokeWidth: 2, strokeDasharray: "4 4" }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '10px' }} />
                            {selectedForecastSpecies.map((species, index) => {
                              const chartColors = [
                                "#10b981", // Emerald
                                "#3b82f6", // Blue
                                "#f59e0b", // Amber
                                "#ec4899", // Pink
                                "#8b5cf6", // Violet
                              ];
                              const lineColor = chartColors[index % chartColors.length];
                              return (
                                <Line 
                                  key={species}
                                  type="monotone" 
                                  dataKey={species} 
                                  stroke={lineColor} 
                                  strokeWidth={4} 
                                  dot={{ r: 4, fill: colors.cardBg, strokeWidth: 2 }}
                                  activeDot={{ r: 8, strokeWidth: 0, fill: lineColor }}
                                />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      </>
                    );
                  })()}
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
                         <RechartsTooltip
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
                             {predictedPrices.map((entry, index) => {
                               const barColors = [
                                 "#6366f1", // Indigo
                                 "#10b981", // Emerald
                                 "#f59e0b", // Amber
                                 "#3b82f6", // Blue
                                 "#ec4899"  // Pink
                               ];
                               return <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />;
                             })}
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
                           <div className="flex items-center gap-2 cursor-help" title="Indicates how rapidly market prices are changing">
                              <span className="text-sm font-medium text-slate-300">Disturbance Volatility</span>
                              <Info className="w-3.5 h-3.5 text-slate-400" />
                           </div>
                           <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10">Moderate</Badge>
                        </div>
                        <Progress value={65} className="h-1.5 bg-white/10" indicatorClassName="bg-amber-500" />
                        <p className="text-[10px] text-slate-400 mt-2">
                           Prices may fluctuate <strong>±15%</strong> due to weather instability.
                        </p>
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
                           {/* Price Column Removed */}
                           <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider group cursor-help" title="Forecasted market direction (Up/Down)">
                              <div className="flex items-center gap-1">
                                 Trend Signal <Info className="w-3 h-3" />
                              </div>
                           </th>
                           <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-wider">Signal Strength</th>
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
                              {/* Price Cell Removed */}
                              <td className="px-6 py-4">
                                 <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset", getTrendBg(fish.trend))}>
                                    {fish.trend === 'Up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                    {fish.trend.toUpperCase()}
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="w-24 space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                       <span>Confidence</span>
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
