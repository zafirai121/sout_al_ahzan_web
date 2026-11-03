-- Tightening two Row Level Security policies (run once in Supabase → SQL Editor).
-- Everything else checked on 2026-11-03 was already right: favorites and
-- playlists are each account's own, every write is bound to auth.uid(), and
-- the tables with no policy are closed to everyone but the service role.
--
-- 1. follows was readable by anyone: which account follows which reciter.
--    No app or page reads anyone's follows but their own, so each account now
--    sees only its own.
-- 2. A new track (audio_library) could be added with any file link and any
--    listen count. Every app uploads through /api/upload, which stores the
--    file under https://soutalahzan.com/user_uploads/<the account's id>/, and
--    none sends a listen count; so a new row must point to the account's own
--    upload and start with no listens of its own.
--
-- All in one transaction: if any line fails, nothing changes.

begin;

drop policy "Follows are public" on public.follows;
create policy "Users see their own follows" on public.follows
  for select to authenticated
  using (follower_id = (select auth.uid()));

drop policy "Users add tracks as themselves" on public.audio_library;
create policy "Users add tracks as themselves" on public.audio_library
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and file_url like 'https://soutalahzan.com/user_uploads/' || (select auth.uid())::text || '/%'
    and coalesce(listen_count, 0) = 0
  );

commit;

-- To undo (only if an upload or a follow stops working):
-- begin;
-- drop policy "Users see their own follows" on public.follows;
-- create policy "Follows are public" on public.follows for select to public using (true);
-- drop policy "Users add tracks as themselves" on public.audio_library;
-- create policy "Users add tracks as themselves" on public.audio_library
--   for insert to authenticated with check (user_id = (select auth.uid()));
-- commit;
