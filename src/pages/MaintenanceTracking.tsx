import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  fetchRules,
  fetchVesselState,
  fetchMaintenanceSummary,
  seedDefaultRules,
  completeTrip,
  logMaintenance,
  fetchMaintenanceLogs,
  type VesselMaintenanceSummary,
  type SystemMaintenanceStatus,
} from "@/store/maintenanceRulesSlice";
import { fetchVessels } from "@/store/maintenanceSlice";
import { checkAuth } from "@/store/authSlice";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Wrench,
  Ship,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Plus,
} from "lucide-react";

export default function MaintenanceTracking() {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const {
    vessels,
    loading: vesselsLoading,
    error: vesselsError,
  } = useSelector((state: RootState) => state.maintenance);
  const { summaries, vesselStates, rules, loading, error } = useSelector(
    (state: RootState) => state.maintenanceRules
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [activeSystemId, setActiveSystemId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize data
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch vessels first
        console.log("Fetching vessels...");
        const vesselsResult = await dispatch(fetchVessels()).unwrap();
        console.log("Vessels fetched:", vesselsResult);

        if (vesselsResult.length === 0) {
          toast({
            title: "No Vessels Found",
            description:
              "Please create a vessel first in the Maintenance page.",
            variant: "default",
          });
          setInitialized(true);
          return;
        }

        // Fetch rules (users can manually create/edit rules)
        await dispatch(fetchRules(undefined)).unwrap();

        setInitialized(true);
      } catch (err: any) {
        console.error("Initialization error:", err);
        const errorMsg =
          err?.message || err || "Failed to initialize maintenance tracking";

        // Check if it's an auth error
        if (
          err?.includes("401") ||
          err?.includes("Unauthorized") ||
          err?.includes("authentication")
        ) {
          toast({
            title: "Session Expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          toast({
            title: "Initialization Error",
            description: errorMsg,
            variant: "destructive",
          });
        }
        setInitialized(true);
      }
    };

    if (!initialized) {
      init();
    }
  }, [dispatch, toast, initialized]);

  // Fetch maintenance summary when vessel is selected
  useEffect(() => {
    if (selectedVesselId && vessels.length > 0) {
      dispatch(fetchMaintenanceSummary(selectedVesselId));
      dispatch(fetchVesselState(selectedVesselId));
    }
  }, [selectedVesselId, vessels, dispatch]);

  // Auto-select first vessel
  useEffect(() => {
    if (!selectedVesselId && vessels.length > 0) {
      setSelectedVesselId(vessels[0].id);
    }
  }, [vessels, selectedVesselId]);

  const currentSummary: VesselMaintenanceSummary | undefined = selectedVesselId
    ? summaries[selectedVesselId]
    : undefined;

  const currentState = selectedVesselId
    ? vesselStates[selectedVesselId]
    : undefined;

  const activeSystem: SystemMaintenanceStatus | undefined =
    currentSummary?.systems.find((s) => s.system_id === activeSystemId);

  // Auto-select first system
  useEffect(() => {
    if (
      currentSummary &&
      !activeSystemId &&
      currentSummary.systems.length > 0
    ) {
      setActiveSystemId(currentSummary.systems[0].system_id);
    }
  }, [currentSummary, activeSystemId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
      case "ok":
        return "bg-green-500";
      case "due_soon":
      case "due-soon":
        return "bg-yellow-500";
      case "overdue":
        return "bg-red-500";
      case "critical":
        return "bg-red-700";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "operational":
      case "ok":
        return "default";
      case "due_soon":
      case "due-soon":
        return "secondary";
      case "overdue":
      case "critical":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleRefresh = () => {
    if (selectedVesselId) {
      dispatch(fetchMaintenanceSummary(selectedVesselId));
      dispatch(fetchVesselState(selectedVesselId));
      toast({
        title: "Refreshed",
        description: "Maintenance data updated",
      });
    }
  };

  if (loading && !currentSummary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading maintenance data...</span>
      </div>
    );
  }

  if (error || vesselsError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
            <CardDescription>
              {error || vesselsError || "Failed to load maintenance data"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            {vesselsError && (
              <p className="text-sm text-muted-foreground text-center">
                Try navigating to the Maintenance page first to create vessels.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (vessels.length === 0 && initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Vessels Found</CardTitle>
            <CardDescription>
              You need to create vessels before using maintenance tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/maintenance")}>
              Go to Maintenance Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentSummary && initialized && vessels.length > 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Loading Maintenance Data</CardTitle>
            <CardDescription>
              Calculating maintenance status for{" "}
              {vessels.find((v) => v.id === selectedVesselId)?.name || "vessel"}
              ...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading if we have vessels but no summary yet
  if (!currentSummary && vessels.length > 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Loading Maintenance Data</CardTitle>
            <CardDescription>Fetching maintenance summary...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentSummary && initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              Please select a vessel to view maintenance tracking.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Don't render the main UI if currentSummary doesn't exist
  if (!currentSummary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Left Sidebar - Systems List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b space-y-4">
          <div>
            <label className="text-sm font-medium">Vessel</label>
            <Select
              value={selectedVesselId || ""}
              onValueChange={setSelectedVesselId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vessel" />
              </SelectTrigger>
              <SelectContent>
                {vessels.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentSummary && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Status</p>
                <Badge
                  variant={getStatusBadgeVariant(currentSummary.overall_status)}
                  className="mt-1"
                >
                  {currentSummary.overall_status.toUpperCase()}
                </Badge>
              </div>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-2">Vessel State</h3>
          {currentState && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engine Hours:</span>
                <span className="font-mono">{currentState.engine_hours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Trips:</span>
                <span className="font-mono">{currentState.total_trips}</span>
              </div>
              {currentState.last_trip_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Trip:</span>
                  <span className="font-mono text-xs">
                    {new Date(currentState.last_trip_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <h3 className="text-sm font-semibold mb-3">Systems</h3>
            {currentSummary &&
              currentSummary.systems &&
              currentSummary.systems.map((system) => (
                <Card
                  key={system.system_id}
                  className={`cursor-pointer transition-colors ${
                    activeSystemId === system.system_id ? "bg-accent" : ""
                  }`}
                  onClick={() => setActiveSystemId(system.system_id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(
                              system.status
                            )}`}
                          />
                          <span className="font-medium text-sm">
                            {system.system_name}
                          </span>
                        </div>
                        {system.summary_message && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {system.summary_message}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(system.status)}
                        className="text-xs"
                      >
                        {system.parts.filter((p) => p.status !== "ok").length ||
                          "✓"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - System Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeSystem ? (
          <>
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {activeSystem.system_name}
                  </h2>
                  <p className="text-muted-foreground">
                    {activeSystem.summary_message}
                  </p>
                </div>
                <Badge
                  variant={getStatusBadgeVariant(activeSystem.status)}
                  className="text-lg px-4 py-2"
                >
                  {activeSystem.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Parts List */}
            <ScrollArea className="flex-1 p-6">
              <div className="grid gap-4">
                {activeSystem.parts.map((part) => (
                  <Card key={part.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{part.name}</CardTitle>
                        <Badge variant={getStatusBadgeVariant(part.status)}>
                          {part.status === "ok"
                            ? "OK"
                            : part.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription>{part.message}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Trigger Type</p>
                          <p className="font-mono font-semibold">
                            {part.trigger_type}
                          </p>
                        </div>
                        {part.current_value !== undefined && (
                          <div>
                            <p className="text-muted-foreground">
                              Current Value
                            </p>
                            <p className="font-mono font-semibold">
                              {part.current_value}
                            </p>
                          </div>
                        )}
                        {part.due_at_value !== undefined && (
                          <div>
                            <p className="text-muted-foreground">Due At</p>
                            <p className="font-mono font-semibold">
                              {part.due_at_value}
                            </p>
                          </div>
                        )}
                        {part.remaining !== undefined && (
                          <div>
                            <p className="text-muted-foreground">Remaining</p>
                            <p className="font-mono font-semibold">
                              {part.remaining} {part.trigger_type}
                            </p>
                          </div>
                        )}
                      </div>

                      {part.last_service && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-semibold mb-2">
                            Last Service
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Date</p>
                              <p className="font-mono">
                                {new Date(
                                  part.last_service.done_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Technician
                              </p>
                              <p>{part.last_service.technician}</p>
                            </div>
                            {part.last_service.notes && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Notes</p>
                                <p className="text-xs">
                                  {part.last_service.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4" />
              <p>Select a system to view maintenance details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
