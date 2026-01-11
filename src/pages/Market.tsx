import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockPriceData, mockSpecies } from "@/services/mockData";
import { TrendingUp, TrendingDown, MoreHorizontal, ArrowUp, ArrowDown, Download, Filter } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { useTheme } from "next-themes";

export default function Market() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // --- Data Preparation ---
  const latestPrices = mockPriceData[mockPriceData.length - 1];
  const previousPrices = mockPriceData[mockPriceData.length - 2];

  const speciesWithPrices = mockSpecies.map((species) => {
    const current = latestPrices[species.code as keyof typeof latestPrices] as number;
    const previous = previousPrices[species.code as keyof typeof previousPrices] as number;
    const change = ((current - previous) / previous) * 100;
    return { ...species, currentPrice: current, priceChange: change };
  });

  const topMovers = [...speciesWithPrices].sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange)).slice(0, 4);

  // Mock Data for New Charts
  const volatilityData = [
    { subject: 'YFT', A: 120, fullMark: 150 },
    { subject: 'BET', A: 98, fullMark: 150 },
    { subject: 'SKJ', A: 86, fullMark: 150 },
    { subject: 'COM', A: 99, fullMark: 150 },
    { subject: 'SWO', A: 85, fullMark: 150 },
    { subject: 'MAR', A: 65, fullMark: 150 },
  ];

  const distributionData = [
    { name: 'Local Market', value: 400 },
    { name: 'Export (EU)', value: 300 },
    { name: 'Export (Asia)', value: 300 },
    { name: 'Processing', value: 200 },
  ];

  const sentimentData = [
    { name: 'Bullish', value: 70 },
    { name: 'Bearish', value: 30 },
  ];

  // Colors
  const PRIMARY_BLUE = "#0284C5";
  const COLORS = [PRIMARY_BLUE, '#00C49F', '#FFBB28', '#FF8042'];
  const CHART_GRID_COLOR = isDark ? "#1e293b" : "#f1f5f9";
  const TEXT_COLOR = isDark ? "#94a3b8" : "#64748b";
  const TEXT_COLOR_BOLD = isDark ? "#fff" : "#1e293b";

  return (
    <div className="min-h-screen w-full bg-[#F8F9FC] dark:bg-[#0B0C15] p-6 md:p-8 font-sans">
      
      {/* Actions Toolbar */}
      <div className="flex justify-end items-center mb-6">
        <div className="flex gap-2">
          <button className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[
          { title: "Total Volume", value: "32,499 T", change: "+8.95%", isPositive: true },
          { title: "Market Index", value: "1,240.50", change: "-0.33%", isPositive: false },
          { title: "Active Traders", value: "5,211", change: "+0.32%", isPositive: true },
          { title: "Daily Turnover", value: "$4.83M", change: "+8.05%", isPositive: true },
        ].map((kpi, idx) => (
          <Card key={idx} className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1E1E2E]">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{kpi.title}</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{kpi.value}</h3>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`rounded-md px-2 py-1 text-xs font-bold ${
                    kpi.isPositive 
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                      : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  }`}
                >
                  {kpi.isPositive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {kpi.change}
                </Badge>
                <span className="text-xs text-slate-400">Compared to last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Main Chart & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Line Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white dark:bg-[#1E1E2E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Price Trends Over Time</CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0284C5]" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Yellowfin</span>
                  <span className="text-xs text-slate-400 ml-1">+55%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Bigeye</span>
                  <span className="text-xs text-slate-400 ml-1">+45%</span>
                </div>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockPriceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_COLOR} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: TEXT_COLOR, fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: TEXT_COLOR, fontSize: 12 }} 
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="YFT" 
                    stroke={PRIMARY_BLUE} 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="BET" 
                    stroke="#FB923C" 
                    strokeWidth={3} 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Movers List */}
        <Card className="lg:col-span-1 border-none shadow-sm rounded-2xl bg-white dark:bg-[#1E1E2E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Volume by Species</CardTitle>
              <p className="text-xs text-slate-400 mt-1">Showing Data for Top Movers</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-6">
              {topMovers.map((species, idx) => (
                <div key={species.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                        {species.code}
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{species.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white block">{(Math.random() * 800 + 200).toFixed(0)} T</span>
                      <span className="text-xs text-slate-400">{Math.abs(species.priceChange).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.random() * 60 + 30}%`,
                        backgroundColor: idx === 0 ? PRIMARY_BLUE : idx === 1 ? '#10B981' : idx === 2 ? '#F59E0B' : '#64748B'
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Advanced Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Radar Chart */}
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1E1E2E]">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Volatility Analysis</CardTitle>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={volatilityData}>
                  <PolarGrid stroke={CHART_GRID_COLOR} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: TEXT_COLOR, fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar
                    name="Volatility"
                    dataKey="A"
                    stroke={PRIMARY_BLUE}
                    fill={PRIMARY_BLUE}
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between px-4 mt-[-20px]">
              <div className="text-center">
                <p className="text-xs text-slate-400">High Risk</p>
                <p className="font-bold text-slate-900 dark:text-white">YFT</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Low Risk</p>
                <p className="font-bold text-slate-900 dark:text-white">MAR</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1E1E2E]">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Market Distribution</CardTitle>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">45%</p>
                <p className="text-xs text-slate-400">Export</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gauge Chart (Simulated) */}
        <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#1E1E2E]">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Market Sentiment</CardTitle>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full relative mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="70%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    <Cell fill={PRIMARY_BLUE} />
                    <Cell fill={isDark ? "#334155" : "#e2e8f0"} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 text-center">
                <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-800 mb-2 inline-block">
                   <TrendingUp className="w-6 h-6 text-[#0284C5]" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">2,324</p>
                <p className="text-xs text-slate-400">Total Traders</p>
              </div>
            </div>
            <div className="flex justify-between px-4 mt-4">
              <div className="text-center border-r border-slate-100 dark:border-slate-700 w-1/2">
                <p className="text-xl font-bold text-slate-900 dark:text-white">1,809</p>
                <p className="text-xs text-slate-400">Bullish</p>
              </div>
              <div className="text-center w-1/2">
                <p className="text-xl font-bold text-slate-900 dark:text-white">515</p>
                <p className="text-xs text-slate-400">Bearish</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
