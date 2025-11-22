import { Button } from "@/components/ui/button";
import { Waves, Map, TrendingUp, Ship, ArrowRight, Fish } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navbar */}
            <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Waves className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold text-foreground">FinFinder</span>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8">
                        <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</a>
                        <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
                        <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>
                        <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link to="/home">
                            <Button>Launch App</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="flex-1 flex items-center justify-center py-20 lg:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10 -z-10" />
                <div className="container px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
                        <Fish className="h-4 w-4" />
                        <span>Next-Gen Fisheries Intelligence</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto">
                        Predict. Plan. <span className="text-primary">Catch.</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        Advanced satellite data and AI models to predict optimal fishing zones, track market trends, and plan your trips efficiently.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/home">
                            <Button size="lg" className="h-12 px-8 text-lg gap-2">
                                Get Started Now <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                            View Demo
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-accent/5">
                <div className="container px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Everything you need to succeed</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Comprehensive tools designed for modern fishermen and commercial fleets.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                <Map className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Hotspot Prediction</h3>
                            <p className="text-muted-foreground">
                                AI-powered maps showing high-probability fishing zones based on SST, chlorophyll, and depth data.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Market Intelligence</h3>
                            <p className="text-muted-foreground">
                                Real-time market price tracking and trend analysis to maximize your catch value.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                <Ship className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Trip Planning</h3>
                            <p className="text-muted-foreground">
                                Calculate fuel costs, estimated distances, and optimize your routes for maximum efficiency.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-border">
                <div className="container px-6 text-center text-muted-foreground text-sm">
                    <p>&copy; 2024 FinFinder. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
