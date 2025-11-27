import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Geocoding address:', address);

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
          'User-Agent': 'SecureLink-NOMAD-OSINT'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (data.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Location not found',
          message: 'Could not find the specified address. Try being more specific.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data[0];
    
    const locationData = {
      address: address,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name,
      type: result.type,
      importance: result.importance,
      addressDetails: result.address || {},
      boundingBox: result.boundingbox,
      osm_id: result.osm_id,
      osm_type: result.osm_type,
      // Add useful URLs
      osmUrl: `https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}#map=17/${result.lat}/${result.lon}`,
      googleMapsUrl: `https://www.google.com/maps?q=${result.lat},${result.lon}`,
      streetViewUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${result.lat},${result.lon}`,
      mapillaryUrl: `https://www.mapillary.com/app/?lat=${result.lat}&lng=${result.lon}&z=17`
    };

    console.log('Location data retrieved successfully');

    return new Response(
      JSON.stringify({ success: true, data: locationData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in location-osint function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve location data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});