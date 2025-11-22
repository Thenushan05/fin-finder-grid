import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import HotspotMap from "./pages/HotspotMap";
import Species from "./pages/Species";
import Gear from "./pages/Gear";
import Market from "./pages/Market";
import TripPlanner from "./pages/TripPlanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hotspot-map" element={<HotspotMap />} />
            <Route path="/species" element={<Species />} />
            <Route path="/gear" element={<Gear />} />
            <Route path="/market" element={<Market />} />
            <Route path="/trip-planner" element={<TripPlanner />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
