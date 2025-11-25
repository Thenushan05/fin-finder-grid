import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Waves, Fish } from "lucide-react";
import { useLocation } from "react-router-dom";

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isHotspotMap = location.pathname === "/hotspot-map";
  const isSpecies = location.pathname === "/species";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 sticky top-0 z-10">
            <SidebarTrigger className="text-foreground" />
            <div className="flex items-center gap-2 flex-1">
              {isHotspotMap ? (
                <Waves className="h-6 w-6 text-primary" />
              ) : isSpecies ? (
                <Fish className="h-6 w-6 text-primary" />
              ) : (
                <Waves className="h-6 w-6 text-primary" />
              )}
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {isHotspotMap ? "Fish Hotspot Map" : isSpecies ? "Species & Spawning Intelligence" : "Fish Spot Intelligence"}
                </h1>
                {isHotspotMap && (
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Interactive predictions for optimal fishing zones
                  </p>
                )}
                {isSpecies && (
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Browse fish species profiles and spawning patterns
                  </p>
                )}
              </div>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
