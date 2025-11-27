import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapProps {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  ipAddress?: string;
  zoom?: number;
}

const MapContent = ({ 
  latitude, 
  longitude, 
  city, 
  country, 
  ipAddress,
  zoom = 10 
}: LocationMapProps) => {
  return (
    <MapContainer 
      center={[latitude, longitude]} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]}>
        <Popup>
          <div className="text-sm">
            {ipAddress && <div className="font-mono font-semibold">{ipAddress}</div>}
            {city && country && <div>{city}, {country}</div>}
            <div className="text-xs text-muted-foreground mt-1">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export const LocationMap = (props: LocationMapProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[300px] rounded-lg overflow-hidden border border-border flex items-center justify-center bg-muted">
        <div className="text-sm text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] rounded-lg overflow-hidden border border-border">
      <MapContent {...props} />
    </div>
  );
};
