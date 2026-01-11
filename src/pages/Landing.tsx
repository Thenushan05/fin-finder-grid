import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Waves, ArrowRight, Fish, Mail, Phone, MapPin, Send, Radar, ChartBar, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import dataDrivenImage from "@/assets/images/data-driven-fishing.png";
import dataDrivenImageLight from "@/assets/images/data-driven-fishing-light.png";
import logo from "@/assets/images/logo.svg";
import logodark from "@/assets/images/logodark.svg";

export default function Landing() {
    // Generate chaotic plexus pattern (reused from AuthPage for consistency)
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
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden relative">
            {/* Chaotic Plexus / Constellation Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 dark:opacity-30 pointer-events-none">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern
                            id="neuron-net-body"
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
                    <rect width="100%" height="100%" fill="url(#neuron-net-body)" />
                </svg>
            </div>

            {/* Gradient Blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 dark:hidden rounded-full blur-3xl animate-pulse z-0 pointer-events-none" />
            <div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300/30 dark:hidden rounded-full blur-3xl animate-pulse z-0 pointer-events-none"
                style={{ animationDelay: "1s" }}
            />

            {/* Navbar */}
            <nav className="border-b border-white/10 fixed top-0 w-full z-50 bg-white/10 dark:bg-slate-900/50 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Ocelyn Logo" className="h-8 w-8 dark:hidden" />
                        <img src={logodark} alt="Ocelyn Logo" className="h-8 w-8 hidden dark:block" />
                        <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Ocelyn</span>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8">
                        <a href="#" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</a>
                        <a href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Features</a>
                        <a href="#about" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">About</a>
                        <a href="#contact" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Contact</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link to="/home">
                            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0">Launch App</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="flex-1 flex items-center justify-center py-20 lg:py-32 relative z-10">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="container px-6 text-center"
                >
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 border border-violet-200/50 dark:border-violet-700/30 backdrop-blur-md shadow-sm mb-8 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-colors"
                    >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                        </span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Next-Gen Fisheries Intelligence</span>
                    </motion.div>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 max-w-5xl mx-auto leading-tight">
                        <motion.span 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ 
                                opacity: 1, 
                                x: 0,
                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                            }}
                            transition={{ 
                                opacity: { duration: 0.5, delay: 0.4 },
                                x: { duration: 0.5, delay: 0.4 },
                                backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
                            }}
                            className="inline-block bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto]"
                        >
                            Predict.
                        </motion.span>{" "}
                        <motion.span 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ 
                                opacity: 1, 
                                x: 0,
                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                            }}
                            transition={{ 
                                opacity: { duration: 0.5, delay: 0.6 },
                                x: { duration: 0.5, delay: 0.6 },
                                backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear", delay: 0.5 }
                            }}
                            className="inline-block bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto]"
                        >
                            Plan.
                        </motion.span>{" "}
                        <motion.span 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ 
                                opacity: 1, 
                                scale: 1,
                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                            }}
                            transition={{ 
                                opacity: { duration: 0.5, delay: 0.8 },
                                scale: { duration: 0.5, delay: 0.8, type: "spring" },
                                backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear", delay: 1 }
                            }}
                            className="inline-block bg-gradient-to-r from-fuchsia-600 via-pink-500 to-fuchsia-600 bg-clip-text text-transparent bg-[length:200%_auto] pb-2"
                        >
                            Catch.
                        </motion.span>
                    </h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1 }}
                        className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        Advanced satellite data and AI models to predict optimal fishing zones, track market trends, and plan your trips efficiently.
                    </motion.p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/home">
                            <Button size="lg" className="h-12 px-8 text-lg gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-violet-500/20">
                                Get Started Now <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="h-12 px-8 text-lg border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-slate-700 dark:text-slate-200">
                            View Demo
                        </Button>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 relative z-10">
                <div className="container px-6">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to succeed</h2>
                        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            Comprehensive tools designed for modern fishermen and commercial fleets.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        <motion.div variants={fadeInUp} className="group p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-700/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-2">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-violet-200/20 dark:border-violet-700/30">
                                <Radar className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Hotspot Prediction</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                AI-powered maps showing high-probability fishing zones based on SST, chlorophyll, and depth data.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="group p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-700/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-2">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-indigo-200/20 dark:border-indigo-700/30">
                                <ChartBar className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Market Intelligence</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Real-time market price tracking and trend analysis to maximize your catch value.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="group p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-700/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-200/20 dark:border-blue-700/30">
                                <Compass className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Trip Planning</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Calculate fuel costs, estimated distances, and optimize your routes for maximum efficiency.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 relative z-10">
                <div className="container px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div 
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInUp}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                                Revolutionizing Sustainable <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Fisheries</span>
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                                At Ocelyn, we combine cutting-edge satellite technology with advanced machine learning to provide fishermen with the most accurate oceanographic data available. Our mission is to make fishing more efficient, profitable, and sustainable.
                            </p>
                            <div className="grid grid-cols-2 gap-6 mt-8">
                                <div className="p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/50 backdrop-blur-sm">
                                    <h4 className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-1">98%</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Prediction Accuracy</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/50 backdrop-blur-sm">
                                    <h4 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">50+</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Species Tracked</p>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-white/20 backdrop-blur-md flex items-center justify-center group"
                        >
                            {/* Light Mode Image */}
                            <div 
                                className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-multiply dark:hidden transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url(${dataDrivenImageLight})` }}
                            />
                            {/* Dark Mode Image */}
                            <div 
                                className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay hidden dark:block transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url(${dataDrivenImage})` }}
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-20 relative z-10">
                <div className="container px-6">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Get in Touch</h2>
                        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            Have questions about our technology or enterprise solutions? We'd love to hear from you.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        <motion.div 
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="lg:col-span-1 space-y-8"
                        >
                            <motion.div variants={fadeInUp} className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 text-violet-600 dark:text-violet-400">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Email Us</h3>
                                    <p className="text-slate-600 dark:text-slate-300">support@ocelyn.com</p>
                                    <p className="text-slate-600 dark:text-slate-300">sales@ocelyn.com</p>
                                </div>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                                    <Phone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Call Us</h3>
                                    <p className="text-slate-600 dark:text-slate-300">+1 (555) 123-4567</p>
                                    <p className="text-slate-600 dark:text-slate-300">Mon-Fri, 9am-6pm EST</p>
                                </div>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Visit Us</h3>
                                    <p className="text-slate-600 dark:text-slate-300">100 Ocean Drive</p>
                                    <p className="text-slate-600 dark:text-slate-300">Miami, FL 33139</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="lg:col-span-2 p-8 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-white/50 dark:border-slate-700/50 backdrop-blur-md shadow-xl"
                        >
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                                        <Input id="name" placeholder="John Doe" className="bg-white/50 dark:bg-slate-800/50 border-white/40 dark:border-slate-700" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                                        <Input id="email" type="email" placeholder="john@example.com" className="bg-white/50 dark:bg-slate-800/50 border-white/40 dark:border-slate-700" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                                    <Input id="subject" placeholder="How can we help?" className="bg-white/50 dark:bg-slate-800/50 border-white/40 dark:border-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
                                    <Textarea id="message" placeholder="Tell us more about your inquiry..." className="min-h-[150px] bg-white/50 dark:bg-slate-800/50 border-white/40 dark:border-slate-700" />
                                </div>
                                <Button className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-lg font-medium shadow-lg shadow-violet-500/20">
                                    Send Message <Send className="ml-2 h-5 w-5" />
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-white/10 bg-white/5 dark:bg-slate-900/50 backdrop-blur-md relative z-10">
                <div className="container px-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                    <p>&copy; 2024 Ocelyn. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
