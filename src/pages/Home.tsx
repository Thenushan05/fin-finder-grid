import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Map, TrendingUp, Ship, ArrowRight, Waves, Fish, Compass, Radar, ChartBar } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  // Generate chaotic plexus pattern (reused from Landing/AuthPage for consistency)
  const plexusPattern = useMemo(() => {
    const nodes: { x: number; y: number; r: number }[] = [];
    const width = 1000;
    const height = 1000;
    const nodeCount = 80;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 4 + 2,
      });
    }

    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opacity: number;
    }[] = [];
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach((otherNode) => {
        const dist = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
        if (dist < 200) {
          lines.push({
            x1: node.x,
            y1: node.y,
            x2: otherNode.x,
            y2: otherNode.y,
            opacity: (1 - dist / 200) * 0.5,
          });
        }
      });
    });

    return { nodes, lines };
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300">
      {/* Chaotic Plexus / Constellation Pattern */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="neuron-net-home"
              x="0"
              y="0"
              width="1000"
              height="1000"
              patternUnits="userSpaceOnUse"
            >
              {plexusPattern.lines.map((line, i) => (
                <line
                  key={`line-${i}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-slate-400 dark:text-blue-700"
                  style={{ opacity: line.opacity }}
                />
              ))}
              {plexusPattern.nodes.map((node, i) => (
                <circle
                  key={`node-${i}`}
                  cx={node.x}
                  cy={node.y}
                  r={node.r * 0.8}
                  className="fill-slate-400 dark:fill-blue-600"
                />
              ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neuron-net-home)" />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20 flex flex-col gap-16">
        {/* Hero Section */}
        {/* Hero Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="relative overflow-hidden rounded-3xl shadow-2xl text-white min-h-[500px] flex items-center justify-center w-full"
        >
          {/* Background Image with Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070&auto=format&fit=crop")',
            }}
          >
            <div className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto px-4 py-16">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-8 backdrop-blur-md"
            >
              <Waves className="h-4 w-4" />
              <span>Welcome to Ocelyn</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight text-white">
              Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Ocean</span>
            </h1>

            <p className="text-lg md:text-xl text-blue-50 max-w-2xl mb-10 leading-relaxed">
              Your all-in-one platform for fish spot prediction, market
              intelligence, and voyage planning.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/hotspot-map">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 border-none"
                >
                  Explore Map <Map className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base font-semibold rounded-full bg-white/10 text-white border-white/30 hover:bg-white/20 transition-all hover:scale-105 backdrop-blur-sm"
                >
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Quick Access Grid */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          <Link to="/hotspot-map" className="group">
            <motion.div variants={fadeInUp} className="h-full">
              <Card className="h-full border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 group-hover:border-blue-200 dark:group-hover:border-blue-800/50">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    <Radar className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hotspot Map</CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Find high-probability fishing zones with AI.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </Link>

          <Link to="/market" className="group">
            <motion.div variants={fadeInUp} className="h-full">
              <Card className="h-full border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/50">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <ChartBar className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Market Trends</CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Track prices and maximize your profit.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </Link>

          <Link to="/trip-planner" className="group">
            <motion.div variants={fadeInUp} className="h-full">
              <Card className="h-full border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 group-hover:border-emerald-200 dark:group-hover:border-emerald-800/50">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <Compass className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Trip Planner</CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Optimize routes and estimate fuel costs.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
