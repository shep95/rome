import { lazy, Suspense } from 'react';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  ipAddress?: string;
  zoom?: number;
}

const LocationMap = lazy(() => 
  import('./LocationMap').then(module => ({ default: module.LocationMap }))
);

export const DynamicLocationMap = (props: LocationMapProps) => {
  return (
    <Suspense fallback={
      <div className="w-full h-[300px] rounded-lg overflow-hidden border border-border flex items-center justify-center bg-muted">
        <div className="text-sm text-muted-foreground">Loading map...</div>
      </div>
    }>
      <LocationMap {...props} />
    </Suspense>
  );
};
