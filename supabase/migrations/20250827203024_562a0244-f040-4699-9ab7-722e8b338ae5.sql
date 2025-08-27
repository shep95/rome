-- Create RPC to fetch counterparties for direct conversations visible to the current user
create or replace function public.get_direct_counterparties(conversation_ids uuid[])
returns table (
  conversation_id uuid,
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select cp.conversation_id,
         p.id,
         p.username,
         p.display_name,
         p.avatar_url
  from conversation_participants cp
  join conversation_participants cp2
    on cp.conversation_id = cp2.conversation_id
  join conversations c
    on c.id = cp.conversation_id
  join profiles p
    on p.id = cp2.user_id
  where cp.conversation_id = any(conversation_ids)
    and c.type = 'direct'
    and cp.user_id = auth.uid()
    and cp2.user_id <> auth.uid()
    and cp.left_at is null
    and cp2.left_at is null;
$$;

-- Optional: single conversation helper
create or replace function public.get_direct_counterparty(conversation_uuid uuid)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select p.id,
         p.username,
         p.display_name,
         p.avatar_url
  from conversation_participants cp
  join conversation_participants cp2
    on cp.conversation_id = cp2.conversation_id
  join conversations c
    on c.id = cp.conversation_id
  join profiles p
    on p.id = cp2.user_id
  where cp.conversation_id = conversation_uuid
    and c.type = 'direct'
    and cp.user_id = auth.uid()
    and cp2.user_id <> auth.uid()
    and cp.left_at is null
    and cp2.left_at is null
  limit 1;
$$;