-- Enable Realtime for slip_uploads table safely without throwing errors if already present
begin;
  do $$
  begin
    if not exists (
      select 1 
      from pg_publication_rel pr
      join pg_class c on pr.prrelid = c.oid
      join pg_publication p on pr.prpubid = p.oid
      where p.pubname = 'supabase_realtime' and c.relname = 'slip_uploads'
    ) then
      alter publication supabase_realtime add table slip_uploads;
    end if;
  end $$;
commit;
