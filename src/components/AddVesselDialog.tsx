import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Ship, Loader2 } from "lucide-react";
import { createVessel, getFuelVessels } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface AddVesselDialogProps {
  onVesselAdded: () => void;
}

// Vessel types from Excel sheet data
const VESSEL_TYPES = ["IMUL", "MULTI", "FRP", "TRADITIONAL", "STEEL", "WOODEN"];

// Engine types from Excel sheet data
const ENGINE_TYPES = [
  "Inboard Diesel",
  "Outboard Petrol",
  "Inboard Petrol",
  "Outboard Diesel",
  "Electric",
];

export default function AddVesselDialog({
  onVesselAdded,
}: AddVesselDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fuelVessels, setFuelVessels] = useState<any[]>([]);
  const [loadingFuelVessels, setLoadingFuelVessels] = useState(false);
  const [selectedFuelVessel, setSelectedFuelVessel] = useState<string>("");
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    length: "",
    beam: "",
    engineType: "",
    horsepower: "",
    fuelCapacity: "",
    crewCapacity: "",
    description: "",
  });

  const loadFuelVessels = async () => {
    setLoadingFuelVessels(true);
    try {
      const response = await getFuelVessels();
      setFuelVessels(response.vessels || []);
    } catch (error) {
      console.error("Failed to load fuel vessels:", error);
      toast({
        title: "Error",
        description: "Failed to load vessel database",
        variant: "destructive",
      });
    } finally {
      setLoadingFuelVessels(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && fuelVessels.length === 0) {
      loadFuelVessels();
    }
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        name: "",
        type: "",
        length: "",
        beam: "",
        engineType: "",
        horsepower: "",
        fuelCapacity: "",
        crewCapacity: "",
        description: "",
      });
      setSelectedFuelVessel("");
    }
  };

  const handleFuelVesselSelect = (vesselId: string) => {
    setSelectedFuelVessel(vesselId);
    const vessel = fuelVessels.find((v) => v.vessel_id === vesselId);

    if (vessel) {
      setFormData({
        name: vessel.vessel_id,
        type: vessel.vessel_type || "",
        length: "", // Not available in fuel API
        beam: "", // Not available in fuel API
        engineType: vessel.engine_type || "",
        horsepower: vessel.hp?.toString() || "",
        fuelCapacity: "", // Could calculate from fuel_consumption_per_day
        crewCapacity: "",
        description: `Imported from vessel database. Daily fuel consumption: ${vessel.fuel_consumption_per_day}L, Daily fuel cost: $${vessel.fuel_cost_usd_per_day}`,
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.engineType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const vesselData = {
        name: formData.name,
        type: formData.type,
        specifications: {
          length: parseFloat(formData.length) || null,
          beam: parseFloat(formData.beam) || null,
          engineType: formData.engineType,
          horsepower: parseFloat(formData.horsepower) || null,
          fuelCapacity: parseFloat(formData.fuelCapacity) || null,
          crewCapacity: parseInt(formData.crewCapacity) || null,
        },
        description: formData.description,
        systems: [
          {
            name: "Engine",
            type: "propulsion",
            status: "operational",
            lastMaintenance: new Date().toISOString().split("T")[0],
            nextMaintenance: null,
            maintenanceInterval: 100, // hours
          },
          {
            name: "Fuel System",
            type: "fuel",
            status: "operational",
            lastMaintenance: new Date().toISOString().split("T")[0],
            nextMaintenance: null,
            maintenanceInterval: 50,
          },
          {
            name: "Navigation",
            type: "electronics",
            status: "operational",
            lastMaintenance: new Date().toISOString().split("T")[0],
            nextMaintenance: null,
            maintenanceInterval: 200,
          },
          {
            name: "Safety Equipment",
            type: "safety",
            status: "operational",
            lastMaintenance: new Date().toISOString().split("T")[0],
            nextMaintenance: null,
            maintenanceInterval: 30,
          },
        ],
        tasks: [],
        serviceLogs: [],
      };

      await createVessel(vesselData);

      toast({
        title: "Success",
        description: `Vessel "${formData.name}" added successfully`,
        variant: "default",
      });

      setOpen(false);
      onVesselAdded();
    } catch (error) {
      console.error("Failed to create vessel:", error);
      toast({
        title: "Error",
        description: "Failed to add vessel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vessel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Add New Vessel
          </DialogTitle>
          <DialogDescription>
            Add a vessel to your maintenance database. You can import from
            vessel database or create manually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Import from Database Section */}
          <div className="space-y-4 p-4 bg-accent rounded-lg">
            <Label className="text-sm font-medium">
              Import from Vessel Database
            </Label>
            <div className="space-y-2">
              <Select
                value={selectedFuelVessel}
                onValueChange={handleFuelVesselSelect}
                disabled={loadingFuelVessels}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingFuelVessels
                        ? "Loading vessels..."
                        : "Select vessel from database"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {fuelVessels.map((vessel) => (
                    <SelectItem key={vessel.vessel_id} value={vessel.vessel_id}>
                      {vessel.vessel_id} - {vessel.vessel_type} ({vessel.hp}HP)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingFuelVessels && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading vessel database...
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Vessel Information</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Vessel Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Blue Ocean 1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Vessel Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VESSEL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Length (m)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={formData.length}
                  onChange={(e) => handleInputChange("length", e.target.value)}
                  placeholder="e.g., 12.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beam">Beam (m)</Label>
                <Input
                  id="beam"
                  type="number"
                  step="0.1"
                  value={formData.beam}
                  onChange={(e) => handleInputChange("beam", e.target.value)}
                  placeholder="e.g., 3.2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="engineType">Engine Type *</Label>
                <Select
                  value={formData.engineType}
                  onValueChange={(value) =>
                    handleInputChange("engineType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select engine type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENGINE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horsepower">Horsepower (HP)</Label>
                <Input
                  id="horsepower"
                  type="number"
                  value={formData.horsepower}
                  onChange={(e) =>
                    handleInputChange("horsepower", e.target.value)
                  }
                  placeholder="e.g., 150"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelCapacity">Fuel Capacity (L)</Label>
                <Input
                  id="fuelCapacity"
                  type="number"
                  value={formData.fuelCapacity}
                  onChange={(e) =>
                    handleInputChange("fuelCapacity", e.target.value)
                  }
                  placeholder="e.g., 500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crewCapacity">Crew Capacity</Label>
                <Input
                  id="crewCapacity"
                  type="number"
                  value={formData.crewCapacity}
                  onChange={(e) =>
                    handleInputChange("crewCapacity", e.target.value)
                  }
                  placeholder="e.g., 6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Additional vessel information..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add Vessel"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
