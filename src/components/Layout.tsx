import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Waves, Fish, Map, User, LayoutDashboard, Wrench } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const isHotspotMap = location.pathname === "/hotspot-map";
  const isSpecies = location.pathname === "/species";
  const isDashboard = location.pathname === "/dashboard";
  const isMaintenance = location.pathname === "/maintenance";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 sticky top-0 z-10">
            <SidebarTrigger className="text-foreground" />
            <div className="flex items-center gap-2 flex-1">
              {isHotspotMap ? (
                <Map className="h-6 w-6 text-primary" />
              ) : isSpecies ? (
                <Fish className="h-6 w-6 text-primary" />
              ) : isDashboard ? (
                <LayoutDashboard className="h-6 w-6 text-primary" />
              ) : isMaintenance ? (
                <Wrench className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              ) : (
                <Waves className="h-6 w-6 text-primary" />
              )}
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {isHotspotMap ? "Fish Hotspot Map" : isSpecies ? "Species & Spawning Intelligence" : isDashboard ? "Dashboard Overview" : isMaintenance ? "Vessel Maintenance" : "Fish Spot Intelligence"}
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
                {isDashboard && (
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Welcome to your fisheries intelligence center
                  </p>
                )}
                {isMaintenance && (
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Manage vessels, track maintenance, and monitor status
                  </p>
                )}
              </div>
            </div>
            
            <Link 
              to="/profile"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              title="View Profile"
            >
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src="" alt={user?.email || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <ThemeToggle />
          </header>
          <main className={cn("flex-1", !isMaintenance && "p-6")}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
