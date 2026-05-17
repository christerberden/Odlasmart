create or replace function public.create_workspace_for_current_user(
  workspace_name text,
  workspace_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_workspace_id uuid;
  normalized_name text := nullif(trim(workspace_name), '');
  normalized_slug text := lower(
    regexp_replace(nullif(trim(workspace_slug), ''), '[^a-z0-9-]+', '-', 'g')
  );
begin
  if current_user_id is null then
    raise exception 'Authentication is required to create a workspace.';
  end if;

  if normalized_name is null then
    raise exception 'Workspace name is required.';
  end if;

  if normalized_slug is null then
    normalized_slug := lower(regexp_replace(normalized_name, '[^a-z0-9]+', '-', 'g'));
  end if;

  normalized_slug := trim(both '-' from normalized_slug);

  if normalized_slug = '' then
    normalized_slug := 'odling';
  end if;

  insert into public.workspaces (name, slug)
  values (normalized_name, normalized_slug)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, current_user_id, 'owner');

  insert into public.workspace_preferences (workspace_id, active_year)
  values (new_workspace_id, extract(year from now())::int);

  return new_workspace_id;
end;
$$;

grant execute on function public.create_workspace_for_current_user(text, text)
to authenticated;
