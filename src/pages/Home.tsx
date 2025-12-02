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
    <div className="relative min-h-screen w-full overflow-hidden space-y-8 p-1">
      {/* Chaotic Plexus / Constellation Pattern */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-30 pointer-events-none">
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
                  strokeWidth="2"
                  className="text-slate-300 dark:text-blue-600"
                  style={{ opacity: line.opacity }}
                />
              ))}
              {plexusPattern.nodes.map((node, i) => (
                <circle
                  key={`node-${i}`}
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  className="fill-slate-300 dark:fill-blue-500"
                />
              ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neuron-net-home)" />
        </svg>
      </div>

      {/* Hero Section */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="relative overflow-hidden rounded-3xl shadow-2xl text-white min-h-[500px] flex items-center justify-center"
      >
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070&auto=format&fit=crop")',
          }}
        >
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-[2px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 py-16 md:py-24 flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-sm font-medium mb-8"
          >
            <Waves className="h-4 w-4" />
            <span>Welcome to Ocelyn</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Ocean</span>
          </h1>

          <p className="text-lg md:text-2xl text-blue-100/90 max-w-2xl mb-12 leading-relaxed">
            Your all-in-one platform for fish spot prediction, market
            intelligence, and voyage planning.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/hotspot-map">
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
              >
                Explore Map <Map className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg font-semibold rounded-xl bg-white/10 text-white backdrop-blur-md border-white/30 hover:bg-white/20 transition-all hover:scale-105"
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
        className="grid md:grid-cols-3 gap-8"
      >
        <Link to="/hotspot-map" className="group">
          <motion.div variants={fadeInUp} className="h-full">
            <Card className="h-full border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <CardHeader>
                <div className="h-14 w-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-300 border border-violet-200/50 dark:border-violet-700/30">
                  <Radar className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">Hotspot Map</CardTitle>
                <CardDescription className="text-base">
                  Find high-probability fishing zones with AI.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </Link>

        <Link to="/market" className="group">
          <motion.div variants={fadeInUp} className="h-full">
            <Card className="h-full border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <CardHeader>
                <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 border border-indigo-200/50 dark:border-indigo-700/30">
                  <ChartBar className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">Market Trends</CardTitle>
                <CardDescription className="text-base">
                  Track prices and maximize your profit.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </Link>

        <Link to="/trip-planner" className="group">
          <motion.div variants={fadeInUp} className="h-full">
            <Card className="h-full border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <CardHeader>
                <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 border border-blue-200/50 dark:border-blue-700/30">
                  <Compass className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">Trip Planner</CardTitle>
                <CardDescription className="text-base">
                  Optimize routes and estimate fuel costs.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}
