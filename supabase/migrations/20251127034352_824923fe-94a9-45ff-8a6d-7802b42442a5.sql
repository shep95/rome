-- Manually approve zorak_corp team for NOMAD access
UPDATE nomad_team_access 
SET 
  approved = true,
  approved_at = NOW(),
  notes = 'Manually approved by system'
WHERE id = '80a0c0ca-339b-402d-8d54-06c2e95007bc';