import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { teamName } = await req.json();

    console.log('Approving NOMAD access for team:', teamName);

    // Find the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('name', teamName)
      .single();

    if (teamError || !team) {
      throw new Error(`Team "${teamName}" not found`);
    }

    console.log('Found team:', team);

    // Find the NOMAD access request
    const { data: accessRequest, error: accessError } = await supabase
      .from('nomad_team_access')
      .select('id, approved')
      .eq('team_id', team.id)
      .single();

    if (accessError || !accessRequest) {
      throw new Error(`No NOMAD access request found for team "${teamName}"`);
    }

    if (accessRequest.approved) {
      return new Response(
        JSON.stringify({ success: true, message: `Team "${teamName}" already has NOMAD access` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Approving access request:', accessRequest.id);

    // Get an admin user to set as approved_by
    const { data: adminUser, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    // Approve the request
    const { error: updateError } = await supabase
      .from('nomad_team_access')
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
        approved_by: adminUser?.user_id || null,
        notes: 'Approved via admin script'
      })
      .eq('id', accessRequest.id);

    if (updateError) throw updateError;

    // Get member count
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id);

    console.log('NOMAD access approved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `NOMAD access approved for team "${teamName}"`,
        memberCount: memberCount || 0,
        details: `All ${memberCount || 0} team members now have NOMAD access`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
