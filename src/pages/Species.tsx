import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockSpecies } from "@/services/mockData";
import { useState, useRef } from "react";
import { Search, Fish, Anchor, Thermometer, Calendar, Upload, Loader2, Camera, X, CheckCircle, ArrowRight } from "lucide-react";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Species() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState(mockSpecies[0]);
  
  // Fish Identifier State
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [identifiedSpecies, setIdentifiedSpecies] = useState<(typeof mockSpecies)[0] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIdentifiedSpecies(null);
    setAnalyzing(true);

    // Simulate analysis delay
    setTimeout(() => {
      setAnalyzing(false);
      // Mock identification logic: randomly pick a species or pick one that matches the file name if possible
      // For now, just pick a random one different from current if possible, or just the first one
      const randomSpecies = mockSpecies[Math.floor(Math.random() * mockSpecies.length)];
      setIdentifiedSpecies(randomSpecies);
    }, 2500);
  };

  const clearUpload = () => {
    setPreviewUrl(null);
    setIdentifiedSpecies(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredSpecies = mockSpecies.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Species List */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Species Library</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search species..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredSpecies.map((species) => (
              <button
                key={species.id}
                onClick={() => setSelectedSpecies(species)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedSpecies.id === species.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-foreground">{species.name}</p>
                  <Badge variant="outline">{species.code}</Badge>
                </div>
                <p className="text-xs text-muted-foreground italic">{species.scientificName}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Species Details & Identifier */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Fish Identifier Card */}
          <Card className="border-border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                AI Fish Identifier
              </CardTitle>
              <CardDescription>
                Upload a photo of your catch to identify the species instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!previewUrl ? (
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-sm mb-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG (Max 5MB)</p>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Image Preview */}
                  <div className="relative w-full sm:w-1/3 aspect-square sm:aspect-video rounded-lg overflow-hidden bg-black/5 border border-border">
                    <img 
                      src={previewUrl} 
                      alt="Uploaded catch" 
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={clearUpload}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Analysis Result */}
                  <div className="flex-1 flex flex-col justify-center">
                    {analyzing ? (
                      <div className="space-y-3 text-center sm:text-left">
                        <div className="flex items-center gap-2 text-primary font-medium">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing features...
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary animate-progress origin-left w-full"></div>
                        </div>
                        <p className="text-xs text-muted-foreground">Comparing with 50+ local species database</p>
                      </div>
                    ) : identifiedSpecies ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
                          <CheckCircle className="h-5 w-5" />
                          Match Found!
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{identifiedSpecies.name}</h3>
                          <p className="text-sm text-muted-foreground">{identifiedSpecies.scientificName}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-background">
                            {identifiedSpecies.code}
                          </Badge>
                          <Badge variant="secondary">
                            {identifiedSpecies.sustainabilityStatus}
                          </Badge>
                        </div>
                        <button 
                          onClick={() => setSelectedSpecies(identifiedSpecies)}
                          className="text-sm text-primary hover:underline font-medium mt-1 inline-flex items-center gap-1"
                        >
                          View Full Details <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Fish className="h-6 w-6 text-primary" />
                    {selectedSpecies.name}
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    {selectedSpecies.scientificName} • {selectedSpecies.code}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    selectedSpecies.sustainabilityStatus === "Good"
                      ? "default"
                      : selectedSpecies.sustainabilityStatus === "Moderate"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-sm"
                >
                  {selectedSpecies.sustainabilityStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{selectedSpecies.description}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Anchor className="h-4 w-4 text-primary" />
                    <span>Habitat Depth</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedSpecies.habitatDepth.min}m - {selectedSpecies.habitatDepth.max}m
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Thermometer className="h-4 w-4 text-primary" />
                    <span>SST Range</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedSpecies.sstRange.min}°C - {selectedSpecies.sstRange.max}°C
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Spawning Season</span>
                </div>
                <div className="grid grid-cols-12 gap-1">
                  {monthNames.map((month, idx) => (
                    <div
                      key={month}
                      className={`text-center p-2 rounded text-xs font-medium transition-colors ${
                        selectedSpecies.spawningMonths.includes(idx + 1)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {month}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Recommended Gear</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSpecies.recommendedGear.map((gear) => (
                    <Badge key={gear} variant="secondary">
                      {gear}
                    </Badge>
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
