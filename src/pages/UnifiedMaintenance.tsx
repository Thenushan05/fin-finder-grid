import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  fetchVessels,
  createVessel,
  deleteVessel,
} from "@/store/maintenanceSlice";
import {
  fetchRules,
  createRule,
  updateRule,
  deleteRule,
  fetchMaintenanceSummary,
  fetchVesselState,
  completeTrip,
  logMaintenance,
  fetchMaintenanceLogs,
  type MaintenanceRule,
  type VesselMaintenanceSummary,
  type MaintenanceLog,
} from "@/store/maintenanceRulesSlice";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Ship,
  Plus,
  Trash2,
  Edit,
  Wrench,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  User,
  FileText,
  DollarSign,
  AlertTriangle,
  Gauge,
  Anchor,
  CalendarDays,
  ClipboardCheck,
  Zap,
  LifeBuoy,
  Compass,
  Cpu,
  Droplet,
  Cog,
  Fish,
  Activity,
  CalendarClock,
} from "lucide-react";
import AuthDebug from "@/components/AuthDebug";
import { CountUp } from "@/components/ui/count-up";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

export default function UnifiedMaintenance() {
  const [activeSystemId, setActiveSystemId] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const { vessels, loading: vesselsLoading } = useSelector(
    (state: RootState) => state.maintenance
  );
  const {
    rules,
    vesselStates,
    summaries,
    logs,
    loading: rulesLoading,
  } = useSelector((state: RootState) => state.maintenanceRules);
  const { user } = useSelector((state: RootState) => state.auth);
  const auth = useAuth();
  const navigate = useNavigate();

  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [vesselDialogOpen, setVesselDialogOpen] = useState(false);
  const [vesselForm, setVesselForm] = useState({
    name: "",
    type: "Multi-Day Vessel",
  });

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MaintenanceRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    system_id: "engine",
    part_name: "",
    trigger_type: "hours" as "hours" | "days" | "trips" | "sensor",
    interval_value: 100,
    warning_before: 20,
    description: "",
  });

  const [tripDialogOpen, setTripDialogOpen] = useState(false);
  const [tripForm, setTripForm] = useState({
    duration_hours: 0,
    trip_date: new Date().toISOString().split("T")[0],
  });

  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    system_id: "engine",
    part_name: "",
    done_at: new Date().toISOString().split("T")[0],
    technician: "",
    notes: "",
    cost: "",
    engine_hours_at_service: undefined as number | undefined,
    trips_at_service: undefined as number | undefined,
  });

  // Mock Data for Guest Users
  const mockGuestVessels = useMemo(() => ([
    {
      id: "guest-vessel-1",
      name: "Sea Explorer (Demo)",
      type: "Multi-Day Vessel",
      stats: {
        lastTrip: "2025-01-15",
        engineHours: 1250,
        fuelOnBoard: "5,000 L",
        iceCapacity: "90%",
        nextServiceDue: "2025-02-01",
      },
      systems: [
        {
          id: "engine",
          name: "Engine",
          status: "operational",
          description: "Main Diesel Engine",
          blueprintImage: "/imul_blueprint_v2.png",
          specs: { "Oil Pressure": "Good" },
          upcomingTasks: [],
          lastService: { date: "2025-01-10", technician: "John", notes: "Routine Check" }
        }
      ]
    },
    {
      id: "guest-vessel-2",
      name: "Ocean Warrior",
      type: "Day Boat",
      stats: {
        lastTrip: "2025-01-18",
        engineHours: 450,
        fuelOnBoard: "1,200 L",
        iceCapacity: "100%",
        nextServiceDue: "2025-03-10",
      },
      systems: [
        {
            id: "engine",
            name: "Outboard Motor",
            status: "operational",
            description: "Yamaha 200HP",
            blueprintImage: "/iday_blueprint_v2.png",
            specs: { "Propeller": "Clean" },
            upcomingTasks: [],
            lastService: { date: "2024-12-05", technician: "Service Center", notes: "100hr Service" }
        }
      ]
    },
    {
      id: "guest-vessel-3",
      name: "Blue Horizon",
      type: "Multi-Day Vessel",
      stats: {
        lastTrip: "2024-12-28",
        engineHours: 3400,
        fuelOnBoard: "2,000 L",
        iceCapacity: "45%",
        nextServiceDue: "2025-01-20",
      },
      systems: [
         {
          id: "engine",
          name: "Main Engine",
          status: "due-soon",
          description: "Older Perkins Diesel",
          blueprintImage: "/imul_blueprint_v2.png",
          specs: { "Coolant": "Low" },
          upcomingTasks: [],
          lastService: { date: "2024-11-15", technician: "Self", notes: "Oil Top-up" }
        }
      ]
    }
  ]), []);

  // Determine if we are in guest mode
  const isGuest = !user;
  const effectiveVessels = isGuest ? mockGuestVessels : vessels;
  
  // Set initial selected vessel for guest if needed
  useEffect(() => {
     if (isGuest && !selectedVesselId && mockGuestVessels.length > 0) {
        setSelectedVesselId(mockGuestVessels[0].id);
     }
  }, [isGuest, selectedVesselId, mockGuestVessels]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<MaintenanceRule | null>(
    null
  );

  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>(
    {}
  );



  const toggleExpand = (
    partKey: string,
    systemId: string,
    partName: string
  ) => {
    const isExpanded = !!expandedParts[partKey];
    if (!isExpanded && selectedVesselId) {
      dispatch(
        fetchMaintenanceLogs({ vesselId: selectedVesselId, systemId, partName })
      );
    }
    setExpandedParts((prev) => ({ ...prev, [partKey]: !isExpanded }));
  };

  const vesselLogs: MaintenanceLog[] = selectedVesselId
    ? logs[selectedVesselId] || []
    : [];

  useEffect(() => {
    if (!isGuest) {
      dispatch(fetchVessels());
      dispatch(fetchRules(undefined));
    }
  }, [dispatch, isGuest]);

  useEffect(() => {
    if (selectedVesselId && !isGuest) {
      dispatch(fetchMaintenanceSummary(selectedVesselId));
      dispatch(fetchVesselState(selectedVesselId));
    }
  }, [selectedVesselId, dispatch, isGuest]);

  useEffect(() => {
    if (!selectedVesselId || isGuest) return;
    if (activeTab === "tracking") {
      dispatch(fetchRules(undefined));
      dispatch(fetchVesselState(selectedVesselId));
      dispatch(fetchMaintenanceSummary(selectedVesselId));
      dispatch(fetchMaintenanceLogs({ vesselId: selectedVesselId }));
    }
    if (activeTab === "rules") {
      dispatch(fetchRules(undefined));
    }
    if (activeTab === "overview") {
      dispatch(fetchVesselState(selectedVesselId));
    }
  }, [activeTab, selectedVesselId, dispatch, isGuest]);

  const currentSummary = selectedVesselId ? (isGuest ? { 
    maintenance_score: selectedVesselId === "guest-vessel-2" ? 98 : selectedVesselId === "guest-vessel-3" ? 75 : 92,
    overall_status: selectedVesselId === "guest-vessel-2" ? 'operational' : selectedVesselId === "guest-vessel-3" ? 'needs_attention' : 'operational',
    status: selectedVesselId === "guest-vessel-3" ? 'warning' : 'good',
    upcoming_maintenance: [], 
    overdue_maintenance: [], 
    systems: [
         {
          system_id: "engine",
          system_name: "Engine & Propulsion",
          status: selectedVesselId === "guest-vessel-3" ? "due_soon" : "ok",
          parts: [
            { 
              name: "Oil Filter", 
              status: selectedVesselId === "guest-vessel-3" ? "due_soon" : "ok", 
              message: selectedVesselId === "guest-vessel-3" ? "Oil change due soon" : "Functioning optimally",
              current_value: 1250,
              due_at_value: 1300
            },
            {
               name: "Fuel Injectors",
               status: "ok",
               message: "No issues reported",
               current_value: 1250,
               due_at_value: 2000
            }
          ]
         }
    ]
  } as any : summaries[selectedVesselId]) : null;

  const currentState = selectedVesselId ? (isGuest ? { 
    maintenance_status: 'good', 
    engine_hours: selectedVesselId === "guest-vessel-2" ? 450 : selectedVesselId === "guest-vessel-3" ? 3400 : 1250,
    total_trips: selectedVesselId === "guest-vessel-2" ? 12 : selectedVesselId === "guest-vessel-3" ? 156 : 45,
    last_trip_date: selectedVesselId === "guest-vessel-2" ? "2025-01-18" : selectedVesselId === "guest-vessel-3" ? '2024-12-28' : '2025-01-15' 
  } : vesselStates[selectedVesselId]) : null;
  const selectedVessel = effectiveVessels.find((v) => v.id === selectedVesselId) as any;



  const handleCreateVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(
        createVessel({
          name: vesselForm.name,
          type: vesselForm.type,
          stats: {
            lastTrip: new Date().toISOString().split("T")[0],
            engineHours: 0,
            fuelOnBoard: "8,000 L",
            iceCapacity: "80%",
            nextServiceDue: "Not scheduled",
          },
          systems: [
            {
              id: "engine",
              name: "Engine & Propulsion",
              status: "operational",
              description: "Main engine",
              blueprintImage: "/engine_blueprint.png",
              specs: { "Oil Level": "Good" },
              upcomingTasks: [],
              lastService: {
                date: new Date().toISOString().split("T")[0],
                technician: "Setup",
                notes: "Created",
              },
            },
            {
              id: "nets",
              name: "Nets & Gear",
              status: "operational",
              description: "Fishing gear",
              blueprintImage: "/nets_blueprint.png",
              specs: { "Net Condition": "Good" },
              upcomingTasks: [],
              lastService: {
                date: new Date().toISOString().split("T")[0],
                technician: "Setup",
                notes: "Created",
              },
            },
          ],
        } as any)
      ).unwrap();

      toast({
        title: "Vessel Created",
        description: `${vesselForm.name} added successfully`,
      });
      setVesselDialogOpen(false);
      setVesselForm({ name: "", type: "Multi-Day Vessel" });
      dispatch(fetchVessels());
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to create vessel",
        variant: "destructive",
      });
    }
  };

  const handleCreateOrUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await dispatch(
          updateRule({ ruleId: editingRule.id!, updates: ruleForm })
        ).unwrap();
        toast({
          title: "Rule Updated",
          description: `${ruleForm.part_name} rule updated successfully`,
        });
      } else {
        await dispatch(createRule(ruleForm)).unwrap();
        toast({
          title: "Rule Created",
          description: `${ruleForm.part_name} rule added`,
        });
      }
      setRuleDialogOpen(false);
      setEditingRule(null);
      setRuleForm({
        system_id: "engine",
        part_name: "",
        trigger_type: "hours",
        interval_value: 100,
        warning_before: 20,
        description: "",
      });
      dispatch(fetchRules(undefined));
      if (selectedVesselId) {
        dispatch(fetchMaintenanceSummary(selectedVesselId));
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.message || `Failed to ${editingRule ? "update" : "create"} rule`,
        variant: "destructive",
      });
    }
  };

  const handleEditRule = (rule: MaintenanceRule) => {
    setEditingRule(rule);
    setRuleForm({
      system_id: rule.system_id,
      part_name: rule.part_name,
      trigger_type: rule.trigger_type as any,
      interval_value: rule.interval_value,
      warning_before: rule.warning_before,
      description: rule.description || "",
    });
    setRuleDialogOpen(true);
  };

  const handleCompleteTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVesselId) return;

    if (
      !tripForm.duration_hours ||
      isNaN(tripForm.duration_hours) ||
      tripForm.duration_hours <= 0
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter valid engine hours (greater than 0)",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(
        completeTrip({
          vesselId: selectedVesselId,
          tripDurationHours: tripForm.duration_hours,
          tripDate: tripForm.trip_date,
        })
      ).unwrap();
      toast({
        title: "Trip Logged",
        description: `${tripForm.duration_hours}h trip completed`,
      });
      setTripDialogOpen(false);
      setTripForm({
        duration_hours: 0,
        trip_date: new Date().toISOString().split("T")[0],
      });
      dispatch(fetchVesselState(selectedVesselId));
      dispatch(fetchMaintenanceSummary(selectedVesselId));
    } catch (err: any) {
      const msg = err || err?.message || JSON.stringify(err);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVesselId) return;
    try {
      const postedSystem = maintenanceForm.system_id;
      const postedPart = maintenanceForm.part_name;
      await dispatch(
        logMaintenance({
          vesselId: selectedVesselId,
          log: {
            system_id: maintenanceForm.system_id,
            part_name: maintenanceForm.part_name,
            done_at: maintenanceForm.done_at,
            technician: maintenanceForm.technician,
            notes: maintenanceForm.notes,
            cost: maintenanceForm.cost,
            engine_hours_at_service:
              maintenanceForm.engine_hours_at_service ??
              currentState?.engine_hours,
            trips_at_service:
              maintenanceForm.trips_at_service ?? currentState?.total_trips,
          },
        })
      ).unwrap();
      toast({
        title: "Maintenance Logged",
        description: `${maintenanceForm.part_name} serviced`,
      });
      setMaintenanceDialogOpen(false);
      setMaintenanceForm({
        system_id: "engine",
        part_name: "",
        done_at: new Date().toISOString().split("T")[0],
        technician: "",
        notes: "",
        cost: "",
        engine_hours_at_service: undefined,
        trips_at_service: undefined,
      });
      dispatch(fetchVesselState(selectedVesselId));
      dispatch(fetchMaintenanceSummary(selectedVesselId));
      dispatch(
        fetchMaintenanceLogs({
          vesselId: selectedVesselId,
          systemId: postedSystem,
          partName: postedPart,
        })
      );
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to log maintenance",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
      case "operational":
        return "bg-green-500";
      case "due_soon":
        return "bg-yellow-500";
      case "overdue":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  // Generate chaotic plexus pattern
  const plexusPattern = useMemo(() => {
    const nodes: { x: number; y: number; r: number }[] = [];
    const width = 1000;
    const height = 1000;
    const nodeCount = 80; // Reduced density

    // Generate random nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 4 + 2, // Larger varying sizes
      });
    }

    // Generate connections based on distance
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opacity: number;
    }[] = [];
    nodes.forEach((node, i) => {
      // Connect to nearest neighbors
      nodes.slice(i + 1).forEach((otherNode) => {
        const dist = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
        if (dist < 200) {
          // Increased connection threshold
          lines.push({
            x1: node.x,
            y1: node.y,
            x2: otherNode.x,
            y2: otherNode.y,
            opacity: (1 - dist / 200) * 0.5, // Lower opacity
          });
        }
      });
    });

    return { nodes, lines };
  }, []);

  // Only show full page loader on initial vessel load
  if (vesselsLoading && vessels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-6">
        <div className="text-center">
          {/* Vessel Riding Animation */}
          <div className="relative w-64 h-64 mx-auto mb-8">
            {/* Waves */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 200 200"
            >
              {/* Wave 1 */}
              <path
                d="M0,100 Q25,80 50,100 T100,100 T150,100 T200,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-[#0284C5] dark:text-[#0284C5]"
                opacity="0.6"
              >
                <animate
                  attributeName="d"
                  dur="2s"
                  repeatCount="indefinite"
                  values="M0,100 Q25,80 50,100 T100,100 T150,100 T200,100;
                          M0,100 Q25,120 50,100 T100,100 T150,100 T200,100;
                          M0,100 Q25,80 50,100 T100,100 T150,100 T200,100"
                />
              </path>
              {/* Wave 2 */}
              <path
                d="M0,110 Q25,90 50,110 T100,110 T150,110 T200,110"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-300 dark:text-[#0284C5]"
                opacity="0.4"
              >
                <animate
                  attributeName="d"
                  dur="2.5s"
                  repeatCount="indefinite"
                  values="M0,110 Q25,90 50,110 T100,110 T150,110 T200,110;
                          M0,110 Q25,130 50,110 T100,110 T150,110 T200,110;
                          M0,110 Q25,90 50,110 T100,110 T150,110 T200,110"
                />
              </path>
              {/* Wave 3 */}
              <path
                d="M0,120 Q25,100 50,120 T100,120 T150,120 T200,120"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-200 dark:text-blue-300"
                opacity="0.3"
              >
                <animate
                  attributeName="d"
                  dur="3s"
                  repeatCount="indefinite"
                  values="M0,120 Q25,100 50,120 T100,120 T150,120 T200,120;
                          M0,120 Q25,140 50,120 T100,120 T150,120 T200,120;
                          M0,120 Q25,100 50,120 T100,120 T150,120 T200,120"
                />
              </path>
            </svg>

            {/* Vessel/Ship */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Ship
                className="w-16 h-16 text-[#0284C5] dark:text-violet-400"
                style={{
                  animation: "float 3s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          {/* Loading Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Loading Vessel Data...
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Preparing your maintenance dashboard
            </p>
          </div>

          {/* Animated Dots */}
          <div className="flex justify-center gap-2 mt-4">
            <div
              className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>

        {/* Add float animation to global styles */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(-2deg); }
            50% { transform: translateY(-15px) rotate(2deg); }
          }
        `}</style>
      </div>
    );
  }

  // Removed blocking login prompt for guests


  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 p-6">
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
              {/* Generated Lines */}
              {plexusPattern.lines.map((line, i) => (
                <line
                  key={`line-${i}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-300 dark:text-violet-500"
                  style={{ opacity: line.opacity }}
                />
              ))}

              {/* Generated Nodes */}
              {plexusPattern.nodes.map((node, i) => (
                <circle
                  key={`node-${i}`}
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  className="fill-slate-300 dark:fill-violet-500"
                />
              ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neuron-net-body)" />
        </svg>
      </div>





      {/* Main Content Area */}
      <div className="relative z-10 p-6 min-h-screen flex flex-col">
        {/* Top Bar with Vessel Selector (Always Visible) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Maintenance Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage your fleet's maintenance schedules and logs
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={vesselDialogOpen} onOpenChange={setVesselDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0284C5] hover:bg-[#026aa0] dark:bg-violet-600 dark:hover:bg-violet-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vessel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateVessel}>
                  <DialogHeader>
                    <DialogTitle>Create New Vessel</DialogTitle>
                    <DialogDescription>
                      Add a new fishing vessel to your fleet
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="vessel-name">Vessel Name *</Label>
                      <Input
                        id="vessel-name"
                        placeholder="e.g., IMUL-001"
                        value={vesselForm.name}
                        onChange={(e) =>
                          setVesselForm({ ...vesselForm, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vessel-type">Type</Label>
                      <Select
                        value={vesselForm.type}
                        onValueChange={(v) =>
                          setVesselForm({ ...vesselForm, type: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Multi-Day Vessel">
                            Multi-Day Vessel
                          </SelectItem>
                          <SelectItem value="Single-Day Vessel">
                            Single-Day Vessel
                          </SelectItem>
                          <SelectItem value="Offshore Vessel">
                            Offshore Vessel
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setVesselDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!vesselForm.name}>
                      Create Vessel
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-violet-500/30 hover:bg-violet-500/10 text-[#0284C5] dark:text-violet-400"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateOrUpdateRule}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingRule ? "Edit" : "Create"} Maintenance Rule
                    </DialogTitle>
                    <DialogDescription>
                      Define when maintenance should be performed
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>System</Label>
                      <Select
                        value={ruleForm.system_id}
                        onValueChange={(v) =>
                          setRuleForm({ ...ruleForm, system_id: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engine">Engine</SelectItem>
                          <SelectItem value="nets">Nets & Gear</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Part Name *</Label>
                      <Input
                        placeholder="e.g., Engine oil"
                        value={ruleForm.part_name}
                        onChange={(e) =>
                          setRuleForm({ ...ruleForm, part_name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={ruleForm.trigger_type}
                        onValueChange={(v: any) =>
                          setRuleForm({ ...ruleForm, trigger_type: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Engine Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="trips">Trips</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Interval</Label>
                        <Input
                          type="number"
                          value={ruleForm.interval_value}
                          onChange={(e) =>
                            setRuleForm({
                              ...ruleForm,
                              interval_value: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Warning Before</Label>
                        <Input
                          type="number"
                          value={ruleForm.warning_before}
                          onChange={(e) =>
                            setRuleForm({
                              ...ruleForm,
                              warning_before: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="Optional notes"
                        value={ruleForm.description}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setRuleDialogOpen(false);
                        setEditingRule(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!ruleForm.part_name}>
                      {editingRule ? "Update Rule" : "Create Rule"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {effectiveVessels.length > 0 && (
              <div className="w-72">
                <Select
                  value={selectedVesselId || ""}
                  onValueChange={setSelectedVesselId}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-violet-800 focus:ring-violet-500">
                    <SelectValue placeholder="Select a vessel to manage" />
                  </SelectTrigger>
                  <SelectContent>
                    {effectiveVessels.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <Ship className="inline mr-2 h-4 w-4 text-[#0284C5] dark:text-violet-500" />
                        {v.name} - {v.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Empty State / Hero Section */}
        {!selectedVesselId && effectiveVessels.length > 0 && (
          <div className="flex-1 flex flex-col items-center justify-center -mt-20">
            <div className="text-center space-y-6 max-w-2xl mx-auto p-12 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 shadow-xl">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#0284C5]/20 to-cyan-500/20 dark:from-violet-500/20 dark:to-indigo-500/20 flex items-center justify-center mx-auto mb-6 ring-1 ring-white/50 dark:ring-white/10">
                <Ship className="h-12 w-12 text-[#0284C5] dark:text-violet-400" />
              </div>
              
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Welcome to Vessel Maintenance
              </h2>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Select a vessel from the dropdown above to view its maintenance status, upcoming tasks, and service history.
              </p>

              <div className="pt-4 flex justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-white/20 dark:border-white/5">
                  <Wrench className="h-4 w-4" />
                  <span>Track Repairs</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-white/20 dark:border-white/5">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Service</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-white/20 dark:border-white/5">
                  <FileText className="h-4 w-4" />
                  <span>Log History</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Vessels State */}
        {effectiveVessels.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-violet-900/50 bg-white/40 dark:bg-violet-950/10 backdrop-blur-sm max-w-lg w-full">
              <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                <Ship className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                No Vessels Yet
              </h3>
              <p className="text-muted-foreground mb-8">
                Create your first vessel to start tracking maintenance
              </p>
              <Button
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Login required",
                      description: "Please login to create a vessel",
                      variant: "destructive",
                    });
                    return;
                  }
                  setVesselDialogOpen(true);
                }}
                size="lg"
                className="bg-[#0284C5] hover:bg-[#026aa0] dark:bg-violet-600 dark:hover:bg-violet-700 text-white w-full"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create First Vessel
              </Button>
            </Card>
          </div>
        )}

      {selectedVesselId && (
        <div className="mb-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
             <Ship className="h-64 w-64 text-slate-900 dark:text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800">
                    {selectedVessel?.type}
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">ID: {selectedVessel?.id.split('-').pop()?.toUpperCase()}</span>
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {selectedVessel?.name}
                </h2>
              </div>
              
              <div className="flex gap-6">
                 <div className="flex items-center gap-2">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                      <CalendarClock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Next Service</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedVessel?.stats?.nextServiceDue || "N/A"}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                      <Cpu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Systems</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedVessel?.systems?.length || 0} Active</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-8 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="text-right">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Fleet Rradiness</p>
                  <div className="flex items-baseline justify-end gap-2">
                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {currentSummary?.maintenance_score || 0}%
                    </span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                      currentSummary?.maintenance_score >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      currentSummary?.maintenance_score >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {currentSummary?.maintenance_score >= 90 ? 'EXCELLENT' : 
                       currentSummary?.maintenance_score >= 70 ? 'GOOD' : 'CRITICAL'}
                    </span>
                  </div>
               </div>
               
               <div className="h-24 w-24 relative flex items-center justify-center">
                  <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" 
                      className={`${
                        currentSummary?.maintenance_score >= 90 ? 'text-emerald-500' :
                        currentSummary?.maintenance_score >= 70 ? 'text-amber-500' : 'text-red-500'
                      }`}
                      strokeDasharray={`${(currentSummary?.maintenance_score || 0) * 2.51} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <Activity className={`absolute h-8 w-8 ${
                        currentSummary?.maintenance_score >= 90 ? 'text-emerald-500' :
                        currentSummary?.maintenance_score >= 70 ? 'text-amber-500' : 'text-red-500'
                  }`} />
               </div>
            </div>
          </div>
        </div>
      )}

      {selectedVesselId && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-400 data-[state=active]:shadow-md transition-all duration-200 rounded-lg font-medium"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="tracking"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-400 data-[state=active]:shadow-md transition-all duration-200 rounded-lg font-medium"
            >
              Status Tracking
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-400 data-[state=active]:shadow-md transition-all duration-200 rounded-lg font-medium"
            >
              Maintenance Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 group hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Engine Hours
                    </p>
                    <div className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
                      <CountUp end={currentState?.engine_hours || 0} suffix=" h" />
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <Gauge className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 group hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Trips
                    </p>
                    <div className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
                      <CountUp end={currentState?.total_trips || 0} />
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Anchor className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 group hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Last Trip
                    </p>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 tracking-tight">
                      {currentState?.last_trip_date
                        ? new Date(currentState.last_trip_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                      {currentState?.last_trip_date && (
                        <span className="text-lg font-medium text-slate-400 ml-2">
                          {new Date(currentState.last_trip_date).getFullYear()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-4">
              <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#0284C5] hover:bg-[#026aa0] dark:bg-violet-600 dark:hover:bg-violet-700 text-white">
                    <Ship className="mr-2 h-4 w-4" />
                    Complete Trip
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCompleteTrip}>
                    <DialogHeader>
                      <DialogTitle>Log Completed Trip</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Engine Hours Used</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={tripForm.duration_hours || ""}
                          onChange={(e) =>
                            setTripForm({
                              ...tripForm,
                              duration_hours: e.target.value
                                ? parseFloat(e.target.value)
                                : 0,
                            })
                          }
                          required
                          className="focus-visible:ring-[#0284C5] dark:focus-visible:ring-violet-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Trip Date</Label>
                        <Input
                          type="date"
                          value={tripForm.trip_date}
                          onChange={(e) =>
                            setTripForm({
                              ...tripForm,
                              trip_date: e.target.value,
                            })
                          }
                          required
                          className="focus-visible:ring-[#0284C5] dark:focus-visible:ring-violet-500"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTripDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#0284C5] hover:bg-[#026aa0] dark:bg-violet-600 dark:hover:bg-violet-700 text-white"
                      >
                        Log Trip
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="border-violet-500/30 hover:bg-violet-500/10 text-[#0284C5] dark:text-violet-400"
                onClick={() => {
                  setActiveTab("tracking");
                  setMaintenanceDialogOpen(true);
                }}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Log Maintenance
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            {currentSummary && (
              <div className="space-y-4">
                <Card className="border-slate-200 dark:border-violet-900/50 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-900 dark:text-violet-100">
                        Overall Status
                      </CardTitle>
                      <Badge
                        variant={
                          currentSummary.overall_status === "operational"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          currentSummary.overall_status === "operational"
                            ? "bg-green-500 hover:bg-green-600"
                            : ""
                        }
                      >
                        {currentSummary.overall_status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {currentSummary.systems.map((system) => (
                  <Card
                    key={system.system_id}
                    className="border-slate-200 dark:border-violet-900/50 shadow-sm"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-violet-900/30 flex items-center justify-center border border-slate-200 dark:border-violet-800/50">
                            {(() => {
                              const iconMap: Record<string, any> = {
                                "Main Engine": Cog,
                                "Electrical System": Zap,
                                "Safety Equipment": LifeBuoy,
                                "Navigation Systems": Compass,
                                "Fishing Gear": Fish,
                                "Electronics": Cpu,
                                "Hydraulic System": Droplet,
                              };
                              const IconComponent = iconMap[system.system_name] || Wrench;
                              return <IconComponent className="h-5 w-5 text-slate-600 dark:text-violet-300" />;
                            })()}
                          </div>
                          <CardTitle className="text-lg text-slate-900 dark:text-violet-100">
                            {system.system_name}
                          </CardTitle>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(
                            system.status
                          )}`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea
                        className={`transition-all duration-500 ease-in-out ${
                          system.parts.some(
                            (p) =>
                              expandedParts[`${system.system_id}::${p.name}`]
                          )
                            ? "h-[500px]"
                            : "h-64"
                        }`}
                      >
                        <div className="space-y-3">
                          {system.parts.map((part) => {
                            const partKey = `${system.system_id}::${part.name}`;
                            const expanded = !!expandedParts[partKey];
                            const filteredLogs = vesselLogs.filter(
                              (l) =>
                                l.system_id === system.system_id &&
                                l.part_name === part.name
                            );
                            return (
                              <div
                                key={part.name}
                                className={`group border rounded-xl p-4 backdrop-blur-sm transition-all duration-200 shadow-sm ${
                                  expanded
                                    ? "bg-white/80 dark:bg-slate-900/80 border-[#0284C5] dark:border-violet-500 ring-1 ring-[#0284C5] dark:ring-violet-500"
                                    : "border-slate-200/60 dark:border-violet-800/20 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm ${
                                      part.status === "ok" ? "bg-emerald-500" :
                                      part.status === "due_soon" ? "bg-amber-500" : "bg-red-500"
                                    }`} />
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-base tracking-tight">
                                      {part.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`font-medium border ${
                                        part.status === "ok"
                                          ? "text-emerald-700 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400"
                                          : part.status === "due_soon"
                                          ? "text-amber-700 border-amber-200 bg-amber-50/50 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400"
                                          : "text-red-700 border-red-200 bg-red-50/50 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400"
                                      }`}
                                    >
                                      {part.status.toUpperCase()}
                                    </Badge>
                                    <Button
                                      variant={expanded ? "secondary" : "ghost"}
                                      size="sm"
                                      onClick={() =>
                                        toggleExpand(
                                          partKey,
                                          system.system_id,
                                          part.name
                                        )
                                      }
                                      className={`h-7 px-3 transition-colors ${
                                        expanded 
                                          ? "bg-[#0284C5]/10 text-[#0284C5] hover:bg-[#0284C5]/20 dark:bg-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/30" 
                                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      }`}
                                    >
                                      {expanded ? "Hide Details" : "View Details"}
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
                                  {part.message}
                                </p>

                                {part.status === "overdue" &&
                                  (() => {
                                    const matchingRule = rules.find(
                                      (r) =>
                                        r.part_name === part.name &&
                                        r.system_id === system.system_id
                                    );
                                    const why =
                                      matchingRule?.description ||
                                      "No description available.";
                                    const trigger =
                                      matchingRule?.trigger_type ||
                                      part.trigger_type ||
                                      "hours";
                                    const interval =
                                      matchingRule?.interval_value;
                                    const actionSuggestion =
                                      trigger === "hours"
                                        ? `Perform the scheduled service now (every ${interval} hours). Change/replace the part and record engine hours at service.`
                                        : trigger === "trips"
                                        ? `Perform the scheduled service now (every ${interval} trips). Inspect and repair/replace as needed.`
                                        : trigger === "days"
                                        ? `Perform the scheduled service now (every ${interval} days). Inspect and service per checklist.`
                                        : `Perform the required maintenance.`;

                                    return (
                                      <Card className="mt-4 border-0 bg-red-500/5 dark:bg-red-900/10 backdrop-blur-sm ring-1 ring-red-500/20 overflow-hidden relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50" />
                                        <CardContent className="p-4 pl-5">
                                          <div className="grid gap-4">
                                            <div className="flex gap-3">
                                              <div className="mt-0.5">
                                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                              </div>
                                              <div className="space-y-1">
                                                <h4 className="text-sm font-semibold text-red-900 dark:text-red-200 leading-none">
                                                  Why this is overdue
                                                </h4>
                                                <p className="text-sm text-red-700/80 dark:text-red-300/70">
                                                  {why}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex gap-3">
                                              <div className="mt-0.5">
                                                <ClipboardCheck className="h-5 w-5 text-red-600 dark:text-red-400" />
                                              </div>
                                              <div className="space-y-1">
                                                <h4 className="text-sm font-semibold text-red-900 dark:text-red-200 leading-none">
                                                  Action Required
                                                </h4>
                                                <p className="text-sm text-red-700/80 dark:text-red-300/70">
                                                  {actionSuggestion}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="pl-8 mt-1">
                                              <Button
                                                size="sm"
                                                className="bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow transition-all"
                                                onClick={() => {
                                                  setMaintenanceForm({
                                                    ...maintenanceForm,
                                                    system_id: system.system_id,
                                                    part_name: part.name,
                                                    done_at: new Date()
                                                      .toISOString()
                                                      .split("T")[0],
                                                    engine_hours_at_service:
                                                      currentState?.engine_hours,
                                                    trips_at_service:
                                                      currentState?.total_trips,
                                                  });
                                                  setActiveTab("tracking");
                                                  setMaintenanceDialogOpen(true);
                                                }}
                                              >
                                                Log Maintenance
                                              </Button>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })()}

                                <div
                                  className={`grid transition-all duration-300 ease-in-out ${
                                    expanded
                                      ? "grid-rows-[1fr] opacity-100 mt-4"
                                      : "grid-rows-[0fr] opacity-0 mt-0"
                                  }`}
                                >
                                  <div className="overflow-hidden">
                                    {part.remaining !== undefined && (
                                      <p className="text-xs text-muted-foreground mb-3 pl-1">
                                        Current: {part.current_value} | Due at:{" "}
                                        {part.due_at_value}
                                      </p>
                                    )}

                                    <div className="space-y-2">
                                      {filteredLogs.length === 0 ? (
                                        <div className="text-sm text-muted-foreground pl-1">
                                          No logs for this part.
                                        </div>
                                      ) : (
                                        filteredLogs.map((l) => (
                                          <Card
                                            key={l.id}
                                            className="bg-white dark:bg-slate-950 border-violet-100 dark:border-violet-900/30 shadow-sm hover:shadow-md transition-all duration-200"
                                          >
                                            <CardContent className="p-4">
                                              <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                  <div className="h-8 w-8 rounded-full bg-[#0284C5]/20 dark:bg-violet-900/30 flex items-center justify-center text-[#0284C5] dark:text-violet-400">
                                                    <Wrench className="h-4 w-4" />
                                                  </div>
                                                  <div>
                                                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                      {l.part_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                      {l.system_id}
                                                    </div>
                                                  </div>
                                                </div>
                                                <Badge
                                                  variant="outline"
                                                  className="bg-[#0284C5]/10 dark:bg-violet-900/10 text-[#0284C5] dark:text-violet-300 border-[#0284C5]/30 dark:border-violet-800"
                                                >
                                                  {l.done_at
                                                    ? new Date(
                                                        l.done_at
                                                      ).toLocaleDateString()
                                                    : "No Date"}
                                                </Badge>
                                              </div>

                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                  <User className="h-4 w-4 text-[#0284C5] dark:text-violet-500 shrink-0" />
                                                  <span
                                                    className="truncate"
                                                    title={
                                                      l.technician || "Unknown"
                                                    }
                                                  >
                                                    {l.technician ||
                                                      "Unknown Technician"}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                  <DollarSign className="h-4 w-4 text-[#0284C5] dark:text-violet-500 shrink-0" />
                                                  <span>
                                                    {l.cost
                                                      ? `${l.cost} LKR`
                                                      : "No Cost Recorded"}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 md:col-span-3">
                                                  <FileText className="h-4 w-4 text-[#0284C5] dark:text-violet-500 shrink-0" />
                                                  <span
                                                    className="truncate"
                                                    title={l.notes || "No notes"}
                                                  >
                                                    {l.notes ||
                                                      "No notes provided"}
                                                  </span>
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!currentSummary && (
              <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-violet-900/50 bg-[#0284C5]/10/50 dark:bg-violet-950/10">
                <AlertCircle className="mx-auto h-12 w-12 text-violet-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-violet-100">
                  No Maintenance Data
                </h3>
                <p className="text-muted-foreground">
                  Create some maintenance rules to start tracking
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            {rules.length === 0 && (
              <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-violet-900/50 bg-[#0284C5]/10/50 dark:bg-violet-950/10">
                <Wrench className="mx-auto h-12 w-12 text-violet-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-violet-100">
                  No Rules Defined
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create maintenance rules to track when service is due
                </p>
                <Button
                  onClick={() => setRuleDialogOpen(true)}
                  className="bg-[#0284C5] hover:bg-[#026aa0] dark:bg-violet-600 dark:hover:bg-violet-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Rule
                </Button>
              </Card>
            )}

            {rules.length > 0 && (
              <div className="grid gap-4">
                {rules.map((rule) => (
                  <Card
                    key={rule.id}
                    className="border-slate-200 dark:border-violet-900/50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-slate-900 dark:text-violet-100">
                            {rule.part_name}
                          </CardTitle>
                          <CardDescription className="text-[#0284C5]/80 dark:text-violet-400/80">
                            {rule.system_id} - Every {rule.interval_value}{" "}
                            {rule.trigger_type}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRule(rule)}
                            title="Edit rule"
                            className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setRuleToDelete(rule);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete rule"
                            className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">
                            Interval:
                          </span>{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {rule.interval_value} {rule.trigger_type}
                          </span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Warning:
                          </span>{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {rule.warning_before} {rule.trigger_type} before due
                          </span>
                        </p>
                        {rule.description && (
                          <p>
                            <span className="text-muted-foreground">
                              Notes:
                            </span>{" "}
                            <span className="italic text-slate-600 dark:text-slate-400">
                              {rule.description}
                            </span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>


        </Tabs>
      )}

      <Dialog
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
      >
        <DialogContent>
          <form onSubmit={handleLogMaintenance}>
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-violet-100">
                Log Maintenance Work
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-slate-900 dark:text-violet-100">
                  System{" "}
                  {maintenanceForm.part_name && (
                    <span className="text-xs text-green-600">
                      (Auto-filled)
                    </span>
                  )}
                </Label>
                <Select
                  value={maintenanceForm.system_id}
                  onValueChange={(v) =>
                    setMaintenanceForm({ ...maintenanceForm, system_id: v })
                  }
                >
                  <SelectTrigger className="border-[#0284C5]/30 dark:border-violet-800 focus:ring-violet-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engine">Engine</SelectItem>
                    <SelectItem value="nets">Nets & Gear</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-900 dark:text-violet-100">
                  Part Name *
                </Label>
                <Input
                  placeholder="e.g., Oil Filter"
                  value={maintenanceForm.part_name}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      part_name: e.target.value,
                    })
                  }
                  required
                  className="focus-visible:ring-[#0284C5] dark:focus-visible:ring-violet-500 border-[#0284C5]/30 dark:border-violet-800"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-900 dark:text-violet-100">
                  Date Completed
                </Label>
                <Input
                  type="date"
                  value={maintenanceForm.done_at}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      done_at: e.target.value,
                    })
                  }
                  required
                  className="focus-visible:ring-[#0284C5] dark:focus-visible:ring-violet-500 border-[#0284C5]/30 dark:border-violet-800"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-900 dark:text-violet-100">
                  Technician
                </Label>
                <Input
                  placeholder="Name or Company"
                  value={maintenanceForm.technician}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      technician: e.target.value,
                    })
                  }
                  className="focus-visible:ring-[#0284C5] dark:focus-visible:ring-violet-500 border-[#0284C5]/30 dark:border-violet-800"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-900 dark:text-violet-100">
                  Cost (LKR)
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={maintenanceForm.cost}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      cost: e.target.value,
                    })
                  }
                  className="focus-visible:ring-[#0284C5] dark:focus-visible:ring-violet-500 border-[#0284C5]/30 dark:border-violet-800"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-900 dark:text-violet-100">
                  Notes
                </Label>
                <Input
                  placeholder="Details about the work..."
                  value={maintenanceForm.notes}
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      notes: e.target.value,
                    })
                  }
                  className="focus-visible:ring-[#0284C5] dark:focus-visible:ring-violet-500 border-[#0284C5]/30 dark:border-violet-800"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMaintenanceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0284C5] hover:bg-[#026aa0] dark:bg-violet-600 dark:hover:bg-violet-700 text-white"
              >
                Save Log
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Rule"
        description={`Are you sure you want to delete the rule for "${ruleToDelete?.part_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          if (ruleToDelete) {
            dispatch(deleteRule(ruleToDelete.id!));
            toast({
              title: "Rule Deleted",
              description: `${ruleToDelete.part_name} rule removed`,
            });
            if (selectedVesselId) {
              dispatch(fetchMaintenanceSummary(selectedVesselId));
            }
          }
        }}
      />
    </div>
  );
}
