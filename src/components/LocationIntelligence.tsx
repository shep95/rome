import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Search, Loader2, Building, Globe, Map, Camera } from 'lucide-react';

interface LocationData {
  address: string;
  lat: number;
  lon: number;
  displayName: string;
  type: string;
  importance: number;
  addressDetails: {
    road?: string;
    house_number?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    country_code?: string;
  };
  boundingBox: number[];
  osm_id: number;
  osm_type: string;
}

export const LocationIntelligence = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!address.trim()) {
      toast({
        title: "Error",
        description: "Please enter an address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Use Nominatim API for geocoding (OpenStreetMap's free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(address)}` +
        `&format=json` +
        `&addressdetails=1` +
        `&limit=1` +
        `&polygon_geojson=1`,
        {
          headers: {
            'User-Agent': 'SecureLink-OSINT-Tool'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      if (data.length === 0) {
        toast({
          title: "Not Found",
          description: "Could not find the specified address. Try being more specific.",
          variant: "destructive"
        });
        setLocationData(null);
        return;
      }

      const result = data[0];
      setLocationData({
        address: address,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        displayName: result.display_name,
        type: result.type,
        importance: result.importance,
        addressDetails: result.address || {},
        boundingBox: result.boundingbox,
        osm_id: result.osm_id,
        osm_type: result.osm_type
      });

      toast({
        title: "Location Found",
        description: "Location intelligence data retrieved successfully"
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
      toast({
        title: "Error",
        description: "Failed to retrieve location data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getMapUrl = () => {
    if (!locationData) return '';
    const { lat, lon } = locationData;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}`;
  };

  const getStreetViewUrl = () => {
    if (!locationData) return '';
    const { lat, lon } = locationData;
    // Mapillary street view (free alternative to Google Street View)
    return `https://www.mapillary.com/app/?lat=${lat}&lng=${lon}&z=17`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <MapPin className="w-8 h-8" />
          Location Intelligence OSINT
        </h1>
        <p className="text-muted-foreground">
          Enter any address worldwide to get comprehensive location intelligence
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter address (e.g., 1600 Pennsylvania Avenue NW, Washington, DC)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {locationData && (
        <Tabs defaultValue="coordinates" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="coordinates">
              <Map className="w-4 h-4 mr-2" />
              Map & Coordinates
            </TabsTrigger>
            <TabsTrigger value="property">
              <Building className="w-4 h-4 mr-2" />
              Property Details
            </TabsTrigger>
            <TabsTrigger value="area">
              <Globe className="w-4 h-4 mr-2" />
              Area Intelligence
            </TabsTrigger>
            <TabsTrigger value="imagery">
              <Camera className="w-4 h-4 mr-2" />
              Street View
            </TabsTrigger>
          </TabsList>

          {/* Coordinates & Map Tab */}
          <TabsContent value="coordinates" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Location & Coordinates</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Display Name</p>
                  <p className="font-mono text-sm">{locationData.displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="secondary">{locationData.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Latitude</p>
                  <p className="font-mono">{locationData.lat.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Longitude</p>
                  <p className="font-mono">{locationData.lon.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Decimal Degrees</p>
                  <p className="font-mono text-xs">{locationData.lat.toFixed(8)}, {locationData.lon.toFixed(8)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Importance Score</p>
                  <p className="font-mono">{(locationData.importance * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* Interactive Map */}
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Interactive Map</p>
                <iframe
                  width="100%"
                  height="400"
                  frameBorder="0"
                  scrolling="no"
                  src={getMapUrl()}
                  className="w-full rounded-lg border border-border"
                  title="Location Map"
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${locationData.lat}&mlon=${locationData.lon}#map=17/${locationData.lat}/${locationData.lon}`, '_blank')}
                  >
                    Open in OpenStreetMap
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://www.google.com/maps?q=${locationData.lat},${locationData.lon}`, '_blank')}
                  >
                    Open in Google Maps
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Property Details Tab */}
          <TabsContent value="property" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Property & Address Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {locationData.addressDetails.house_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">House Number</p>
                    <p className="font-semibold">{locationData.addressDetails.house_number}</p>
                  </div>
                )}
                {locationData.addressDetails.road && (
                  <div>
                    <p className="text-sm text-muted-foreground">Street</p>
                    <p className="font-semibold">{locationData.addressDetails.road}</p>
                  </div>
                )}
                {locationData.addressDetails.city && (
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-semibold">{locationData.addressDetails.city}</p>
                  </div>
                )}
                {locationData.addressDetails.state && (
                  <div>
                    <p className="text-sm text-muted-foreground">State/Region</p>
                    <p className="font-semibold">{locationData.addressDetails.state}</p>
                  </div>
                )}
                {locationData.addressDetails.postcode && (
                  <div>
                    <p className="text-sm text-muted-foreground">Postal Code</p>
                    <p className="font-semibold">{locationData.addressDetails.postcode}</p>
                  </div>
                )}
                {locationData.addressDetails.country && (
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-semibold">{locationData.addressDetails.country}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">OSM ID</p>
                  <p className="font-mono text-sm">{locationData.osm_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">OSM Type</p>
                  <Badge>{locationData.osm_type}</Badge>
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Note:</p>
                <p className="text-xs">
                  Property value, building year, and ownership data require premium APIs or government databases. 
                  Consider using services like Zillow API, Redfin, or local property records for detailed property information.
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Area Intelligence Tab */}
          <TabsContent value="area" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Area Intelligence</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bounding Box</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div>Min Lat: {locationData.boundingBox[0].toFixed(6)}</div>
                    <div>Max Lat: {locationData.boundingBox[1].toFixed(6)}</div>
                    <div>Min Lon: {locationData.boundingBox[2].toFixed(6)}</div>
                    <div>Max Lon: {locationData.boundingBox[3].toFixed(6)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Location Classification</p>
                  <Badge variant="outline" className="mr-2">{locationData.type}</Badge>
                  <Badge variant="outline">Importance: {(locationData.importance * 10).toFixed(1)}/10</Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Nearby Search</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent('restaurant near ' + locationData.displayName)}`, '_blank')}
                    >
                      Restaurants
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent('school near ' + locationData.displayName)}`, '_blank')}
                    >
                      Schools
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent('hospital near ' + locationData.displayName)}`, '_blank')}
                    >
                      Hospitals
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Premium Data Available:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Demographics data (Census API)</li>
                    <li>• Crime statistics (FBI Crime Data API)</li>
                    <li>• Property market trends (Zillow, Redfin APIs)</li>
                    <li>• Weather patterns (OpenWeatherMap API)</li>
                    <li>• Business intelligence (Yelp, Google Places API)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Street View Tab */}
          <TabsContent value="imagery" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Street View & Imagery</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Satellite View</p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://www.google.com/maps/@${locationData.lat},${locationData.lon},100m/data=!3m1!1e3`, '_blank')}
                  >
                    Open Google Earth View
                  </Button>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Street Level Imagery</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(getStreetViewUrl(), '_blank')}
                    >
                      Open Mapillary
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${locationData.lat},${locationData.lon}`, '_blank')}
                    >
                      Google Street View
                    </Button>
                  </div>
                </div>

                <div className="aspect-video bg-muted rounded-lg border border-border overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${locationData.lon-0.002},${locationData.lat-0.002},${locationData.lon+0.002},${locationData.lat+0.002}&layer=mapnik`}
                    title="Area View"
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Additional Imagery Sources:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Mapillary - Crowdsourced street-level imagery</li>
                    <li>• Google Street View - Professional street imagery</li>
                    <li>• Bing Birds Eye - Aerial imagery at 45° angles</li>
                    <li>• Planet Labs - Recent satellite imagery (API)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Info Card */}
      {!locationData && (
        <Card className="p-6 text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Enter an address to retrieve comprehensive location intelligence</p>
          <p className="text-sm mt-2">
            This tool uses OpenStreetMap's Nominatim API for free geocoding worldwide
          </p>
        </Card>
      )}
    </div>
  );
};