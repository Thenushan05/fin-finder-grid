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
} from "lucide-react";
import AuthDebug from "@/components/AuthDebug";

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
    blueprintUrl: "",
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

  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({});

  const toggleExpand = (partKey: string, systemId: string, partName: string) => {
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
    dispatch(fetchVessels());
    dispatch(fetchRules(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (selectedVesselId) {
      dispatch(fetchMaintenanceSummary(selectedVesselId));
      dispatch(fetchVesselState(selectedVesselId));
    }
  }, [selectedVesselId, dispatch]);

  useEffect(() => {
    if (!selectedVesselId) return;
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
  }, [activeTab, selectedVesselId, dispatch]);

  const currentSummary = selectedVesselId ? summaries[selectedVesselId] : null;
  const currentState = selectedVesselId ? vesselStates[selectedVesselId] : null;
  const selectedVessel = vessels.find((v) => v.id === selectedVesselId);

  const getVesselBlueprint = (type: string) => {
    const blueprintMap: Record<string, string> = {
      "Multi-Day Vessel": "/imul_real_blueprint.png",
      "Single-Day Vessel": "/iday_blueprint.png",
      "Offshore Vessel": "/offshore_blueprint.png",
    };
    return blueprintMap[type] || "/imul_real_blueprint.png";
  };

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
              blueprintImage: vesselForm.blueprintUrl || "/engine_blueprint.png",
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
              blueprintImage: vesselForm.blueprintUrl || "/nets_blueprint.png",
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
      setVesselForm({ name: "", type: "Multi-Day Vessel", blueprintUrl: "" });
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



  if (vesselsLoading || rulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-6">
        <div className="text-center">
          {/* Vessel Riding Animation */}
          <div className="relative w-64 h-64 mx-auto mb-8">
            {/* Waves */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
              {/* Wave 1 */}
              <path
                d="M0,100 Q25,80 50,100 T100,100 T150,100 T200,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-blue-400 dark:text-blue-500"
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
                className="text-blue-300 dark:text-blue-400"
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
              <Ship className="w-16 h-16 text-violet-600 dark:text-violet-400" style={{
                animation: 'float 3s ease-in-out infinite'
              }} />
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
            <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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

  const showLoginPrompt = auth && !auth.loading && !auth.user;
  if (showLoginPrompt) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] p-6">
        <Card className="max-w-lg w-full mx-auto text-center p-8">
          <CardHeader>
            <CardTitle>Please login to access Maintenance</CardTitle>
            <CardDescription>
              All vessels, rules and logs are private to your account. Sign in
              to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Dialog open={vesselDialogOpen} onOpenChange={setVesselDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
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
                    <div className="grid gap-2">
                      <Label htmlFor="blueprint">
                        Blueprint Image URL (optional)
                      </Label>
                      <div className="text-xs text-muted-foreground mb-2">
                        Upload blueprint to public/ folder, then enter:
                        /your-blueprint.png
                      </div>
                      <Input
                        id="blueprint"
                        placeholder="/vessel_blueprint.png"
                        value={vesselForm.blueprintUrl}
                        onChange={(e) =>
                          setVesselForm({
                            ...vesselForm,
                            blueprintUrl: e.target.value,
                          })
                        }
                      />
                      {vesselForm.blueprintUrl && (
                        <div className="mt-2 p-2 border rounded">
                          <img
                            src={vesselForm.blueprintUrl}
                            alt="Blueprint preview"
                            className="w-full h-32 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "";
                              e.currentTarget.alt = "Preview not available";
                            }}
                          />
                        </div>
                      )}
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
                <Button variant="outline" className="border-violet-500/30 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400">
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
          </div>
        </div>

        {vessels.length > 0 && (
          <Card className="border-violet-100 dark:border-violet-900/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Label className="text-violet-900 dark:text-violet-100">Selected Vessel</Label>
              <Select
                value={selectedVesselId || ""}
                onValueChange={setSelectedVesselId}
              >
                <SelectTrigger className="mt-2 border-violet-200 dark:border-violet-800 focus:ring-violet-500">
                  <SelectValue placeholder="Select a vessel" />
                </SelectTrigger>
                <SelectContent>
                  {vessels.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <Ship className="inline mr-2 h-4 w-4 text-violet-500" />
                      {v.name} - {v.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {vessels.length === 0 && (
          <Card className="p-12 text-center border-dashed border-2 border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/10">
            <Ship className="mx-auto h-12 w-12 text-violet-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-violet-900 dark:text-violet-100">No Vessels Yet</h3>
            <p className="text-muted-foreground mb-4">
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
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Vessel
            </Button>
          </Card>
        )}

        {selectedVesselId && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-violet-50 dark:bg-violet-950/30 p-1 rounded-lg border border-violet-200 dark:border-violet-800">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="tracking"
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
              >
                Status Tracking
              </TabsTrigger>
              <TabsTrigger 
                value="rules"
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
              >
                Maintenance Rules
              </TabsTrigger>
              <TabsTrigger 
                value="blueprint"
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
              >
                Blueprint
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-violet-100 dark:border-violet-900/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm text-violet-900 dark:text-violet-100">Engine Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                      {currentState?.engine_hours || 0}h
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-violet-100 dark:border-violet-900/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm text-violet-900 dark:text-violet-100">Total Trips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                      {currentState?.total_trips || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-violet-100 dark:border-violet-900/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm text-violet-900 dark:text-violet-100">Last Trip</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-violet-700 dark:text-violet-300">
                      {currentState?.last_trip_date
                        ? new Date(currentState.last_trip_date).toLocaleDateString()
                        : "No trips yet"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4">
                <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white">
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
                            className="focus-visible:ring-violet-500"
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
                            className="focus-visible:ring-violet-500"
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
                        <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">Log Trip</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="border-violet-500/30 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400"
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
                  <Card className="border-violet-100 dark:border-violet-900/50 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-violet-900 dark:text-violet-100">Overall Status</CardTitle>
                        <Badge
                          variant={
                            currentSummary.overall_status === "operational"
                              ? "default"
                              : "destructive"
                          }
                          className={currentSummary.overall_status === "operational" ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {currentSummary.overall_status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>

                  {currentSummary.systems.map((system) => (
                    <Card key={system.system_id} className="border-violet-100 dark:border-violet-900/50 shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-violet-900 dark:text-violet-100">
                            {system.system_name}
                          </CardTitle>
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(
                              system.status
                            )}`}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
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
                                  className="border border-violet-100 dark:border-violet-800/30 rounded-lg p-3 bg-violet-50/30 dark:bg-violet-900/10"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-violet-900 dark:text-violet-100">
                                      {part.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={
                                          part.status === "ok"
                                            ? "default"
                                            : part.status === "due_soon"
                                            ? "secondary"
                                            : "destructive"
                                        }
                                      >
                                        {part.status.toUpperCase()}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          toggleExpand(
                                            partKey,
                                            system.system_id,
                                            part.name
                                          )
                                        }
                                        className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                                      >
                                        {expanded ? "Hide" : "See more"}
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
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
                                        <Card className="mt-3 border-red-200 bg-red-50 dark:bg-red-900/10">
                                          <CardContent className="pt-4">
                                            <div className="text-sm font-semibold text-red-700 dark:text-red-400">
                                              Why this is overdue
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                              {why}
                                            </div>
                                            <div className="text-sm font-semibold text-red-700 dark:text-red-400 mt-3">
                                              What to do
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                              {actionSuggestion}
                                            </div>
                                            <div className="mt-3">
                                              <Button
                                                size="sm"
                                                className="bg-red-600 hover:bg-red-700 text-white"
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
                                          </CardContent>
                                        </Card>
                                      );
                                    })()}
                                  {part.remaining !== undefined && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Current: {part.current_value} | Due at:{" "}
                                      {part.due_at_value}
                                    </p>
                                  )}

                                  {expanded && (
                                    <div className="mt-3 space-y-2">
                                      {filteredLogs.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">
                                          No logs for this part.
                                        </div>
                                      ) : (
                                        filteredLogs.map((l) => (
                                          <Card key={l.id} className="bg-white dark:bg-slate-950 border-violet-100 dark:border-violet-900/30 shadow-sm hover:shadow-md transition-all duration-200">
                                            <CardContent className="p-4">
                                              <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                  <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
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
                                                <Badge variant="outline" className="bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800">
                                                  {l.done_at
                                                    ? new Date(l.done_at).toLocaleDateString()
                                                    : "No Date"}
                                                </Badge>
                                              </div>
                                              
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                  <User className="h-4 w-4 text-violet-500 shrink-0" />
                                                  <span className="truncate" title={l.technician || "Unknown"}>
                                                    {l.technician || "Unknown Technician"}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                  <DollarSign className="h-4 w-4 text-violet-500 shrink-0" />
                                                  <span>{l.cost ? `${l.cost} LKR` : "No Cost Recorded"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 md:col-span-3">
                                                  <FileText className="h-4 w-4 text-violet-500 shrink-0" />
                                                  <span className="truncate" title={l.notes || "No notes"}>
                                                    {l.notes || "No notes provided"}
                                                  </span>
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))
                                      )}
                                    </div>
                                  )}
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
                <Card className="p-12 text-center border-dashed border-2 border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/10">
                  <AlertCircle className="mx-auto h-12 w-12 text-violet-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-violet-900 dark:text-violet-100">
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
                <Card className="p-12 text-center border-dashed border-2 border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/10">
                  <Wrench className="mx-auto h-12 w-12 text-violet-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-violet-900 dark:text-violet-100">No Rules Defined</h3>
                  <p className="text-muted-foreground mb-4">
                    Create maintenance rules to track when service is due
                  </p>
                  <Button onClick={() => setRuleDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Rule
                  </Button>
                </Card>
              )}

              {rules.length > 0 && (
                <div className="grid gap-4">
                  {rules.map((rule) => (
                    <Card key={rule.id} className="border-violet-100 dark:border-violet-900/50 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-violet-900 dark:text-violet-100">
                              {rule.part_name}
                            </CardTitle>
                            <CardDescription className="text-violet-600/80 dark:text-violet-400/80">
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
                                if (
                                  confirm(`Delete rule for "${rule.part_name}"?`)
                                ) {
                                  dispatch(deleteRule(rule.id!));
                                  toast({
                                    title: "Rule Deleted",
                                    description: `${rule.part_name} rule removed`,
                                  });
                                  if (selectedVesselId) {
                                    dispatch(
                                      fetchMaintenanceSummary(selectedVesselId)
                                    );
                                  }
                                }
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
                            <span className="font-medium text-slate-700 dark:text-slate-300">{rule.interval_value} {rule.trigger_type}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">
                              Warning:
                            </span>{" "}
                            <span className="font-medium text-slate-700 dark:text-slate-300">{rule.warning_before} {rule.trigger_type} before due</span>
                          </p>
                          {rule.description && (
                            <p>
                              <span className="text-muted-foreground">
                                Notes:
                              </span>{" "}
                              <span className="italic text-slate-600 dark:text-slate-400">{rule.description}</span>
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="blueprint">
              {!selectedVessel ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ship className="mx-auto h-16 w-16 mb-4" />
                  <p>Select a vessel to view system blueprints</p>
                </div>
              ) : (
                <div className="flex gap-6 min-h-[600px]">
                  <div className="w-64 bg-card rounded-xl border p-4 flex flex-col gap-2">
                    <div className="font-bold text-lg mb-2 text-center">
                      Systems
                    </div>
                    {selectedVessel.systems?.map((system) => (
                      <Button
                        key={system.id}
                        variant={
                          activeSystemId === system.id ? "default" : "outline"
                        }
                        className="justify-start text-left"
                        onClick={() => setActiveSystemId(system.id)}
                      >
                        {system.name}
                      </Button>
                    ))}
                  </div>

                  <div className="flex-1 flex items-center justify-center relative">
                    {!activeSystemId ? (
                      <div className="flex flex-col items-center w-full">
                        <div className="font-bold text-xl mb-2">
                          {selectedVessel.name} - {selectedVessel.type}
                        </div>
                        <div className="bg-[#003366] rounded-xl overflow-hidden relative shadow-inner border border-[#004488] min-h-[500px] flex items-center justify-center w-full">
                          <div
                            className="absolute inset-0 opacity-30 pointer-events-none"
                            style={{
                              backgroundImage:
                                "linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
                              backgroundSize: "40px 40px",
                            }}
                          />
                          <img
                            src={getVesselBlueprint(selectedVessel.type)}
                            alt={`${selectedVessel.name} Blueprint`}
                            className="max-w-full max-h-[600px] object-contain transition-all duration-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            onError={(e) => {
                              e.currentTarget.src = "/imul_real_blueprint.png";
                            }}
                          />
                          <div className="absolute bottom-4 left-4 right-4 z-10">
                            <Card className="bg-black/30 backdrop-blur-md border-white/20">
                              <CardContent className="p-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-white/70">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                                    <span>Operational</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                    <span>Due Soon</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                                    <span>Overdue</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-white rounded-full border-2 border-blue-500 shadow-[0_0_10px_white]" />
                                    <span>System Components</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                        <div className="mt-4 text-muted-foreground text-sm">
                          Click a system on the left to zoom in
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const system = selectedVessel.systems?.find(
                          (s) => s.id === activeSystemId
                        );
                        if (!system) return null;
                        return (
                          <div className="w-full flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveSystemId(null)}
                              >
                                Back
                              </Button>
                              <span className="font-bold text-lg">
                                {system.name}
                              </span>
                              <Badge
                                variant={
                                  system.status === "operational"
                                    ? "default"
                                    : system.status === "due-soon"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {system.status}
                              </Badge>
                            </div>
                            <div className="bg-[#003366] rounded-xl overflow-hidden relative shadow-inner border border-[#004488] min-h-[600px] w-full flex items-center justify-center">
                              <div
                                className="absolute inset-0 opacity-30 pointer-events-none"
                                style={{
                                  backgroundImage:
                                    "linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
                                  backgroundSize: "40px 40px",
                                }}
                              />
                              <img
                                src={system.blueprintImage}
                                alt={`${system.name} Detailed Blueprint`}
                                className="max-w-full max-h-[700px] object-contain transition-all duration-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110"
                                onError={(e) => {
                                  e.currentTarget.src = getVesselBlueprint(
                                    selectedVessel.type
                                  );
                                }}
                              />
                              {system.subParts?.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-white border-2 border-blue-500 shadow-[0_0_10px_white] animate-pulse"
                                  style={{ left: `${sub.x}%`, top: `${sub.y}%` }}
                                  title={sub.label}
                                />
                              ))}
                              <div className="absolute bottom-4 left-4 right-4 z-10">
                                <Card className="bg-black/30 backdrop-blur-md border-white/20">
                                  <CardContent className="p-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-white/70">
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                                        <span>Operational</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                        <span>Due Soon</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                                        <span>Overdue</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-white rounded-full border-2 border-blue-500 shadow-[0_0_10px_white]" />
                                        <span>System Components</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                            <div className="mt-4 text-muted-foreground text-sm text-center max-w-2xl">
                              {system.description}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
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
                <DialogTitle className="text-violet-900 dark:text-violet-100">Log Maintenance Work</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="text-violet-900 dark:text-violet-100">
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
                    <SelectTrigger className="border-violet-200 dark:border-violet-800 focus:ring-violet-500">
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
                  <Label className="text-violet-900 dark:text-violet-100">Part Name *</Label>
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
                    className="focus-visible:ring-violet-500 border-violet-200 dark:border-violet-800"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-violet-900 dark:text-violet-100">Date Completed</Label>
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
                    className="focus-visible:ring-violet-500 border-violet-200 dark:border-violet-800"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-violet-900 dark:text-violet-100">Technician</Label>
                  <Input
                    placeholder="Name or Company"
                    value={maintenanceForm.technician}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        technician: e.target.value,
                      })
                    }
                    className="focus-visible:ring-violet-500 border-violet-200 dark:border-violet-800"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-violet-900 dark:text-violet-100">Cost (LKR)</Label>
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
                    className="focus-visible:ring-violet-500 border-violet-200 dark:border-violet-800"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-violet-900 dark:text-violet-100">Notes</Label>
                  <Input
                    placeholder="Details about the work..."
                    value={maintenanceForm.notes}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        notes: e.target.value,
                      })
                    }
                    className="focus-visible:ring-violet-500 border-violet-200 dark:border-violet-800"
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
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">Save Log</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
