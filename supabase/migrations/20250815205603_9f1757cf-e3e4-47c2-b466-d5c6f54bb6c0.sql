-- Create a function to create group conversations that handles RLS properly
CREATE OR REPLACE FUNCTION public.create_group_conversation(
  _name text,
  _settings jsonb DEFAULT '{}',
  _auto_delete_after interval DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  _conv_id uuid;
  _self uuid := auth.uid();
BEGIN
  IF _self IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create conversation as the current user
  INSERT INTO public.conversations (type, created_by, name, settings, auto_delete_after)
  VALUES ('group', _self, _name, _settings, _auto_delete_after)
  RETURNING id INTO _conv_id;

  -- Add creator as admin participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES (_conv_id, _self, 'admin');

  RETURN _conv_id;
END;
$function$