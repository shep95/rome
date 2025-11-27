import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useNomadAccess = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = async () => {
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      // Use the database function to check if user has NOMAD access through any team
      const { data, error } = await supabase.rpc('user_has_nomad_access', {
        user_uuid: user.id
      });

      if (error) throw error;
      setHasAccess(data || false);
    } catch (error) {
      console.error('Error checking NOMAD access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();

    // Subscribe to changes in team membership and NOMAD access
    const teamMembersChannel = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          checkAccess();
        }
      )
      .subscribe();

    const nomadAccessChannel = supabase
      .channel('nomad-access-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nomad_team_access'
        },
        () => {
          checkAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(teamMembersChannel);
      supabase.removeChannel(nomadAccessChannel);
    };
  }, [user]);

  return { hasAccess, loading, refreshAccess: checkAccess };
};
