-- Secure function to create a direct conversation and add both participants
CREATE OR REPLACE FUNCTION public.create_direct_conversation(
  _other_user_id uuid,
  _name text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  _conv_id uuid;
  _self uuid := auth.uid();
BEGIN
  IF _self IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Return existing direct conversation if both are already participants
  SELECT c.id INTO _conv_id
  FROM public.conversations c
  JOIN public.conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = _self AND p1.left_at IS NULL
  JOIN public.conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = _other_user_id AND p2.left_at IS NULL
  WHERE c.type = 'direct'
  LIMIT 1;

  IF _conv_id IS NOT NULL THEN
    RETURN _conv_id;
  END IF;

  -- Create conversation as the current user
  INSERT INTO public.conversations (type, created_by, name)
  VALUES ('direct', _self, COALESCE(_name, ''))
  RETURNING id INTO _conv_id;

  -- Add both participants
  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES (_conv_id, _self, 'member'),
         (_conv_id, _other_user_id, 'member');

  RETURN _conv_id;
END;
$$;