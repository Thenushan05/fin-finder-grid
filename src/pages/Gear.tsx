import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { mockGear } from "@/services/mockData";
import { marketApi, type SpeciesMeta } from "@/services/marketApi";
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Anchor,
  Fish,
  Ship,
  ClipboardCheck,
  ArrowRight,
  LayoutGrid,
  List as ListIcon,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Gear() {
  const [selectedSpecies, setSelectedSpecies] = useState<string>("YFT");
  const [activeTab, setActiveTab] = useState("checklist");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [speciesList, setSpeciesList] = useState<SpeciesMeta[]>([]);

  useEffect(() => {
    marketApi
      .listSpecies()
      .then((res) => setSpeciesList(res.species))
      .catch(() => {});
  }, []);

  const currentSpeciesName =
    speciesList.find((s) => s.code === selectedSpecies)?.name ??
    selectedSpecies;

  // Get recommended gear for active species (using catalog gear data)
  const recommendedGear = mockGear.filter(
    (g) =>
      g.targetSpecies.includes(selectedSpecies) ||
      g.targetSpecies.includes(currentSpeciesName),
  );

  // Logic for checklist (mock checklist items)
  const checklistItems = recommendedGear.map((g) => ({
    id: g.id,
    name: g.name,
    checked: true,
    required: true,
  }));

  const [checklist, setChecklist] = useState(checklistItems);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const allReady = checklist.every((i) => i.checked);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0C15] p-6 lg:p-8 font-sans space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-600/20">
              <Anchor className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Gear Readiness
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">
            Optimize your loadout for the target catch
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="px-4 py-2 border-r border-slate-200 dark:border-slate-700 hidden sm:block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Target Catch
            </span>
          </div>
          <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
            <SelectTrigger className="w-[180px] border-none shadow-none bg-transparent focus:ring-0 px-2 h-10 text-base font-bold text-slate-700 dark:text-slate-200">
              <SelectValue placeholder="Select Species" />
            </SelectTrigger>
            <SelectContent>
              {speciesList.length > 0 ? (
                speciesList.map((species) => (
                  <SelectItem key={species.code} value={species.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400 text-xs w-8">
                        {species.code}
                      </span>
                      <span>{species.name}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="YFT">Yellowfin Tuna (YFT)</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top Banner: Active Strategy */}
      <Card className="border-none shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
              <Fish className="w-4 h-4" /> Recommended Strategy
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Fishing for{" "}
              <span className="text-emerald-400">{currentSpeciesName}</span>?
            </h2>
            <p className="text-slate-400 max-w-lg">
              Based on recommended gear types for{" "}
              <span className="text-white font-bold ml-1">
                {currentSpeciesName}
              </span>
              .
            </p>
          </div>

          <div className="flex gap-3">
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold">{recommendedGear.length}</div>
              <div className="text-xs text-slate-400 font-bold uppercase mt-1">
                Rec. Items
              </div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold">
                {checklist.filter((i) => i.checked).length}/{checklist.length}
              </div>
              <div className="text-xs text-slate-400 font-bold uppercase mt-1">
                Ready
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        defaultValue="checklist"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto grid grid-cols-2 h-12">
          <TabsTrigger
            value="checklist"
            className="rounded-lg text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 shadow-sm"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" /> Pre-Trip Checklist
          </TabsTrigger>
          <TabsTrigger
            value="library"
            className="rounded-lg text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 shadow-sm"
          >
            <LayoutGrid className="w-4 h-4 mr-2" /> All Gear Library
          </TabsTrigger>
        </TabsList>

        {/* CHECKLIST VIEW */}
        <TabsContent value="checklist" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Checklist Card */}
            <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5" />
                  </span>
                  Manifest for Today
                </CardTitle>
                <CardDescription>
                  Ensure you have all necessary equipment before departure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                      item.checked
                        ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60"
                        : "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-sm ring-1 ring-indigo-500/10",
                    )}
                    onClick={() => toggleCheck(item.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleCheck(item.id)}
                        className="w-6 h-6 border-2 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 rounded-full"
                      />
                      <div>
                        <h4
                          className={cn(
                            "font-bold text-lg",
                            item.checked
                              ? "text-slate-500 line-through"
                              : "text-slate-800 dark:text-white",
                          )}
                        >
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Mandatory for {selectedSpecies}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={item.checked ? "outline" : "default"}
                      className={
                        item.checked
                          ? "text-slate-400"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }
                    >
                      {item.checked ? "Packed" : "Required"}
                    </Badge>
                  </div>
                ))}

                {checklist.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    <p>
                      No specific gear requirements found for this species in
                      our database.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-950 p-6 rounded-b-xl border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Info className="w-4 h-4" />
                  <span>Always verify permits for Restricted gear.</span>
                </div>
                <Button
                  disabled={!allReady}
                  className={cn(
                    "font-bold",
                    allReady ? "bg-emerald-600 hover:bg-emerald-700" : "",
                  )}
                >
                  {allReady ? "Confirm & Log Departure" : "Complete Checklist"}{" "}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            {/* Status Sidebar */}
            <div className="space-y-6">
              <Card
                className={cn(
                  "border-none shadow-md transition-colors",
                  allReady
                    ? "bg-emerald-50 dark:bg-emerald-900/20"
                    : "bg-amber-50 dark:bg-amber-900/20",
                )}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm",
                      allReady
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-amber-100 text-amber-600",
                    )}
                  >
                    {allReady ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : (
                      <AlertTriangle className="w-8 h-8" />
                    )}
                  </div>
                  <h3
                    className={cn(
                      "text-xl font-bold mb-1",
                      allReady
                        ? "text-emerald-800 dark:text-emerald-200"
                        : "text-amber-800 dark:text-amber-200",
                    )}
                  >
                    {allReady ? "Ready to Sail" : "Inspection Pending"}
                  </h3>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      allReady
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {allReady
                      ? "All gear items accounted for."
                      : "You have unpacked items."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase text-slate-400">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start font-bold text-slate-600 dark:text-slate-300"
                  >
                    <Wrench className="w-4 h-4 mr-3 text-slate-400" /> Report
                    Maintenance
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-bold text-slate-600 dark:text-slate-300"
                  >
                    <Ship className="w-4 h-4 mr-3 text-slate-400" /> View Vessel
                    Docs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* GEAR LIBRARY VIEW (GRID) */}
        <TabsContent value="library" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockGear.map((gear) => (
              <Dialog key={gear.id}>
                <DialogTrigger asChild>
                  <Card className="border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {gear.code}
                      </Badge>
                      <Badge
                        className={cn(
                          "border-0 font-bold",
                          gear.status === "Permitted"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
                        )}
                      >
                        {gear.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {gear.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Ideal for {gear.targetSpecies.join(", ")}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">Depth</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {gear.depthRange.min}-{gear.depthRange.max}m
                          </span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">Selectivity</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {gear.selectivity}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View Full Specs</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{gear.name}</DialogTitle>
                    <DialogDescription>
                      Full specifications and compliance details.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-bold">
                          Max Depth
                        </p>
                        <p className="text-xl font-bold">
                          {gear.depthRange.max}m
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase font-bold">
                          Risk Level
                        </p>
                        <p className="text-xl font-bold">{gear.bycatchRisk}</p>
                      </div>
                    </div>
                    {/* More details could go here */}
                    <Button className="w-full">Mark for Maintenance</Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
