import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import HotspotMap from "./pages/HotspotMap";
import Species from "./pages/Species";
import Gear from "./pages/Gear";
import Market from "./pages/Market";
import TripPlanner from "./pages/TripPlanner";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import { MapProvider } from "@/context/MapContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MapProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />

            {/* App Routes wrapped in Layout */}
            <Route path="/home" element={<Layout><Home /></Layout>} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/hotspot-map" element={<Layout><HotspotMap /></Layout>} />
            <Route path="/species" element={<Layout><Species /></Layout>} />
            <Route path="/gear" element={<Layout><Gear /></Layout>} />
            <Route path="/market" element={<Layout><Market /></Layout>} />
            <Route path="/trip-planner" element={<Layout><TripPlanner /></Layout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </MapProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
