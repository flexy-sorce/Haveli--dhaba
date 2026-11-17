-- Haveli Dhaba schema. Based on bookings-schema.sql (profiles renamed admin_profiles; public INSERT policies removed:
-- public submissions go through the server API using the service role, so anon has NO access to booking tables).
create extension if not exists pgcrypto;
create type booking_status as enum ('pending','contacted','confirmed','rejected','cancelled','completed');
create function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;

create table admin_profiles(id uuid primary key references auth.users on delete cascade, role text not null default 'admin' check(role in('admin','staff')), created_at timestamptz not null default now());
create function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from admin_profiles where id=auth.uid()) $$;

create table menu_categories(id uuid primary key default gen_random_uuid(), name text not null unique check(char_length(name) between 1 and 80), sort_order int not null default 0, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table menu_items(id uuid primary key default gen_random_uuid(), category_id uuid not null references menu_categories on delete cascade, name text not null check(char_length(name) between 1 and 120), price numeric(8,2) check(price is null or price>=0), sort_order int not null default 0, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(category_id,name));
create index on menu_items(category_id,sort_order);
create table gallery_images(id uuid primary key default gen_random_uuid(), storage_path text not null, caption text check(char_length(caption)<=200), alt_text text check(char_length(alt_text)<=200), sort_order int not null default 0, is_active boolean not null default true, created_at timestamptz not null default now());
create table site_settings(key text primary key check(key ~ '^[a-z_]+$'), value jsonb not null, updated_at timestamptz not null default now());

create table table_bookings(id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 full_name text not null check(char_length(full_name) between 2 and 100), phone text not null check(phone ~ '^[6-9][0-9]{9}$'),
 booking_date date not null, preferred_time time not null, guests int not null check(guests between 1 and 100), seating text not null check(seating in('Indoor','Outdoor')),
 special_requests text check(char_length(special_requests)<=500), status booking_status not null default 'pending', internal_notes text);
create table venue_enquiries(id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 full_name text not null check(char_length(full_name) between 2 and 100), phone text not null check(phone ~ '^[6-9][0-9]{9}$'),
 event_type text not null check(event_type in('Birthday','Wedding Function','Family Gathering','Corporate Event','Private Party','Other')),
 preferred_date date not null, alternative_date date, guests int not null check(guests>=1), duration text not null check(char_length(duration)<=100),
 requirements text check(char_length(requirements)<=1000), message text check(char_length(message)<=1000), status booking_status not null default 'pending', internal_notes text);
create index on table_bookings(status,booking_date);create index on table_bookings(phone);
create index on venue_enquiries(status,preferred_date);create index on venue_enquiries(phone);
do $$ declare t text; begin foreach t in array array['menu_categories','menu_items','site_settings','table_bookings','venue_enquiries'] loop
 execute format('create trigger %I_upd before update on %I for each row execute function set_updated_at()',t,t); end loop; end $$;

alter table admin_profiles enable row level security; alter table menu_categories enable row level security; alter table menu_items enable row level security;
alter table gallery_images enable row level security; alter table site_settings enable row level security; alter table table_bookings enable row level security; alter table venue_enquiries enable row level security;
create policy "own profile" on admin_profiles for select to authenticated using(id=auth.uid());
create policy "public read" on menu_categories for select to anon,authenticated using(is_active);
create policy "public read" on menu_items for select to anon,authenticated using(is_active);
create policy "public read" on gallery_images for select to anon,authenticated using(is_active);
create policy "public read" on site_settings for select to anon,authenticated using(true);
create policy "admin all" on menu_categories for all to authenticated using(is_admin()) with check(is_admin());
create policy "admin all" on menu_items for all to authenticated using(is_admin()) with check(is_admin());
create policy "admin all" on gallery_images for all to authenticated using(is_admin()) with check(is_admin());
create policy "admin all" on site_settings for all to authenticated using(is_admin()) with check(is_admin());
create policy "admin all" on table_bookings for all to authenticated using(is_admin()) with check(is_admin());
create policy "admin all" on venue_enquiries for all to authenticated using(is_admin()) with check(is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('gallery','gallery',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict do nothing;
create policy "gallery public read" on storage.objects for select using(bucket_id='gallery');
create policy "gallery admin write" on storage.objects for all to authenticated using(bucket_id='gallery' and is_admin()) with check(bucket_id='gallery' and is_admin());

insert into site_settings(key,value) values
('phone','"077619 87706"'),('phone_tel','"+917761987706"'),
('address','"MC53+X7, Near NH-33, Near Vaishnu Devi Mandir, Ulda, Jharkhand 832304, India"'),
('hours','"Open 24 Hours"'),('instagram','"https://www.instagram.com/haveli.dhaba?srtk=aTlmcm95cjY0MHlt"'),
('rating','4.1'),('review_count','1256'),('hero_headline','"Where Tradition Meets Taste"'),
('hero_text','"Discover authentic Indian flavours, warm hospitality, and memorable family dining at Haveli Dhaba."') on conflict do nothing;
