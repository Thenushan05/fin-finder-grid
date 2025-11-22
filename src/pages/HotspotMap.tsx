import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Thermometer, Waves, Navigation, MapPin, AlertTriangle, CloudRain } from "lucide-react";
import { mockHotspots, mockWeatherHazards, type WeatherHazard } from "@/services/mockData";
import { useState, useEffect, useMemo, useCallback } from "react";
import Map, { Marker, Popup, Source, Layer, NavigationControl, FullscreenControl, ScaleControl, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { LineLayer } from 'react-map-gl';

// Haversine formula to calculate distance in Nautical Miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3440.065; // Radius of earth in Nautical Miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const routeLayer: LineLayer = {
  id: 'route',
  type: 'line',
  layout: {
    'line-join': 'round',
    'line-cap': 'round'
  },
  paint: {
    'line-color': '#ef4444',
    'line-width': 4,
    'line-opacity': 0.8
  }
};

export default function HotspotMap() {
  const [selectedHotspot, setSelectedHotspot] = useState(mockHotspots[0]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualDestination, setManualDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<WeatherHazard | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 81.0,  // Center between east and west of Sri Lanka
    latitude: 7.0,    // Center latitude of Sri Lanka's waters
    zoom: 7.5         // Show wider ocean area around Sri Lanka
  });

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Get User Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const destination = manualDestination || { lat: selectedHotspot.lat, lng: selectedHotspot.lng };

  const distance = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, destination.lat, destination.lng)
    : null;

  const routeGeoJSON = useMemo(() => {
    if (!userLocation) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [userLocation.lng, userLocation.lat],
          [destination.lng, destination.lat]
        ]
      }
    };
  }, [userLocation, destination]);

  const handleMapClick = (event: mapboxgl.MapLayerMouseEvent) => {
    const { lng, lat } = event.lngLat;
    setManualDestination({ lat, lng });
  };

  const handleHotspotSelect = (hotspot: typeof mockHotspots[0]) => {
    setSelectedHotspot(hotspot);
    setManualDestination(null);
    setViewState(prev => ({
      ...prev,
      longitude: hotspot.lng,
      latitude: hotspot.lat,
      zoom: 10,
      transitionDuration: 1000
    }));
  };

  if (!mapboxToken) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-lg border border-destructive">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-bold text-destructive">Mapbox Token Missing</h3>
        <p className="text-muted-foreground">Please add VITE_MAPBOX_TOKEN to your .env file.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Fish Hotspot Map</h2>
        <p className="text-muted-foreground">Interactive predictions for optimal fishing zones</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map Container */}
        <Card className="border-border lg:col-span-2 overflow-hidden">
          <CardContent className="p-0 h-[600px] relative">
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/outdoors-v12"
              mapboxAccessToken={mapboxToken}
              onClick={handleMapClick}
            >
              <NavigationControl position="top-right" />
              <FullscreenControl position="top-right" />
              <ScaleControl />

              {/* User Location Marker */}
              {userLocation && (
                <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                  <div className="relative flex items-center justify-center w-6 h-6" title="Your Current Location">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
                  </div>
                </Marker>
              )}

              {/* Hotspot Markers */}
              {mockHotspots.map((hotspot, idx) => (
                <Marker
                  key={idx}
                  longitude={hotspot.lng}
                  latitude={hotspot.lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleHotspotSelect(hotspot);
                  }}
                >
                  <div title={`${hotspot.species} Hotspot - ${(hotspot.probability * 100).toFixed(0)}% probability`}>
                    <MapPin
                      className={`h-8 w-8 transition-all cursor-pointer ${selectedHotspot === hotspot && !manualDestination
                        ? "text-primary scale-125 drop-shadow-lg"
                        : "text-primary/70 hover:scale-110"
                        }`}
                      fill="currentColor"
                    />
                  </div>
                </Marker>
              ))}

              {/* Selected Hotspot Popup */}
              {!manualDestination && (
                <Popup
                  longitude={selectedHotspot.lng}
                  latitude={selectedHotspot.lat}
                  anchor="top"
                  closeButton={false}
                  closeOnClick={false}
                  offset={10}
                >
                  <div className="p-1 text-center">
                    <p className="font-bold text-sm text-foreground">{selectedHotspot.species}</p>
                    <Badge variant={selectedHotspot.probability > 0.8 ? "default" : "secondary"} className="mt-1">
                      {(selectedHotspot.probability * 100).toFixed(0)}% Probability
                    </Badge>
                  </div>
                </Popup>
              )}

              {/* Manual Destination Marker */}
              {manualDestination && (
                <Marker longitude={manualDestination.lng} latitude={manualDestination.lat} anchor="bottom">
                  <div title="Custom Destination">
                    <MapPin className="h-8 w-8 text-destructive drop-shadow-md" fill="currentColor" />
                  </div>
                </Marker>
              )}

              {/* Route Line */}
              {routeGeoJSON && (
                <Source id="route" type="geojson" data={routeGeoJSON as any}>
                  <Layer {...routeLayer} />
                </Source>
              )}

              {/* Weather Hazards */}
              {mockWeatherHazards.map((hazard) => (
                <Marker
                  key={hazard.id}
                  longitude={hazard.lng}
                  latitude={hazard.lat}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedHazard(hazard);
                  }}
                >
                  <div
                    className={`relative cursor-pointer transition-transform hover:scale-110 ${hazard.severity === 'high' ? 'animate-pulse' : ''
                      }`}
                    title={`${hazard.type === 'storm' ? 'Storm Warning' : 'High Waves'} - ${hazard.severity.toUpperCase()} severity`}
                  >
                    {hazard.type === 'storm' ? (
                      <div className={`rounded-full p-2 ${hazard.severity === 'high' ? 'bg-red-500' :
                        hazard.severity === 'medium' ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }`}>
                        <CloudRain className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <div className={`rounded-full p-2 ${hazard.severity === 'high' ? 'bg-blue-700' :
                        hazard.severity === 'medium' ? 'bg-blue-500' :
                          'bg-blue-300'
                        }`}>
                        <Waves className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                </Marker>
              ))}

              {/* Weather Hazard Popup */}
              {selectedHazard && (
                <Popup
                  longitude={selectedHazard.lng}
                  latitude={selectedHazard.lat}
                  anchor="bottom"
                  closeButton={true}
                  closeOnClick={false}
                  onClose={() => setSelectedHazard(null)}
                  offset={15}
                >
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedHazard.type === 'storm' ? (
                        <CloudRain className="h-5 w-5 text-red-500" />
                      ) : (
                        <Waves className="h-5 w-5 text-blue-500" />
                      )}
                      <p className="font-bold text-sm text-foreground">
                        {selectedHazard.type === 'storm' ? 'Storm Warning' : 'High Waves'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{selectedHazard.description}</p>
                    <div className="flex flex-col gap-1">
                      <Badge variant={
                        selectedHazard.severity === 'high' ? 'destructive' :
                          selectedHazard.severity === 'medium' ? 'default' :
                            'secondary'
                      } className="w-fit">
                        {selectedHazard.severity.toUpperCase()} Severity
                      </Badge>
                      {selectedHazard.windSpeed && (
                        <p className="text-xs text-foreground">Wind: {selectedHazard.windSpeed} knots</p>
                      )}
                      {selectedHazard.waveHeight && (
                        <p className="text-xs text-foreground">Wave Height: {selectedHazard.waveHeight}m</p>
                      )}
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          </CardContent>
        </Card>

        {/* Hotspot Details */}
        <div className="space-y-4">
          {/* Navigation Info */}
          <Card className="border-border bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Start Point</span>
                  <Badge variant="outline" className="bg-background">
                    {userLocation ? "Current Location" : "Waiting for GPS..."}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Destination</span>
                  <Badge variant={manualDestination ? "destructive" : "default"}>
                    {manualDestination ? "Manual Selection" : selectedHotspot.species + " Hotspot"}
                  </Badge>
                </div>
                {distance !== null && (
                  <div className="mt-4 p-3 bg-background rounded-lg border border-border text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Distance</p>
                    <p className="text-2xl font-bold text-primary">{distance.toFixed(1)} NM</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Selected Hotspot</CardTitle>
              <CardDescription>Environmental conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="text-lg font-semibold text-foreground">
                  {selectedHotspot.lat.toFixed(3)}°N, {selectedHotspot.lng.toFixed(3)}°E
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Target Species</p>
                <Badge variant="default" className="text-base">{selectedHotspot.species}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Catch Probability</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${selectedHotspot.probability * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {(selectedHotspot.probability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-accent">
                  <Waves className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Depth</p>
                    <p className="font-medium text-foreground">{selectedHotspot.depth}m</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg bg-accent">
                  <Thermometer className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">SST</p>
                    <p className="font-medium text-foreground">{selectedHotspot.sst}°C</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg bg-accent">
                  <Droplets className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Chlorophyll</p>
                    <p className="font-medium text-foreground">{selectedHotspot.chl} mg/m³</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">All Hotspots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockHotspots.map((hotspot, idx) => (
                <button
                  key={idx}
                  onClick={() => handleHotspotSelect(hotspot)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedHotspot === hotspot && !manualDestination
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-accent"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{hotspot.species}</p>
                      <p className="text-xs text-muted-foreground">
                        {hotspot.lat.toFixed(2)}°N, {hotspot.lng.toFixed(2)}°E
                      </p>
                    </div>
                    <Badge variant="outline">{(hotspot.probability * 100).toFixed(0)}%</Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
