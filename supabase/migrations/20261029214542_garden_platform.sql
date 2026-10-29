-- Private data API: public visitors use the validated Edge Function, never these tables.
create table public.bookings (
 id uuid primary key, name text not null, email text not null, phone text not null,
 postcode text not null, address text not null, service text not null, date date not null,
 time text not null check (time in ('09:00','11:00','14:00')), size text not null,
 notes text not null default '', status text not null default 'new' check (status in ('new','reviewing','accepted','declined','completed')),
 demo integer not null default 1 check (demo in (0,1)), created timestamptz not null default now(), updated timestamptz not null default now(),
 assignee text not null default '', internal_notes text not null default ''
);
create unique index accepted_visit_window on public.bookings(date,time) where status in ('accepted','completed');
create index bookings_created_idx on public.bookings(created desc);
create table public.photos(id uuid primary key,booking_id uuid not null references public.bookings(id) on delete cascade,storage_key text not null unique,mime text not null,bytes integer not null check(bytes>0 and bytes<=1100000));
create index photos_booking_idx on public.photos(booking_id);
create table public.content(key text primary key,draft text not null,published text not null,updated timestamptz not null default now());
create table public.revisions(id uuid primary key,key text not null,value text not null,actor text not null,created timestamptz not null default now());
create index revisions_key_created_idx on public.revisions(key,created desc);
create table public.members(email text primary key,role text not null check(role in ('editor','admin')),created timestamptz not null default now());
create table public.availability(date date primary key,closed integer not null default 0 check(closed in (0,1)),note text not null default '');
create table public.requests(id uuid primary key,ip_hash text not null,created timestamptz not null default now());
create index requests_hash_created_idx on public.requests(ip_hash,created);
create table public.audit(id uuid primary key,actor text not null,action text not null,target text not null,created timestamptz not null default now());
alter table public.bookings enable row level security;
alter table public.photos enable row level security;
alter table public.content enable row level security;
alter table public.revisions enable row level security;
alter table public.members enable row level security;
alter table public.availability enable row level security;
alter table public.requests enable row level security;
alter table public.audit enable row level security;
revoke all on public.bookings,public.photos,public.content,public.revisions,public.members,public.availability,public.requests,public.audit from anon,authenticated;
grant all on public.bookings,public.photos,public.content,public.revisions,public.members,public.availability,public.requests,public.audit to service_role;

-- Called only by the Edge Function's service role; invoker privileges remain in force.
create function public.create_garden_booking(booking jsonb,photo_rows jsonb,network_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare existing_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(network_hash,0));
 select id into existing_id from public.bookings where id=(booking->>'id')::uuid;
 if existing_id is not null then return jsonb_build_object('id',existing_id); end if;
 if (select count(*) from public.requests where ip_hash=network_hash and created>now()-interval '1 hour')>=5 then raise exception 'RATE_LIMIT'; end if;
 if exists(select 1 from public.availability where date=(booking->>'date')::date and closed=1) or exists(select 1 from public.bookings where date=(booking->>'date')::date and time=booking->>'time' and status in ('accepted','completed')) then raise exception 'UNAVAILABLE'; end if;
 insert into public.bookings select * from jsonb_populate_record(null::public.bookings,booking);
 if jsonb_array_length(photo_rows)>0 then insert into public.photos select * from jsonb_populate_recordset(null::public.photos,photo_rows); end if;
 insert into public.requests(id,ip_hash,created) values(gen_random_uuid(),network_hash,now());
 delete from public.requests where created<now()-interval '2 days';
 return jsonb_build_object('id',booking->>'id');
end $$;
revoke execute on function public.create_garden_booking(jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_garden_booking(jsonb,jsonb,text) to service_role;

create function public.save_garden_content(content_key text,next_value text,action_name text,default_value text,actor_email text)
returns void language plpgsql security invoker set search_path='' as $$
declare old public.content%rowtype; new_draft text;
begin
 insert into public.content(key,draft,published,updated) values(content_key,default_value,default_value,now()) on conflict(key) do nothing;
 select * into old from public.content where key=content_key for update;
 new_draft=case when action_name='publish' then old.draft else next_value end;
 insert into public.revisions(id,key,value,actor,created) values(gen_random_uuid(),content_key,case when action_name='publish' then old.published else old.draft end,actor_email,now());
 update public.content set draft=new_draft,published=case when action_name='publish' then new_draft else old.published end,updated=now() where key=content_key;
end $$;
revoke execute on function public.save_garden_content(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.save_garden_content(text,text,text,text,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('garden-photos','garden-photos',false,1100000,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
