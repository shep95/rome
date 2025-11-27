interface LocationMapProps {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  ipAddress?: string;
  zoom?: number;
}

export const LocationMap = ({ 
  latitude, 
  longitude, 
  city, 
  country, 
  ipAddress 
}: LocationMapProps) => {
  // OpenStreetMap static image URL
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.1},${latitude-0.1},${longitude+0.1},${latitude+0.1}&layer=mapnik&marker=${latitude},${longitude}`;
  
  return (
    <div className="w-full rounded-lg overflow-hidden border border-border bg-muted/30">
      {/* Map iframe */}
      <iframe
        width="100%"
        height="300"
        frameBorder="0"
        scrolling="no"
        src={mapUrl}
        className="w-full"
        title="Location Map"
      />
      
      {/* Location details overlay */}
      <div className="p-3 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="space-y-1 text-sm">
          {ipAddress && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">IP:</span>
              <span className="font-mono font-semibold text-foreground">{ipAddress}</span>
            </div>
          )}
          {city && country && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Location:</span>
              <span className="text-foreground">{city}, {country}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Coordinates:</span>
            <span className="font-mono text-xs text-foreground">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
