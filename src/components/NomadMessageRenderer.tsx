import { LocationMap } from './LocationMap';

interface NomadMessageRendererProps {
  content: string;
}

interface LocationData {
  ip?: string;
  lat: number;
  lon: number;
  city?: string;
  country?: string;
}

export const NomadMessageRenderer = ({ content }: NomadMessageRendererProps) => {
  // Parse content for location data
  const parseLocationData = (text: string): LocationData | null => {
    try {
      // Look for JSON blocks that contain latitude and longitude
      const jsonMatch = text.match(/\{[^{}]*"lat"[^{}]*"lon"[^{}]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.lat && data.lon) {
          return {
            ip: data.ip,
            lat: parseFloat(data.lat),
            lon: parseFloat(data.lon),
            city: data.city,
            country: data.country
          };
        }
      }

      // Also check for coordinate patterns in text like "Coordinates: 40.7128, -74.0060"
      const coordMatch = text.match(/(?:coordinates?|location):\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/i);
      if (coordMatch) {
        return {
          lat: parseFloat(coordMatch[1]),
          lon: parseFloat(coordMatch[2])
        };
      }

      return null;
    } catch {
      return null;
    }
  };

  const locationData = parseLocationData(content);

  // If location data found, render map + text
  if (locationData) {
    return (
      <div className="space-y-3">
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
        <LocationMap
          latitude={locationData.lat}
          longitude={locationData.lon}
          city={locationData.city}
          country={locationData.country}
          ipAddress={locationData.ip}
        />
      </div>
    );
  }

  // Default: just render text
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap">
      {content}
    </div>
  );
};
