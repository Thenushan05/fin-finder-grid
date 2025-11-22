import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, TrendingUp, Ship, ArrowRight, Fish, Waves } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className="space-y-8">
            {/* Cover Section */}
            <div className="relative overflow-hidden rounded-3xl shadow-xl text-white">
                {/* Background Image - Underwater fish/ocean scene */}
                <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070&auto=format&fit=crop")',
                        filter: 'brightness(0.5)'
                    }}
                />

                {/* Content */}
                <div className="relative z-10 px-8 py-16 md:py-24 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 text-sm font-medium mb-6">
                        <Waves className="h-4 w-4" />
                        <span>Welcome to FinFinder</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Master the Ocean
                    </h1>

                    <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-10">
                        Your all-in-one platform for fish spot prediction, market intelligence, and voyage planning.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/hotspot-map">
                            <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-semibold h-12 px-8">
                                Explore Map <Map className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link to="/dashboard">
                            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 h-12 px-8">
                                View Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                <Link to="/hotspot-map" className="group">
                    <Card className="h-full border-border hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group-hover:bg-accent/5">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <Map className="h-6 w-6" />
                            </div>
                            <CardTitle>Hotspot Map</CardTitle>
                            <CardDescription>
                                Find high-probability fishing zones with AI.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link to="/market" className="group">
                    <Card className="h-full border-border hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group-hover:bg-accent/5">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <CardTitle>Market Trends</CardTitle>
                            <CardDescription>
                                Track prices and maximize your profit.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link to="/trip-planner" className="group">
                    <Card className="h-full border-border hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group-hover:bg-accent/5">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <Ship className="h-6 w-6" />
                            </div>
                            <CardTitle>Trip Planner</CardTitle>
                            <CardDescription>
                                Optimize routes and estimate fuel costs.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
