-- ================================================
-- SFI Tutor - Database Schema
-- Run this in Supabase SQL Editor
-- ================================================

-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- ================================================
-- Profiles (extends Supabase auth.users)
-- ================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  current_level text check (current_level in ('sfi_c', 'sfi_d', 'sas_grund', 'sas_1', 'sas_2', 'sas_3')),
  target_level text check (target_level in ('sfi_c', 'sfi_d', 'sas_grund', 'sas_1', 'sas_2', 'sas_3')),
  daily_minutes integer default 30,
  study_intensity text default 'medium' check (study_intensity in ('low', 'medium', 'high', 'extreme')),
  exam_date date,
  study_streak integer default 0,
  last_study_date date,
  locale text default 'en' check (locale in ('en', 'zh')),
  telegram_chat_id bigint unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================
-- Documents (uploaded study materials)
-- ================================================
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  file_url text not null,
  file_type text, -- 'pdf', 'image', 'text'
  file_size bigint,
  status text default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'error')),
  level text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can manage own documents"
  on public.documents for all
  using (auth.uid() = user_id);

-- ================================================
-- Document Chunks (for RAG)
-- ================================================
create table public.document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  content text not null,
  embedding vector(768), -- text-embedding-004 outputs 768d
  chapter text,
  page integer,
  chunk_index integer,
  created_at timestamptz default now()
);

alter table public.document_chunks enable row level security;

create policy "Users can view own document chunks"
  on public.document_chunks for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_chunks.document_id
      and d.user_id = auth.uid()
    )
  );

-- Vector similarity search function
create or replace function match_document_chunks(
  query_embedding vector(768),
  match_count int default 5,
  filter_document_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chapter text,
  page integer,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chapter,
    dc.page,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where (filter_document_id is null or dc.document_id = filter_document_id)
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ================================================
-- Study Plans
-- ================================================
create table public.study_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  level text not null,
  start_date date default current_date,
  end_date date,
  status text default 'active' check (status in ('active', 'completed', 'paused')),
  plan_data jsonb default '{}', -- AI-generated plan structure
  created_at timestamptz default now()
);

alter table public.study_plans enable row level security;

create policy "Users can manage own study plans"
  on public.study_plans for all
  using (auth.uid() = user_id);

-- ================================================
-- Daily Tasks
-- ================================================
create table public.daily_tasks (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.study_plans(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  task_type text not null check (task_type in ('vocabulary', 'reading', 'grammar', 'writing', 'review')),
  content jsonb not null, -- task details
  duration_minutes integer default 15,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.daily_tasks enable row level security;

create policy "Users can manage own daily tasks"
  on public.daily_tasks for all
  using (auth.uid() = user_id);

-- ================================================
-- Flashcards
-- ================================================
create table public.flashcards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  document_id uuid references public.documents(id) on delete set null,
  front text not null,
  back text not null,
  card_type text default 'vocabulary' check (card_type in ('vocabulary', 'grammar', 'sentence')),
  tags text[] default '{}',
  -- SM-2 fields
  easiness_factor real default 2.5,
  interval integer default 0, -- days
  repetitions integer default 0,
  next_review date default current_date,
  created_at timestamptz default now()
);

alter table public.flashcards enable row level security;

create policy "Users can manage own flashcards"
  on public.flashcards for all
  using (auth.uid() = user_id);

-- ================================================
-- Flashcard Reviews (history)
-- ================================================
create table public.flashcard_reviews (
  id uuid default gen_random_uuid() primary key,
  card_id uuid references public.flashcards(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  quality integer not null check (quality between 0 and 5), -- SM-2 quality score
  reviewed_at timestamptz default now()
);

alter table public.flashcard_reviews enable row level security;

create policy "Users can manage own reviews"
  on public.flashcard_reviews for all
  using (auth.uid() = user_id);

-- ================================================
-- Conversations (Web + Telegram)
-- ================================================
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  channel text default 'web' check (channel in ('web', 'telegram')),
  scenario text, -- e.g. 'doctor_visit', 'job_interview', 'free_chat'
  messages jsonb default '[]',
  feedback jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.conversations enable row level security;

create policy "Users can manage own conversations"
  on public.conversations for all
  using (auth.uid() = user_id);

-- ================================================
-- Assessments
-- ================================================
create table public.assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('placement', 'chapter', 'mock_exam')),
  level text,
  score real,
  total_questions integer,
  correct_answers integer,
  details jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.assessments enable row level security;

create policy "Users can manage own assessments"
  on public.assessments for all
  using (auth.uid() = user_id);

-- ================================================
-- Knowledge Nodes (system-wide knowledge graph)
-- ================================================
create table public.knowledge_nodes (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('vocabulary', 'grammar', 'topic')),
  name text not null,
  level text,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Knowledge graph edges
create table public.knowledge_edges (
  id uuid default gen_random_uuid() primary key,
  from_node_id uuid references public.knowledge_nodes(id) on delete cascade not null,
  to_node_id uuid references public.knowledge_nodes(id) on delete cascade not null,
  relationship text not null, -- 'prerequisite', 'related', 'part_of'
  created_at timestamptz default now()
);

-- User knowledge state (mastery tracking)
create table public.user_knowledge_state (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  node_id uuid references public.knowledge_nodes(id) on delete cascade not null,
  mastery_level real default 0 check (mastery_level between 0 and 1),
  last_reviewed timestamptz,
  review_count integer default 0,
  created_at timestamptz default now(),
  unique (user_id, node_id)
);

alter table public.user_knowledge_state enable row level security;

create policy "Users can manage own knowledge state"
  on public.user_knowledge_state for all
  using (auth.uid() = user_id);

-- ================================================
-- Indexes
-- ================================================
create index idx_daily_tasks_user_date on public.daily_tasks (user_id, date);
create index idx_flashcards_user_next_review on public.flashcards (user_id, next_review);
create index idx_document_chunks_document on public.document_chunks (document_id);
create index idx_conversations_user on public.conversations (user_id, created_at desc);
create index idx_profiles_telegram on public.profiles (telegram_chat_id) where telegram_chat_id is not null;
