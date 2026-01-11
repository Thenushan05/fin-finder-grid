import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Ship,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Anchor,
  Zap,
  Thermometer,
  Radio,
  Activity,
  Fuel,
  Gauge,
  Fan,
  Disc,
  FileText,
  LifeBuoy,
  Snowflake,
  Navigation,
  Signal,
  Battery,
  History,
  ClipboardList,
  AlertOctagon,
  BrainCircuit,
  CalendarDays,
  Clock,
  Droplets,
} from "lucide-react";
import { motion } from "framer-motion";
import { RootState, AppDispatch } from "@/store";
import {
  fetchVessels,
  setSelectedVessel,
  createVessel,
  type Vessel,
} from "@/store/maintenanceSlice";
import { useToast } from "@/hooks/use-toast";
import { ManualVesselCreator } from "@/components/ManualVesselCreator";
import AddVesselDialog from "@/components/AddVesselDialog";

// --- Types & Interfaces ---

type SystemStatus =
  | "operational"
  | "due-soon"
  | "overdue"
  | "critical"
  | "offline";

interface MaintenanceTask {
  id: string;
  task: string;
  due: string; // e.g., "in 12 hrs", "2025-12-01"
  priority: "low" | "medium" | "high";
}

interface ServiceLog {
  date: string;
  technician: string;
  notes: string;
  cost?: string;
}

interface SystemSpecs {
  [key: string]:
    | string
    | { value: string; status: "good" | "warning" | "critical" };
}

interface FishingSystem {
  id: string;
  name: string;
  icon: any;
  status: SystemStatus;
  description: string;

  // Blueprint / Visuals
  blueprintImage: string;
  blueprintStyle: any; // CSS styles for positioning

  // Data
  specs: SystemSpecs;
  upcomingTasks: MaintenanceTask[];
  lastService: ServiceLog;
  aiTips?: string[];

  // Sub-parts (Hotspots)
  subParts?: {
    id: string;
    label: string;
    x: number;
    y: number;
    status: "good" | "warning";
  }[];
}

interface VesselStats {
  lastTrip: string;
  engineHours: number;
  fuelOnBoard: string;
  iceCapacity: string;
  nextServiceDue: string;
}

interface VesselData {
  id: string;
  name: string;
  type: string;
  stats: VesselStats;
  imageScale: number;
  imageStyle?: any;
  systems: FishingSystem[];
}

// --- Data Definitions ---

const COMMON_STYLES = {
  realBlueprint: {
    filter: "none",
    opacity: 1,
  },
  schematic: {
    filter: "none",
    opacity: 1,
  },
};

const VESSEL_DATA: Record<string, VesselData> = {
  IMUL: {
    id: "IMUL",
    name: "IMUL-001",
    type: "Multi-Day Vessel",
    stats: {
      lastTrip: "2025-11-28",
      engineHours: 1240,
      fuelOnBoard: "8,500 L",
      iceCapacity: "85%",
      nextServiceDue: "in 60 engine hours",
    },
    imageScale: 1.0,
    systems: [
      {
        id: "general",
        name: "General Vessel Health",
        icon: <Activity className="w-5 h-5" />,
        status: "operational",
        description: "Overall hull integrity and stability systems.",
        blueprintImage: "/imul_real_blueprint.png",
        blueprintStyle: {
          objectPosition: "center",
          transform: "scale(1)",
          ...COMMON_STYLES.realBlueprint,
        },
        specs: {
          "Hull Condition": "Good",
          Draft: "1.2m",
          List: "None",
          "Bilge Levels": "Normal",
        },
        upcomingTasks: [
          {
            id: "t1",
            task: "Inspect hull for barnacles",
            due: "Next Month",
            priority: "low",
          },
        ],
        lastService: {
          date: "2025-10-15",
          technician: "MarineTech Ltd",
          notes: "Annual survey completed. No issues.",
        },
        aiTips: ["Sea state rough tomorrow -> Check deck lashings."],
      },
      {
        id: "engine",
        name: "Engine & Propulsion",
        icon: <Zap className="w-5 h-5" />,
        status: "due-soon",
        description: "Main inboard diesel engine and transmission.",
        blueprintImage: "/engine_blueprint_new.png",
        blueprintStyle: {
          objectPosition: "center",
          transform: "scale(1)",
          ...COMMON_STYLES.schematic,
        },
        specs: {
          "Oil Level": { value: "Low", status: "warning" },
          "Coolant Temp": "80°C",
          "RPM (Idle)": "750",
          "Fuel Pressure": "Normal",
        },
        upcomingTasks: [
          {
            id: "t2",
            task: "Change engine oil",
            due: "in 12 hrs",
            priority: "high",
          },
          {
            id: "t3",
            task: "Check belt tension",
            due: "in 48 hrs",
            priority: "medium",
          },
        ],
        lastService: {
          date: "2025-11-10",
          technician: "J. Silva",
          notes: "Replaced fuel filter.",
        },
        aiTips: ["Long trip planned -> Top up oil level."],
      },
      {
        id: "nets",
        name: "Nets & Gear",
        icon: <Anchor className="w-5 h-5" />,
        status: "operational",
        description: "Winches, drums, and fishing nets.",
        blueprintImage: "/deck_blueprint_new.png",
        blueprintStyle: {
          objectPosition: "center",
          transform: "scale(1)",
          ...COMMON_STYLES.schematic,
        },
        specs: {
          "Net Condition": "Good",
          "Winch Pressure": "150 bar",
          "Cable Wear": "Minimal",
        },
        upcomingTasks: [
          {
            id: "t4",
            task: "Inspect nets for tears",
            due: "Before next trip",
            priority: "medium",
          },
        ],
        lastService: {
          date: "2025-11-20",
          technician: "Crew",
          notes: "Repaired minor tear in starboard net.",
        },
        subParts: [
          { id: "drum", label: "Main Drum", x: 50, y: 50, status: "good" },
        ],
      },
      {
        id: "electronics",
        name: "Electronics & Sensors",
        icon: <Signal className="w-5 h-5" />,
        status: "operational",
        description: "Navigation, communication, and fish finding gear.",
        blueprintImage: "/imul_real_blueprint.png",
        blueprintStyle: {
          objectPosition: "50% 20%",
          transform: "scale(2.5)",
          ...COMMON_STYLES.realBlueprint,
        },
        specs: {
          GPS: "Locked (12 sats)",
          Sonar: "Clear",
          Battery: "24.2 V",
          Radar: "Standby",
        },
        upcomingTasks: [
          {
            id: "t5",
            task: "Update chart data",
            due: "Next Week",
            priority: "low",
          },
        ],
        lastService: {
          date: "2025-09-01",
          technician: "ElectroMarine",
          notes: "Installed new transducer.",
        },
        aiTips: ["High winds expected -> Verify radio antenna connection."],
      },
      {
        id: "fuel",
        name: "Fuel & Tanks",
        icon: <Fuel className="w-5 h-5" />,
        status: "operational",
        description: "Main and auxiliary fuel storage.",
        blueprintImage: "/imul_real_blueprint.png",
        blueprintStyle: {
          objectPosition: "60% 70%",
          transform: "scale(3)",
          ...COMMON_STYLES.realBlueprint,
        }, // Zoomed in on tank area
        specs: {
          "Main Tank": "85%",
          "Aux Tank": "Full",
          "Filter Status": "Clean",
        },
        upcomingTasks: [
          {
            id: "t6",
            task: "Drain water separator",
            due: "Weekly",
            priority: "medium",
          },
        ],
        lastService: {
          date: "2025-11-01",
          technician: "Crew",
          notes: "Tank dipped and verified.",
        },
      },
      {
        id: "safety",
        name: "Safety & Compliance",
        icon: <LifeBuoy className="w-5 h-5" />,
        status: "operational",
        description: "Life saving appliances and fire fighting equipment.",
        blueprintImage: "/imul_real_blueprint.png",
        blueprintStyle: {
          objectPosition: "center",
          transform: "scale(1)",
          ...COMMON_STYLES.realBlueprint,
        }, // General view for now
        specs: {
          "Life Raft": "Certified",
          Flares: "Valid",
          "Fire Extinguishers": "Charged",
        },
        upcomingTasks: [
          {
            id: "t7",
            task: "Check lifejacket lights",
            due: "Monthly",
            priority: "low",
          },
        ],
        lastService: {
          date: "2025-06-01",
          technician: "SafetyFirst",
          notes: "Annual safety inspection passed.",
        },
      },
      {
        id: "storage",
        name: "Cold Storage / Ice",
        icon: <Snowflake className="w-5 h-5" />,
        status: "operational",
        description: "RSW tanks and ice holds.",
        blueprintImage: "/imul_real_blueprint.png",
        blueprintStyle: {
          objectPosition: "50% 60%",
          transform: "scale(3)",
          ...COMMON_STYLES.realBlueprint,
        },
        specs: {
          Temp: "-1.5°C",
          "Circulation Pump": "Running",
          "Freon Level": "OK",
        },
        upcomingTasks: [
          {
            id: "t8",
            task: "Clean condenser coils",
            due: "in 3 days",
            priority: "medium",
          },
        ],
        lastService: {
          date: "2025-11-15",
          technician: "CoolTech",
          notes: "Top-up refrigerant.",
        },
      },
    ],
  },
  IDAY: {
    id: "IDAY",
    name: "IDAY-Coastal",
    type: "Single Day Vessel",
    stats: {
      lastTrip: "2025-11-29",
      engineHours: 450,
      fuelOnBoard: "1,200 L",
      iceCapacity: "Full",
      nextServiceDue: "2025-12-15",
    },
    imageScale: 0.85,
    systems: [
      {
        id: "general",
        name: "General Vessel Health",
        icon: <Activity className="w-5 h-5" />,
        status: "operational",
        description: "Hull and deck condition.",
        blueprintImage: "/iday_real_blueprint.png",
        blueprintStyle: {
          objectPosition: "center",
          transform: "scale(1)",
          ...COMMON_STYLES.realBlueprint,
        },
        specs: { Hull: "GRP", Keel: "Full", Bilge: "Dry" },
        upcomingTasks: [],
        lastService: {
          date: "2025-10-01",
          technician: "Local Yard",
          notes: "Antifouling applied.",
        },
      },
      {
        id: "engine",
        name: "Engine & Propulsion",
        icon: <Zap className="w-5 h-5" />,
        status: "operational",
        description: "Small inboard diesel engine.",
        blueprintImage: "/small_engine_blueprint.png",
        blueprintStyle: {
          objectPosition: "center",
          transform: "scale(1.2)",
          ...COMMON_STYLES.schematic,
        },
        specs: { Oil: "OK", Temp: "82°C", Belts: "Good" },
        upcomingTasks: [
          {
            id: "t9",
            task: "Check coolant level",
            due: "Daily",
            priority: "low",
          },
        ],
        lastService: {
          date: "2025-11-05",
          technician: "Mechanic",
          notes: "Oil change.",
        },
      },
      {
        id: "nets",
        name: "Nets & Gear",
        icon: <Anchor className="w-5 h-5" />,
        status: "due-soon",
        description: "Manual winches and nets.",
        blueprintImage: "/iday_real_blueprint.png",
        blueprintStyle: {
          objectPosition: "center",
          transform: "scale(1)",
          ...COMMON_STYLES.realBlueprint,
        },
        specs: { "Net Condition": "Worn", Ropes: "Frayed" },
        upcomingTasks: [
          {
            id: "t10",
            task: "Replace lead line",
            due: "ASAP",
            priority: "high",
          },
        ],
        lastService: {
          date: "2025-11-25",
          technician: "Crew",
          notes: "Mended holes.",
        },
      },
      // ... (Simplified for brevity, can add more if needed)
    ],
  },
  OFRP: {
    id: "OFRP",
    name: "OFRP-Skiff",
    type: "Outboard Boat",
    stats: {
      lastTrip: "Today",
      engineHours: 85,
      fuelOnBoard: "150 L",
      iceCapacity: "Box Full",
      nextServiceDue: "in 15 hrs",
    },
    imageScale: 0.7,
    systems: [
      {
        id: "general",
        name: "General Vessel Health",
        icon: <Activity className="w-5 h-5" />,
        status: "operational",
        description: "Open fiberglass hull.",
        blueprintImage: "/ofrp_real_blueprint.png",
        blueprintStyle: {
          objectPosition: "center",
          transform: "scale(1)",
          ...COMMON_STYLES.realBlueprint,
        },
        specs: { Hull: "Good", Transom: "Solid" },
        upcomingTasks: [],
        lastService: {
          date: "2025-11-01",
          technician: "Owner",
          notes: "Washed and waxed.",
        },
      },
      {
        id: "engine",
        name: "Outboard Motor",
        icon: <Disc className="w-5 h-5" />,
        status: "due-soon",
        description: "40HP Outboard Motor.",
        blueprintImage: "/outboard_engine_blueprint.png",
        blueprintStyle: {
          objectPosition: "80% 50%",
          transform: "scale(2)",
          ...COMMON_STYLES.schematic,
        },
        specs: {
          Propeller: { value: "Nicked", status: "warning" },
          "Cooling Stream": "Weak",
          Oil: "OK",
        },
        upcomingTasks: [
          {
            id: "t11",
            task: "Check water pump impeller",
            due: "Next Service",
            priority: "medium",
          },
        ],
        lastService: {
          date: "2025-10-20",
          technician: "Dealer",
          notes: "Gear oil changed.",
        },
      },
    ],
  },
};

// --- Components ---

function StatusBadge({ status }: { status: SystemStatus }) {
  const styles = {
    operational: "bg-green-500/10 text-green-500 border-green-500/20",
    "due-soon": "bg-amber-500/10 text-amber-500 border-amber-500/20",
    overdue: "bg-red-500/10 text-red-500 border-red-500/20",
    critical: "bg-red-600/10 text-red-600 border-red-600/20 animate-pulse",
    offline: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };

  const labels = {
    operational: "Operational",
    "due-soon": "Due Soon",
    overdue: "Overdue",
    critical: "Critical",
    offline: "Offline",
  };

  return (
    <Badge variant="outline" className={`${styles[status]} border`}>
      {labels[status]}
    </Badge>
  );
}

// Icon mapping helper
const getSystemIcon = (systemId: string) => {
  const iconMap: Record<string, any> = {
    general: <Activity className="w-5 h-5" />,
    engine: <Zap className="w-5 h-5" />,
    nets: <Anchor className="w-5 h-5" />,
    electronics: <Signal className="w-5 h-5" />,
    fuel: <Fuel className="w-5 h-5" />,
    safety: <LifeBuoy className="w-5 h-5" />,
    storage: <Snowflake className="w-5 h-5" />,
  };
  return iconMap[systemId] || <Activity className="w-5 h-5" />;
};

// Blueprint style helper
const getBlueprintStyle = (systemId: string) => {
  const styleMap: Record<string, any> = {
    general: {
      objectPosition: "center",
      transform: "scale(1)",
      ...COMMON_STYLES.realBlueprint,
    },
    engine: {
      objectPosition: "center",
      transform: "scale(1)",
      ...COMMON_STYLES.schematic,
    },
    nets: {
      objectPosition: "center",
      transform: "scale(1)",
      ...COMMON_STYLES.schematic,
    },
    electronics: {
      objectPosition: "50% 20%",
      transform: "scale(2.5)",
      ...COMMON_STYLES.realBlueprint,
    },
    fuel: {
      objectPosition: "60% 70%",
      transform: "scale(3)",
      ...COMMON_STYLES.realBlueprint,
    },
    safety: {
      objectPosition: "center",
      transform: "scale(1)",
      ...COMMON_STYLES.realBlueprint,
    },
    storage: {
      objectPosition: "50% 60%",
      transform: "scale(3)",
      ...COMMON_STYLES.realBlueprint,
    },
  };
  return (
    styleMap[systemId] || { objectPosition: "center", transform: "scale(1)" }
  );
};

export default function Maintenance() {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const { vessels, loading, error, selectedVesselId } = useSelector(
    (state: RootState) => state.maintenance
  );

  const [selectedSystemId, setSelectedSystemId] = useState<string>("general");
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch vessels on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await dispatch(fetchVessels()).unwrap();
        // Auto-creation disabled - users must manually create vessels
      } catch (err: any) {
        toast({
          title: "Error Loading Vessels",
          description: err || "Failed to load vessel data",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeData();
  }, []);

  // Reload vessels function for AddVesselDialog
  const reloadVessels = async () => {
    try {
      await dispatch(fetchVessels()).unwrap();
      toast({
        title: "Vessels Reloaded",
        description: "Vessel list has been updated.",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error Reloading Vessels",
        description: err || "Failed to reload vessel data",
        variant: "destructive",
      });
    }
  };

  // Get active vessel from Redux or fallback to local data
  const activeVessel =
    vessels.find((v) => v.id === selectedVesselId) ||
    (vessels.length > 0 ? vessels[0] : null) ||
    VESSEL_DATA["IMUL"];

  const activeSystem =
    activeVessel?.systems?.find((s) => s.id === selectedSystemId) ||
    activeVessel?.systems?.[0] ||
    VESSEL_DATA["IMUL"].systems[0];

  // Set initial selected vessel
  useEffect(() => {
    if (vessels.length > 0 && !selectedVesselId) {
      dispatch(setSelectedVessel(vessels[0].id));
    }
  }, [vessels, selectedVesselId, dispatch]);

  // Loading state
  if (isInitializing || loading) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading vessel data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => dispatch(fetchVessels())}>
              <RotateCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No vessels state
  if (!activeVessel) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Vessels Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You don't have any vessels configured yet.
            </p>
            <Button onClick={() => window.location.reload()}>
              Initialize Default Vessels
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full h-[calc(100vh-4rem)] flex flex-col gap-4 p-4 overflow-x-hidden overflow-y-hidden">
      {/* Manual Vessel Creation Button */}
      {vessels.length === 0 && (
        <div className="shrink-0">
          <Card className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No Vessels Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first vessel to start tracking maintenance.
            </p>
            <ManualVesselCreator />
          </Card>
        </div>
      )}

      {/* 1. Top Summary Bar - Flex Wrap for safety */}
      {vessels.length > 0 && (
        <>
          <div className="shrink-0 flex flex-wrap gap-3 items-center">
            <ManualVesselCreator />
          </div>
          <div className="shrink-0 flex flex-wrap gap-3">
            <Card className="flex-1 min-w-[140px] bg-slate-950 border-slate-800 p-3 flex flex-col justify-center shadow-md">
              <div className="text-xs text-muted-foreground uppercase font-bold mb-1 truncate">
                Vessel
              </div>
              <div className="font-bold text-lg text-white truncate">
                {activeVessel.name}
              </div>
              <div className="text-xs text-cyan-400 truncate">
                {activeVessel.type}
              </div>
            </Card>
            <Card className="flex-1 min-w-[140px] bg-slate-950 border-slate-800 p-3 flex flex-col justify-center shadow-md">
              <div className="text-xs text-muted-foreground uppercase font-bold mb-1 truncate">
                Last Trip
              </div>
              <div className="font-bold text-lg text-white truncate">
                {activeVessel.stats.lastTrip}
              </div>
              <div className="text-xs text-green-400 truncate">Completed</div>
            </Card>
            <Card className="flex-1 min-w-[140px] bg-slate-950 border-slate-800 p-3 flex flex-col justify-center shadow-md">
              <div className="text-xs text-muted-foreground uppercase font-bold mb-1 truncate">
                Engine Hours
              </div>
              <div className="font-bold text-lg text-white truncate">
                {activeVessel.stats.engineHours} h
              </div>
              <div className="text-xs text-muted-foreground truncate">
                Total Run Time
              </div>
            </Card>
            <Card className="flex-1 min-w-[140px] bg-slate-950 border-slate-800 p-3 flex flex-col justify-center shadow-md">
              <div className="text-xs text-muted-foreground uppercase font-bold mb-1 truncate">
                Fuel On Board
              </div>
              <div className="font-bold text-lg text-white truncate">
                {activeVessel.stats.fuelOnBoard}
              </div>
              <div className="text-xs text-green-400 truncate">Sufficient</div>
            </Card>
            <Card className="flex-1 min-w-[140px] bg-slate-950 border-slate-800 p-3 flex flex-col justify-center shadow-md">
              <div className="text-xs text-muted-foreground uppercase font-bold mb-1 truncate">
                Ice Capacity
              </div>
              <div className="font-bold text-lg text-white truncate">
                {activeVessel.stats.iceCapacity}
              </div>
              <div className="text-xs text-blue-400 truncate">Ready</div>
            </Card>
            <Card className="flex-1 min-w-[140px] bg-slate-950 border-slate-800 p-3 flex flex-col justify-center relative overflow-hidden shadow-md">
              <div className="absolute right-0 top-0 p-2 opacity-10">
                <Wrench className="w-12 h-12" />
              </div>
              <div className="text-xs text-muted-foreground uppercase font-bold mb-1 truncate">
                Next Service
              </div>
              <div className="font-bold text-lg text-amber-400 truncate">
                {activeVessel.stats.nextServiceDue}
              </div>
              <div className="text-xs text-amber-400/70 truncate">
                Scheduled
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
            {/* 2. Left Sidebar - System Index (Fixed Width on Desktop, scrollable) */}
            <div className="lg:w-64 flex flex-col h-full shrink-0 min-h-0">
              <Card className="h-full flex flex-col bg-card border-border shadow-lg overflow-hidden">
                <CardHeader className="pb-3 border-b border-border bg-muted/30 py-3 shrink-0">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    System Index
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="p-2 space-y-1">
                    {activeVessel.systems.map((sys) => (
                      <button
                        key={sys.id}
                        onClick={() => setSelectedSystemId(sys.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left group ${
                          selectedSystemId === sys.id
                            ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                            : "bg-transparent border-transparent hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-md shrink-0 ${
                            selectedSystemId === sys.id
                              ? "bg-blue-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {getSystemIcon(sys.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs truncate">
                            {sys.name}
                          </div>
                          <div className="text-[10px] opacity-70 truncate">
                            {sys.status}
                          </div>
                        </div>
                        {sys.status !== "operational" && (
                          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </CardContent>
                </ScrollArea>
                {/* Vessel Selector at bottom of sidebar */}
                <div className="p-2 border-t bg-muted/10 shrink-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Vessels
                    </span>
                    <AddVesselDialog onVesselAdded={reloadVessels} />
                  </div>
                  <Select
                    value={selectedVesselId || undefined}
                    onValueChange={(v) => {
                      dispatch(setSelectedVessel(v));
                      setSelectedSystemId("general");
                    }}
                  >
                    <SelectTrigger className="w-full bg-card border-primary/20 text-xs">
                      <SelectValue placeholder="Select Vessel" />
                    </SelectTrigger>
                    <SelectContent>
                      {vessels.map((vessel) => (
                        <SelectItem key={vessel.id} value={vessel.id}>
                          {vessel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </div>

            {/* 3. Center Panel - Selected System Details (Flexible Width) */}
            <div className="flex-1 flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1">
              {/* Header Card */}
              <Card className="bg-card border-border shadow-sm shrink-0">
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 truncate">
                        {getSystemIcon(activeSystem.id)}
                        {activeSystem.name}
                      </h2>
                      <StatusBadge status={activeSystem.status} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {activeSystem.description}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ClipboardList className="w-4 h-4" /> Log
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-amber-500 border-amber-500/20 hover:bg-amber-500/10"
                    >
                      <AlertOctagon className="w-4 h-4" /> Report
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <History className="w-4 h-4" /> History
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Blueprint Viewer */}
              <div className="bg-[#003366] rounded-xl overflow-hidden relative shadow-inner border border-[#004488] min-h-[300px] shrink-0 flex flex-col">
                <div
                  className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
                <div className="absolute top-4 left-4 z-10">
                  <Badge
                    variant="outline"
                    className="border-white/30 text-white/70 bg-black/20 backdrop-blur-md"
                  >
                    SCHEMATIC VIEW
                  </Badge>
                </div>

                <div className="flex-1 relative flex items-center justify-center p-8">
                  <img
                    src={activeSystem.blueprintImage}
                    alt="Blueprint"
                    style={getBlueprintStyle(activeSystem.id)}
                    className="max-w-full max-h-full object-contain transition-all duration-500"
                  />
                  {/* Render Sub-parts if any */}
                  {activeSystem.subParts?.map((sub) => (
                    <div
                      key={sub.id}
                      className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-white border-2 border-blue-500 shadow-[0_0_10px_white] animate-pulse"
                      style={{ left: `${sub.x}%`, top: `${sub.y}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Tasks & Tips Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 shrink-0">
                {/* Upcoming Tasks */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2 py-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" /> Upcoming
                      Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {activeSystem.upcomingTasks.length > 0 ? (
                        activeSystem.upcomingTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  task.priority === "high"
                                    ? "bg-red-500"
                                    : task.priority === "medium"
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <span className="text-sm font-medium truncate">
                                {task.task}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap ml-2">
                              {task.due}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No pending tasks.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Tips & Trip Forecast */}
                <Card className="bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border-indigo-500/20">
                  <CardHeader className="pb-2 py-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                      <BrainCircuit className="w-4 h-4" /> FishSpot Predictions
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-[10px]"
                    >
                      TOMORROW
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    {/* Trip Load Estimate */}
                    <div className="flex items-center justify-between p-2 rounded bg-indigo-950/40 border border-indigo-500/20">
                      <div className="text-xs text-indigo-200">
                        <span className="block font-bold text-indigo-100">
                          Est. Trip Load
                        </span>
                        <span className="opacity-70">High Intensity</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-400">
                          Heavy
                        </div>
                      </div>
                    </div>

                    {activeSystem.aiTips && activeSystem.aiTips.length > 0 ? (
                      <div className="space-y-2">
                        {activeSystem.aiTips.map((tip, idx) => (
                          <div
                            key={idx}
                            className="flex gap-2 text-sm text-indigo-200/80"
                          >
                            <span className="text-indigo-400">•</span>
                            {tip}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        System operating optimally.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 5. Bottom Section - Maintenance Timeline (Vertical List to avoid X-scroll) */}
              <Card className="bg-card border-border shadow-sm shrink-0">
                <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <History className="w-4 h-4" /> Maintenance Timeline
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    View Log
                  </Button>
                </CardHeader>
                <div className="p-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      {
                        date: "2025-11-20",
                        system: "Nets & Gear",
                        action: "Repaired large tear in starboard net",
                        tech: "Crew",
                      },
                      {
                        date: "2025-11-10",
                        system: "Engine",
                        action: "Oil change & filter replacement",
                        tech: "J. Silva",
                      },
                      {
                        date: "2025-11-01",
                        system: "Fuel",
                        action: "Tank dipped and verified",
                        tech: "Crew",
                      },
                      {
                        date: "2025-10-15",
                        system: "General",
                        action: "Annual survey completed",
                        tech: "MarineTech",
                      },
                    ].map((log, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border"
                      >
                        <div className="bg-primary/10 p-2 rounded text-primary shrink-0">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-muted-foreground">
                            {log.date} • {log.system}
                          </div>
                          <div className="text-sm font-medium line-clamp-1">
                            {log.action}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Tech: {log.tech}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* 4. Right Panel - Technical Data (Fixed Width on Desktop) */}
            <div className="lg:w-80 flex flex-col h-full shrink-0 min-h-0">
              <Card className="h-full flex flex-col bg-card border-border shadow-lg overflow-hidden">
                <CardHeader className="pb-4 border-b border-border bg-muted/30 shrink-0">
                  <CardTitle className="text-lg">Technical Data</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="p-4 space-y-6">
                    {/* Condition Card */}
                    <div
                      className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 ${
                        activeSystem.status === "operational"
                          ? "bg-green-500/5 border-green-500/20"
                          : activeSystem.status === "due-soon"
                          ? "bg-amber-500/5 border-amber-500/20"
                          : "bg-red-500/5 border-red-500/20"
                      }`}
                    >
                      <div className="text-xs font-bold uppercase opacity-70">
                        Current Condition
                      </div>
                      <div
                        className={`text-xl font-black ${
                          activeSystem.status === "operational"
                            ? "text-green-500"
                            : activeSystem.status === "due-soon"
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                      >
                        {activeSystem.status.replace("-", " ").toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activeSystem.status === "operational"
                          ? "All systems nominal"
                          : "Attention required"}
                      </div>
                    </div>

                    {/* Specs List */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b pb-1">
                        Specifications
                      </h4>
                      {Object.entries(activeSystem.specs).map(
                        ([key, value]) => {
                          const displayValue =
                            typeof value === "object" ? value.value : value;
                          const status =
                            typeof value === "object" ? value.status : "good";

                          return (
                            <div
                              key={key}
                              className="flex justify-between items-center text-sm group"
                            >
                              <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate mr-2">
                                {key}
                              </span>
                              <span
                                className={`font-mono font-bold text-right ${
                                  status === "warning"
                                    ? "text-amber-500"
                                    : status === "critical"
                                    ? "text-red-500"
                                    : "text-foreground"
                                }`}
                              >
                                {displayValue}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* Last Service Summary */}
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Last Service
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-medium">
                            {activeSystem.lastService.date}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tech</span>
                          <span className="font-medium">
                            {activeSystem.lastService.technician}
                          </span>
                        </div>
                        <div className="text-xs italic text-muted-foreground mt-2">
                          "{activeSystem.lastService.notes}"
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
