-- ADUJI starter schema. Run in Supabase Dashboard > SQL Editor.
-- Keep Row Level Security enabled. Never put a service-role/secret key in the browser.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 30),
  display_name text not null default 'ADUJI Creator',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caption text not null default '',
  category text not null default 'Trending',
  video_path text not null,
  video_url text,
  thumbnail_url text,
  visibility text not null default 'public' check (visibility in ('public','unlisted','private')),
  status text not null default 'published' check (status in ('processing','published','removed')),
  created_at timestamptz not null default now()
);
create index if not exists videos_feed_idx on public.videos (visibility, status, created_at desc);
create index if not exists videos_user_idx on public.videos (user_id, created_at desc);

create table if not exists public.video_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id),
  check (follower_id <> creator_id)
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists comments_video_idx on public.comments (video_id, created_at asc);

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.video_likes enable row level security;
alter table public.follows enable row level security;
alter table public.comments enable row level security;

create policy "Profiles are readable" on public.profiles for select using (true);
create policy "Users create their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Public published videos are readable" on public.videos for select using ((visibility = 'public' and status = 'published') or auth.uid() = user_id);
create policy "Authenticated users publish their own videos" on public.videos for insert to authenticated with check (auth.uid() = user_id);
create policy "Owners update their videos" on public.videos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners delete their videos" on public.videos for delete to authenticated using (auth.uid() = user_id);
create policy "Likes are readable" on public.video_likes for select using (true);
create policy "Users like as themselves" on public.video_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users remove their likes" on public.video_likes for delete to authenticated using (auth.uid() = user_id);
create policy "Follows are readable" on public.follows for select using (true);
create policy "Users follow as themselves" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "Users unfollow as themselves" on public.follows for delete to authenticated using (auth.uid() = follower_id);
create policy "Comments are readable" on public.comments for select using (true);
create policy "Authenticated users comment as themselves" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete their own comments" on public.comments for delete to authenticated using (auth.uid() = user_id);

-- Private-by-default video storage is preferable. Public read is enabled here for published-video URLs;
-- upload and delete remain restricted to the authenticated user's own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('aduji-videos', 'aduji-videos', true, 524288000, array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "Published video files are publicly readable" on storage.objects for select using (bucket_id = 'aduji-videos');
create policy "Users upload into their own folder" on storage.objects for insert to authenticated with check (bucket_id = 'aduji-videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update files in their own folder" on storage.objects for update to authenticated using (bucket_id = 'aduji-videos' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'aduji-videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete files in their own folder" on storage.objects for delete to authenticated using (bucket_id = 'aduji-videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Create profile row automatically after sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username',''), 'creator_' || substr(new.id::text,1,8)),
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), 'ADUJI Creator'))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
