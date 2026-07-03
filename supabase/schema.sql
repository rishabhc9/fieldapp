-- Run this in Supabase Dashboard > SQL Editor (one click, "Run").
-- It creates everything the app needs: the doctors lookup table,
-- the submissions table, search indexes, and locks both tables down
-- with Row Level Security so they're only reachable through this
-- app's server-side API routes (which use the service role key).

-- Needed for fast fuzzy/partial name search on 14k+ rows
create extension if not exists pg_trgm;

-- 1. Doctors lookup table (seeded from your Excel sheet)
create table if not exists doctors (
  id bigint generated always as identity primary key,
  name text not null
);

create index if not exists doctors_name_trgm_idx
  on doctors using gin (name gin_trgm_ops);

alter table doctors enable row level security;
-- No public policies are added on purpose: the app's API routes use
-- the Supabase service role key, which always bypasses RLS. Nothing
-- can read this table directly from a browser.

-- 2. Submissions table (one row per form submission)
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  so_hq text not null,
  so_name text not null,
  dr_name text not null,
  brand text not null,
  photo_path text,
  created_at timestamptz not null default now()
);

create index if not exists submissions_created_at_idx
  on submissions (created_at desc);

alter table submissions enable row level security;
-- Same as above: no public policies. Only the server-side API routes
-- (using the service role key) can read or write this table, and
-- those routes require either nothing (public submit) or the admin
-- session cookie (admin read), enforced in application code.
