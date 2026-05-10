-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  created_at timestamptz default now()
);

-- Stances
create table stances (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  topic text not null,
  category text not null,
  status text not null default 'empty' check (status in ('settled','evolving','undecided','empty')),
  my_stance text,
  why_i_hold_this text,
  strongest_counter text,
  my_rebuttal text,
  uncertainties text,
  life_impact text,
  sources text,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

-- Journal entries
create table journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'Untitled',
  content jsonb not null default '{}',
  tags text[] default '{}',
  word_count int default 0,
  linked_stances uuid[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notes
create table notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'Untitled',
  content jsonb not null default '{}',
  parent_id uuid references notes(id) on delete set null,
  tags text[] default '{}',
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents
create table documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  file_path text not null,
  file_type text not null,
  extracted_text text,
  summary text,
  tags text[] default '{}',
  source_url text,
  created_at timestamptz default now()
);

-- Row Level Security (enable on all tables)
alter table profiles enable row level security;
alter table stances enable row level security;
alter table journal_entries enable row level security;
alter table notes enable row level security;
alter table documents enable row level security;

-- RLS Policies (user can only access their own data)
create policy "Users can manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users can manage own stances" on stances for all using (auth.uid() = user_id);
create policy "Users can manage own journal entries" on journal_entries for all using (auth.uid() = user_id);
create policy "Users can manage own notes" on notes for all using (auth.uid() = user_id);
create policy "Users can manage own documents" on documents for all using (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Storage bucket for documents
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "Users can upload own documents" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own documents" on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own documents" on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
