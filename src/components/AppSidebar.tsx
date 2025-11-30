import {
  Map,
  Fish,
  Wrench,
  TrendingUp,
  Ship,
  Home,
  LogOut,
  Anchor,
  ClipboardCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/images/logo.svg";

const items = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: TrendingUp },
  { title: "Hotspot Map", url: "/hotspot-map", icon: Map },
  { title: "Species & Spawning", url: "/species", icon: Fish },
  { title: "Gear Management", url: "/gear", icon: Anchor },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Market Trends", url: "/market", icon: TrendingUp },
  { title: "Trip Planner", url: "/trip-planner", icon: Ship },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className={collapsed ? "flex justify-center py-4" : "px-4 py-2"}>
            {collapsed ? (
              <img src={logo} alt="Ocelyn" className="h-8 w-8" />
            ) : (
              <SidebarGroupLabel className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Ocelyn
              </SidebarGroupLabel>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent w-full flex items-center p-2"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <span className="text-base ml-3">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-10">
              <NavLink
                to="/login"
                className="hover:bg-sidebar-accent text-red-500 hover:text-red-600 w-full flex items-center p-2"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="text-base ml-3">Log Out</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
