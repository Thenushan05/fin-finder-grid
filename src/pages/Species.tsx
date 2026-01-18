
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockSpecies } from "@/services/mockData";
import { useState, useRef } from "react";
import { Search, Fish, Anchor, Thermometer, Calendar, Upload, Loader2, Camera, X, CheckCircle, ArrowRight, Aperture, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Species() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState(mockSpecies[0]);
  
  // Fish Identifier State
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [identifiedSpecies, setIdentifiedSpecies] = useState<(typeof mockSpecies)[0] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIdentifiedSpecies(null);
    setAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      setAnalyzing(false);
      const randomSpecies = mockSpecies[Math.floor(Math.random() * mockSpecies.length)];
      setIdentifiedSpecies(randomSpecies);
    }, 2500);
  }

  const clearUpload = () => {
    setPreviewUrl(null);
    setIdentifiedSpecies(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const filteredSpecies = mockSpecies.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-8 font-sans space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
               <Fish className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Species Intelligence</h1>
           </div>
           <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">Identify, Analyze, and Understand Marine Life</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* LEFT COLUMN: SPECIES LIST (4 COLS) */}
        <Card className="lg:col-span-4 border-none shadow-xl bg-white dark:bg-slate-900 h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Library</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {filteredSpecies.map((species) => (
              <button
                key={species.id}
                onClick={() => setSelectedSpecies(species)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                  selectedSpecies.id === species.id
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                )}
              >
                <div className="flex items-center justify-between mb-1 relative z-10">
                  <span className={cn(
                    "font-bold text-sm",
                    selectedSpecies.id === species.id ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"
                  )}>{species.name}</span>
                  <Badge variant="outline" className={cn(
                    "text-[10px] h-5",
                    selectedSpecies.id === species.id ? "border-indigo-200 bg-white/50 text-indigo-600" : "border-slate-200 text-slate-500"
                  )}>{species.code}</Badge>
                </div>
                <p className="text-xs text-slate-400 italic relative z-10">{species.scientificName}</p>
                {selectedSpecies.id === species.id && (
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: MAIN CONTENT (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI IDENTIFIER CARD */}
          <Card className="border-none shadow-xl relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-xl flex items-center gap-2">
                <Aperture className="h-6 w-6 text-indigo-200" />
                AI Catch Identifier
              </CardTitle>
              <CardDescription className="text-indigo-100">
                Instantly identify species using computer vision. Upload or snap a photo.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {!previewUrl ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button 
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/20 hover:bg-white/10 transition-all group"
                   >
                      <div className="bg-white/20 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                         <Camera className="h-8 w-8 text-white" />
                      </div>
                      <span className="font-bold text-lg">Take Photo</span>
                      <span className="text-xs text-indigo-200 mt-1">Directly from camera</span>
                   </button>

                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/20 hover:bg-white/10 transition-all group"
                   >
                      <div className="bg-white/20 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                         <ImageIcon className="h-8 w-8 text-white" />
                      </div>
                      <span className="font-bold text-lg">Upload Image</span>
                      <span className="text-xs text-indigo-200 mt-1">From gallery</span>
                   </button>
                   
                   {/* Hidden Inputs */}
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                   <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row gap-6">
                  {/* Image Preview */}
                  <div className="relative w-full md:w-1/3 aspect-square rounded-xl overflow-hidden bg-black/20 shadow-inner">
                    <img src={previewUrl} alt="Catch" className="w-full h-full object-cover" />
                    <button onClick={clearUpload} className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Analysis Result */}
                  <div className="flex-1 flex flex-col justify-center">
                    {analyzing ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-white font-bold text-lg">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          Analyzing Catch...
                        </div>
                        <div className="space-y-2">
                           <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                             <div className="h-full bg-white animate-progress origin-left w-full shadow-[0_0_10px_2px_rgba(255,255,255,0.5)]"></div>
                           </div>
                           <p className="text-xs text-indigo-200 flex justify-between">
                              <span>Scanning morphology...</span>
                              <span>78%</span>
                           </p>
                        </div>
                      </div>
                    ) : identifiedSpecies ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="inline-flex items-center gap-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                          <CheckCircle className="h-3 w-3" /> Confirmed Match
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-white mb-1">{identifiedSpecies.name}</h3>
                          <p className="text-indigo-200 italic">{identifiedSpecies.scientificName}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-white/10 rounded-lg p-2 border border-white/10">
                              <span className="block text-[10px] uppercase text-indigo-300 font-bold">Code</span>
                              <span className="text-sm font-bold">{identifiedSpecies.code}</span>
                           </div>
                           <div className="bg-white/10 rounded-lg p-2 border border-white/10">
                              <span className="block text-[10px] uppercase text-indigo-300 font-bold">Status</span>
                              <span className="text-sm font-bold">{identifiedSpecies.sustainabilityStatus}</span>
                           </div>
                        </div>

                        <Button 
                          onClick={() => setSelectedSpecies(identifiedSpecies)}
                          className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-bold"
                        >
                          View Full Profile <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MAIN DETAIL CARD */}
          <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <CardHeader className="pb-0">
               <div className="flex justify-between items-start">
                  <div>
                     <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{selectedSpecies.name}</h2>
                     <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">{selectedSpecies.scientificName}</p>
                  </div>
                  <Badge className={cn(
                     "px-3 py-1 text-sm font-bold border-0",
                     selectedSpecies.sustainabilityStatus === "Good" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                     selectedSpecies.sustainabilityStatus === "Moderate" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                     "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                  )}>
                     {selectedSpecies.sustainabilityStatus} Status
                  </Badge>
               </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
               
               <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                  {selectedSpecies.description}
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                           <Anchor className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">Habitat Depth</span>
                     </div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{selectedSpecies.habitatDepth.min}</span>
                        <span className="text-slate-400 font-medium">to</span>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{selectedSpecies.habitatDepth.max}</span>
                        <span className="text-sm font-bold text-slate-500">meters</span>
                     </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                           <Thermometer className="h-5 w-5 text-orange-500" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">Optimal Temperature</span>
                     </div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{selectedSpecies.sstRange.min}</span>
                        <span className="text-slate-400 font-medium">to</span>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{selectedSpecies.sstRange.max}</span>
                        <span className="text-sm font-bold text-slate-500">°C</span>
                     </div>
                  </div>
               </div>

               {/* SPAWNING CALENDAR */}
               <div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                     <Calendar className="h-5 w-5 text-indigo-500" /> Spawning Season Calendar
                  </h3>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                     {monthNames.map((month, idx) => {
                        const isSpawning = selectedSpecies.spawningMonths.includes(idx + 1);
                        return (
                           <div key={month} className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                              isSpawning 
                                 ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105" 
                                 : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 opacity-60"
                           )}>
                              <span className="text-xs font-bold uppercase tracking-wider">{month}</span>
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* GEAR TAGS */}
               <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">Recommended Gear</span>
                  <div className="flex flex-wrap gap-2">
                     {selectedSpecies.recommendedGear.map(gear => (
                        <div key={gear} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700">
                           {gear}
                        </div>
                     ))}
                  </div>
               </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
