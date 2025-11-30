import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { createVessel } from "@/store/maintenanceSlice";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export function ManualVesselCreator() {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "Multi-Day Vessel",
    lastTrip: new Date().toISOString().split("T")[0],
    fuelOnBoard: "8,000 L",
    iceCapacity: "80%",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vesselData = {
        name: formData.name,
        type: formData.type,
        stats: {
          lastTrip: formData.lastTrip,
          engineHours: 0,
          fuelOnBoard: formData.fuelOnBoard,
          iceCapacity: formData.iceCapacity,
          nextServiceDue: "Not scheduled",
        },
        systems: [
          {
            id: "engine",
            name: "Engine & Propulsion",
            status: "operational",
            description: "Main inboard diesel engine and transmission.",
            blueprintImage: "/engine_blueprint.png",
            specs: {
              "Oil Level": "Good",
              "Coolant Temp": "Normal",
              "RPM (Idle)": "750",
            },
            upcomingTasks: [],
            lastService: {
              date: new Date().toISOString().split("T")[0],
              technician: "Initial Setup",
              notes: "Vessel created",
            },
          },
          {
            id: "nets",
            name: "Nets & Gear",
            status: "operational",
            description: "Winches, drums, and fishing nets.",
            blueprintImage: "/deck_blueprint.png",
            specs: {
              "Net Condition": "Good",
              "Winch Pressure": "Normal",
            },
            upcomingTasks: [],
            lastService: {
              date: new Date().toISOString().split("T")[0],
              technician: "Initial Setup",
              notes: "Vessel created",
            },
          },
          {
            id: "safety",
            name: "Safety & Compliance",
            status: "operational",
            description: "Life saving appliances and fire fighting equipment.",
            blueprintImage: "/safety_blueprint.png",
            specs: {
              "Life Raft": "Certified",
              Flares: "Valid",
            },
            upcomingTasks: [],
            lastService: {
              date: new Date().toISOString().split("T")[0],
              technician: "Initial Setup",
              notes: "Vessel created",
            },
          },
          {
            id: "electronics",
            name: "Electronics & Sensors",
            status: "operational",
            description: "Navigation, communication, and fish finding gear.",
            blueprintImage: "/electronics_blueprint.png",
            specs: {
              GPS: "Operational",
              Sonar: "Operational",
              Battery: "Good",
            },
            upcomingTasks: [],
            lastService: {
              date: new Date().toISOString().split("T")[0],
              technician: "Initial Setup",
              notes: "Vessel created",
            },
          },
        ],
      };

      await dispatch(createVessel(vesselData as any)).unwrap();

      toast({
        title: "Vessel Created",
        description: `${formData.name} has been added successfully.`,
      });

      setOpen(false);
      setFormData({
        name: "",
        type: "Multi-Day Vessel",
        lastTrip: new Date().toISOString().split("T")[0],
        fuelOnBoard: "8,000 L",
        iceCapacity: "80%",
      });
    } catch (err: any) {
      toast({
        title: "Error Creating Vessel",
        description: err?.message || "Failed to create vessel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Vessel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Vessel</DialogTitle>
            <DialogDescription>
              Add a new fishing vessel to your fleet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Vessel Name *</Label>
              <Input
                id="name"
                placeholder="e.g., IMUL-001"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Vessel Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
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
              <Label htmlFor="lastTrip">Last Trip Date</Label>
              <Input
                id="lastTrip"
                type="date"
                value={formData.lastTrip}
                onChange={(e) =>
                  setFormData({ ...formData, lastTrip: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fuel">Fuel On Board</Label>
                <Input
                  id="fuel"
                  placeholder="8,000 L"
                  value={formData.fuelOnBoard}
                  onChange={(e) =>
                    setFormData({ ...formData, fuelOnBoard: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ice">Ice Capacity</Label>
                <Input
                  id="ice"
                  placeholder="80%"
                  value={formData.iceCapacity}
                  onChange={(e) =>
                    setFormData({ ...formData, iceCapacity: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? "Creating..." : "Create Vessel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
