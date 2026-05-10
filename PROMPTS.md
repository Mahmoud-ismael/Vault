# VAULT — Antigravity Build Prompts
**Complete sequence from zero to deployed product**  
Send these prompts to Antigravity in order. Do not skip ahead.  
Each prompt builds on the previous one. Wait for completion before sending the next.

---

## PRE-BUILD SETUP (Do this manually before any prompt)

1. Create a new Supabase project at supabase.com — call it `vault`
2. Save your Supabase URL and anon key
3. Get a Claude API key from console.anthropic.com
4. Get a Gemini API key from aistudio.google.com
5. Create a new GitHub repo called `vault`
6. Open Antigravity, connect to the repo

---

# PHASE 1 — PROJECT FOUNDATION

---

## PROMPT 01 — Project Initialisation

```
Create a new Next.js 15 project called "vault" with the following setup:

- Next.js 15 with App Router
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui initialised with the "new-york" style
- ESLint configured

Install these additional dependencies:
- @supabase/supabase-js
- @supabase/ssr
- @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-character-count @tiptap/extension-underline @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-blockquote @tiptap/extension-code-block @tiptap/extension-heading @tiptap/extension-link @tiptap/extension-image
- lucide-react
- date-fns
- @anthropic-ai/sdk
- @google/generative-ai
- react-dropzone
- uuid
- @types/uuid

Create a .env.local file with these variables (leave values empty):
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=

Create a .env.example file with the same keys.

Do not create any pages yet. Just the project scaffold.
```

---

## PROMPT 02 — Design System & Global Styles

```
Set up the complete design system for Vault in globals.css and Tailwind config.

In app/globals.css, define ALL of these CSS custom properties:

BACKGROUNDS:
--vault-bg: #0D0D0F
--vault-bg-2: #121215
--vault-bg-3: #18181C
--vault-bg-4: #1F1F26

BORDERS:
--vault-border: #252529
--vault-border-2: #32323A
--vault-border-3: #404048

TEXT:
--vault-text: #F0EDE8
--vault-text-2: #9E9B94
--vault-text-3: #5A5854
--vault-text-4: #38362F

ACCENT (Sky Blue):
--vault-accent: #3B9EFF
--vault-accent-2: #1A6FCC
--vault-accent-3: #0D4A8A
--vault-accent-dim: #3B9EFF14
--vault-accent-border: #3B9EFF33

STATUS:
--vault-settled: #4CAF7D
--vault-evolving: #E8A838
--vault-undecided: #7B9FE0
--vault-empty: #3A3A42
--vault-danger: #C95050
--vault-warning: #C98A30

Import these Google Fonts in globals.css:
- Instrument Serif (weights: 400, italic 400)
- DM Mono (weights: 300, 400, 500)
- Geist (weights: 300, 400, 500, 600)

Set the body background to var(--vault-bg) and color to var(--vault-text).
Set the default font-family to Geist.

In tailwind.config.ts, extend the theme to add these custom colours that map to the CSS variables:
- vault-bg, vault-bg-2, vault-bg-3, vault-bg-4
- vault-border, vault-border-2, vault-border-3
- vault-text, vault-text-2, vault-text-3
- vault-accent, vault-accent-2, vault-accent-dim
- vault-settled, vault-evolving, vault-undecided

Add this scrollbar CSS to globals.css:
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--vault-border-2); border-radius: 2px; }

Add a page entrance animation called "pageIn":
@keyframes pageIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.page-enter { animation: pageIn 180ms ease forwards; }

Set all interactive elements to: transition-duration: 150ms; transition-timing-function: ease;
```

---

## PROMPT 03 — Supabase Client Setup

```
Set up Supabase client utilities for Vault using @supabase/ssr.

Create these files:

1. lib/supabase/client.ts
   - Browser client using createBrowserClient
   - Export as createClient()

2. lib/supabase/server.ts
   - Server client using createServerClient with cookies from next/headers
   - Export as createClient()

3. lib/supabase/middleware.ts
   - Middleware helper that refreshes auth sessions
   - Export as updateSession(request)

4. middleware.ts (root)
   - Use the updateSession helper
   - Protect all routes under /(vault)/ — redirect to /login if no session
   - Allow /login and /auth/callback to pass through

5. lib/supabase/types.ts
   - Define TypeScript interfaces for all database tables:

interface Profile {
  id: string
  name: string
  created_at: string
}

interface Stance {
  id: string
  user_id: string
  topic: string
  category: string
  status: 'settled' | 'evolving' | 'undecided' | 'empty'
  my_stance: string | null
  why_i_hold_this: string | null
  strongest_counter: string | null
  my_rebuttal: string | null
  uncertainties: string | null
  life_impact: string | null
  sources: string | null
  last_updated: string
  created_at: string
}

interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: Record<string, unknown>
  tags: string[]
  word_count: number
  linked_stances: string[]
  created_at: string
  updated_at: string
}

interface Note {
  id: string
  user_id: string
  title: string
  content: Record<string, unknown>
  parent_id: string | null
  tags: string[]
  pinned: boolean
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  user_id: string
  title: string
  file_path: string
  file_type: string
  extracted_text: string | null
  summary: string | null
  tags: string[]
  source_url: string | null
  created_at: string
}
```

---

## PROMPT 04 — Supabase Database Schema

```
Create the complete Supabase SQL schema for Vault.

Create a file called supabase/schema.sql with the following SQL:

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

Also create lib/stances/seed.ts with an array called STANCE_SEEDS containing all 100 topics with their category. Format:
{ topic: string, category: string }

Categories and topics:
Gender & Sexuality: Feminism & its modern forms, Masculinity & modern manhood, Traditional gender roles, Transgender rights & recognition, Female Genital Mutilation (FGM), Same-sex marriage, Sex work & prostitution, Gender pay gap
Family & Relationships: Purpose of marriage, Divorce ethics, Polygamy vs monogamy, Marital responsibilities (husband vs wife), Arranged marriage vs love marriage, Interfaith & interracial marriage, Parenting styles & child discipline, Loyalty vs independence in relationships
Religion & Spirituality: Role of religion in society, Separation of religion and state, Religious law in governance, Faith vs science, Religious tolerance & interfaith dialogue, Interpretation vs literalism in scripture, Public expression of religion, Morality without religion
Ethics & Moral Philosophy: Objective vs subjective morality, Justice vs mercy, Free will vs determinism, Individual vs societal responsibility, Moral relativism vs universal values, Lying for a good cause, Revenge vs forgiveness, The role of suffering in growth
Race Identity & Culture: Racism — systemic vs individual, Colorism, Cultural appropriation vs appreciation, Reparations for historical injustices, Decolonization, Tribalism & ethnic nationalism, Cancel culture, Patriotism vs globalism
Health & Body: Abortion, Euthanasia & assisted dying, Vaccine mandates, Body autonomy, Genetic engineering & designer babies, Cosmetic surgery ethics, Drug decriminalization & legalization, Mental health — personal vs societal responsibility
Economics & Work: Capitalism vs socialism, Wealth inequality, Universal basic income, Minimum wage laws, Taxation fairness, Worker unions & labor rights, Gig economy worker rights, Corporate responsibility & ethical investing
Politics & Governance: Democracy vs authoritarianism, Capital punishment, Gun ownership & control, Prison reform — rehabilitation vs punishment, Civil disobedience, Whistleblowing, Military intervention abroad, Government corruption & accountability
Technology & Society: AI governance & ethics, Data privacy & surveillance, Social media — free speech vs regulation, Automation replacing human labor, Cryptocurrency & decentralized finance, Transhumanism & human enhancement, Big Tech power & monopolies, AI in education & creative work
Environment: Climate change — human responsibility, Nuclear energy — solution or risk, Animal rights & factory farming, Fast fashion & sustainability, Water & resource privatization, Environmental reparations — who pays
Education & Knowledge: University vs self-education, Student debt systems, Homeschooling, Critical thinking vs rote memorization, Academic freedom, Education as a right vs a privilege
Personal Philosophy: Meaning & purpose of life, How you define success, Happiness vs discipline, Freedom vs security, Individualism vs collectivism, Wealth & moral responsibility, What makes a good life, Legacy vs personal happiness
Global & Justice Issues: Immigration — open borders vs sovereignty, Universal healthcare, Wealth redistribution globally, Indigenous land rights, Media bias & press freedom, Charity vs systemic change, War ethics & just war theory, Generational trauma & personal accountability
```

---

## PROMPT 05 — Auth Pages

```
Build the authentication flow for Vault.

Create app/(auth)/login/page.tsx:

Design requirements:
- Full-page centered layout, background var(--vault-bg)
- Left side (60%): large Instrument Serif italic heading "Your thinking, preserved." with a short subtext in Geist about what Vault is
- Right side (40%): the login card
- Login card: background var(--vault-bg-2), border var(--vault-border), border-radius 6px, padding 32px
- "VAULT" in DM Mono uppercase at top of card
- Heading: "Sign in" in Instrument Serif 22px
- Subtext: "We'll send a magic link to your email. No password needed." in Geist var(--vault-text-2) 14px
- Email input styled to Vault design (bg var(--vault-bg-4), border var(--vault-border), focus border var(--vault-accent))
- Submit button: full width, background var(--vault-accent), color #0D0D0F, DM Mono uppercase 11px tracked, text "SEND MAGIC LINK"
- Success state: replace form with a message "Check your email. The link expires in 10 minutes." in Instrument Serif italic
- Error state: inline error in var(--vault-danger) DM Mono 11px

Functionality:
- Use Supabase auth.signInWithOtp({ email, options: { emailRedirectTo: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback' } })
- Handle loading state on submit button
- Validate email before submit

Create app/auth/callback/route.ts:
- Exchange the code from the URL for a session using supabase.auth.exchangeCodeForSession
- Redirect to /dashboard on success
- Redirect to /login?error=true on failure

Create app/(vault)/layout.tsx:
- Check for valid session — if none, redirect to /login
- Render the Sidebar + Topbar + {children} layout
- Sidebar is fixed 240px wide, full height
- Topbar is 52px, sticky, full width minus sidebar
- Children render in the remaining space with margin-left: 240px
```

---

## PROMPT 06 — Sidebar & Topbar Components

```
Build the Sidebar and Topbar components for Vault.

Create components/vault/Sidebar.tsx:

Visual spec:
- Width: 240px, fixed, full height
- Background: var(--vault-bg-2)
- Right border: 1px solid var(--vault-border)
- Logo area (top): "VAULT" in DM Mono uppercase 18px var(--vault-accent), subtitle "Personal Intelligence" in DM Mono 9px uppercase var(--vault-text-3), padded 24px, bottom border
- Nav section labels: DM Mono 9px uppercase var(--vault-text-3), padding 14px 20px 6px
- Nav items: padding 9px 20px, Geist 14px var(--vault-text-2), 2px left border transparent, flex row with lucide icon (14px) + label + optional badge
- Nav item hover: bg var(--vault-bg-3), color var(--vault-text)
- Nav item active: color var(--vault-accent), border-left 2px solid var(--vault-accent), bg var(--vault-accent-dim)
- Badge: DM Mono 10px, bg var(--vault-bg-4), color var(--vault-text-3), px-2 rounded-full

Nav structure:
Section "CORE": Dashboard (LayoutDashboard icon), Stances (Target icon) badge from db count, Search (Search icon)
Section "WRITING": Journal (BookOpen icon) badge from db count, Notes (FileText icon) badge from db count
Section "KNOWLEDGE": Documents (Archive icon) badge from db count
Section "SYSTEM": Settings (Settings icon)

Bottom of sidebar:
- 90-day review nudge: only show if stances exist with last_updated > 90 days ago. Sky blue tinted box, DM Mono 10px "REVIEW DUE", then count of stances needing review.
- User chip: avatar circle (initials from profile name), name in Geist 14px

Create components/vault/Topbar.tsx:
- Height 52px, sticky, bg var(--vault-bg), border-bottom 1px solid var(--vault-border)
- Left: current page title in Instrument Serif 16px var(--vault-text-2)
- Right: ghost button for Search shortcut + primary action button (label and action passed as props)
- Export a useTopbar hook that lets pages set their title and action button

Use Next.js usePathname to determine active nav item.
Fetch badge counts from Supabase on mount.
```

---

## PROMPT 07 — Dashboard Page

```
Build the Dashboard page for Vault at app/(vault)/dashboard/page.tsx.

Layout (full page, padding 32px 40px):

1. GREETING SECTION
- Time-based greeting: "Good morning / afternoon / evening, [name]."
- Font: Instrument Serif italic 32px
- Below it: today's date in DM Mono 11px uppercase var(--vault-text-3)
  Format: "SUNDAY · 11 MAY 2026"

2. DAILY REFLECTION PROMPT (shown below greeting)
- Background var(--vault-bg-2), border 1px solid var(--vault-accent-border), border-radius 6px, padding 20px 24px
- Label: DM Mono 9px uppercase var(--vault-accent) "TODAY'S REFLECTION"
- Prompt text: Instrument Serif italic 20px — rotate through a hardcoded array of 30 philosophical prompts based on day of year
- Button: ghost "Write in Journal →" that navigates to /journal/new

Prompts array (include all 30): "Does morality require religion, or can it be derived from reason alone?" / "What belief do you hold that most people around you would disagree with?" / "What would you defend even if it cost you something?" / "Is justice the same as fairness?" / "What has changed your mind most significantly in the last year?" / "Where do your values come from — and do they still hold?" / "What do you believe about human nature?" / "Is there a difference between what you believe and how you live?" / "What suffering has built you, and what has damaged you?" / "What does freedom actually mean to you?" / "Is loyalty a virtue or a trap?" / "What would you die for? What would you live for?" / "Do you believe in objective truth? Why?" / "What do you owe to people who came before you?" / "What do you owe to people who will come after you?" / "When is it right to break a rule?" / "What does success mean to you right now — and is that what you actually want?" / "Are you living according to your stated values?" / "What idea have you held longest without examining?" / "What would you tell your 15-year-old self?" / "Is wealth a moral responsibility?" / "What is the most important thing you are not doing?" / "What do you believe about death?" / "What makes a life meaningful?" / "Is forgiveness always the right choice?" / "What are you most certain about? What are you most uncertain about?" / "What has reading taught you that experience hasn't?" / "Is there a version of you that you are afraid of becoming?" / "What is the relationship between discipline and freedom?" / "What do you believe that you cannot yet defend?"

3. STATS ROW (4 cards in a grid)
- Card 1: count of stances with status='settled' — label "Stances Settled"
- Card 2: count of stances with status='evolving' — label "Still Evolving"
- Card 3: count of journal_entries — label "Journal Entries"
- Card 4: count of documents — label "Documents"
Each card: bg var(--vault-bg-2), border var(--vault-border), br 6px, padding 20px
Number: Instrument Serif 36px var(--vault-accent)
Label: DM Mono 10px uppercase var(--vault-text-3)

4. TWO-COLUMN GRID (gap 24px)
Left: Stance Progress by Category
- For each of the 13 categories, show a progress bar (stances with status != 'empty' / total stances in category)
- Progress bar: 4px height, bg var(--vault-bg-4), fill var(--vault-accent)
- Label: DM Mono 10px var(--vault-text-2), right-aligned count

Right: Recent Activity Feed
- Show last 10 activity items across all tables (created_at or updated_at)
- Each item: coloured dot + description text + relative time (use date-fns formatDistanceToNow)
- Dot colours: settled=var(--vault-settled), evolving=var(--vault-evolving), journal=var(--vault-accent), document=var(--vault-undecided)

5. EXPORT BANNER (bottom)
- Full width bar, bg var(--vault-bg-2), border var(--vault-border), br 6px, padding 16px 20px
- Left: download icon + "Your vault is always yours" (Geist 15px) + "Export all data as JSON or Markdown · Last export: Never" (DM Mono 10px var(--vault-text-3))
- Right: ghost button "Export All Data" (disabled for now, just shows a toast "Coming soon")

Fetch all data server-side using the Supabase server client.
```

---

## PROMPT 08 — Stances Module (Browse)

```
Build the Stances browse page at app/(vault)/stances/page.tsx.

This page lists all 100 stance topics grouped by category.

Page header:
- Title: "My Stances" in Instrument Serif 28px
- Subtitle: live counts — "[X] settled · [X] evolving · [X] undecided · [X] not started" in DM Mono 10px var(--vault-text-3)

SEED FUNCTIONALITY:
On first load, if stances table is empty for this user, automatically insert all 100 topics from lib/stances/seed.ts with status='empty'. Show a loading state while seeding.

FILTER BAR:
Row of filter chips: All / Settled / Evolving / Undecided / Not Started
Plus a text input to filter by topic name (client-side filter, no db call)
Chips styled: border 1px solid var(--vault-border-2), DM Mono 10px uppercase, br 20px
Active chip for the current status uses the matching status colour as background

CATEGORY SECTIONS:
For each category (13 total), render:
- Category header: DM Mono 10px uppercase var(--vault-text-3), bottom border, count badge
- Grid of stance cards (3 columns on desktop, 2 on tablet)

STANCE CARD (component: components/vault/StanceCard.tsx):
- bg var(--vault-bg-2), border var(--vault-border), br 6px, padding 16px 18px
- Left edge: 3px solid bar in the status colour (settled=green, evolving=amber, undecided=blue, empty=var(--vault-border-2))
- Topic name: Geist 15px var(--vault-text)
- Preview: first 60 chars of my_stance or "No stance written yet" — DM Mono 10px var(--vault-text-3)
- Footer row: status badge (left) + last_updated date (right, DM Mono 9px)
- Hover: border-color var(--vault-border-2), bg var(--vault-bg-3), translateY(-1px)
- Click navigates to /stances/[id]

STATUS BADGE component (components/shared/StatusBadge.tsx):
- settled: bg #4CAF7D18 color var(--vault-settled) text "✓ Settled"
- evolving: bg #E8A83818 color var(--vault-evolving) text "↻ Evolving"
- undecided: bg #7B9FE018 color var(--vault-undecided) text "? Undecided"
- empty: bg var(--vault-bg-4) color var(--vault-text-3) text "○ Not Started"
Font: DM Mono 9px uppercase, padding 2px 8px, br 3px

Fetch stances from Supabase, seed if empty, then render.
All filtering is client-side after initial fetch.
```

---

## PROMPT 09 — Stances Module (Detail & Editor)

```
Build the Stance detail page at app/(vault)/stances/[id]/page.tsx.

This page shows and edits a single stance across its 8 sections.

HEADER:
- Back link "← Stances" in DM Mono 10px uppercase var(--vault-text-3), navigates to /stances
- Topic title: Instrument Serif 36px
- Meta row: StatusBadge + category badge + "Last updated [date]" in DM Mono 11px
- Action row (top right): "Change Status" dropdown (ghost button, options: Settled / Evolving / Undecided / Not Started) + "Save" primary button

EIGHT SECTION BLOCKS:
Each section is a card (bg var(--vault-bg-2), border var(--vault-border), br 6px, mb 16px, overflow hidden).
Section header: DM Mono 9px uppercase var(--vault-text-3), border-bottom, padding 12px 20px, with a numbered circle.
Section body: padding 18px 20px.

Section 1 — My Stance
- Body uses Instrument Serif italic 19px var(--vault-text)
- Editable textarea that grows with content
- Placeholder: "State your position clearly in one or two sentences..."

Section 2 — Why I Hold This
- Body: Geist 16px var(--vault-text-2), line-height 1.7
- Editable textarea
- Placeholder: "What reasoning, evidence, or experience convinced you?"

Section 3 — Strongest Argument Against Me
- Same editor
- Placeholder: "Write the best case the opposing side would make. No strawmanning."
- Below the textarea: AI Button "✦ Generate steelman" — calls /api/ai/steelman with the topic + my_stance, streams response inline below the textarea in an AI content block (sky blue left border, AI badge, DM Mono 9px). Include an "Insert into section" button that pastes the AI response into the textarea.

Section 4 — My Rebuttal
- Same editor
- Placeholder: "Why does your stance hold despite the counter-argument above?"

Section 5 — Where I'm Uncertain
- Textarea for free text
- Below: tag input for uncertainty tags (e.g. "implementation", "edge cases")
- Tags rendered as chips with sky blue tint

Section 6 — How This Affects How I Live
- Same editor
- Placeholder: "Does this stance change your behaviour, relationships, or decisions?"

Section 7 — Sources & Influences
- List of source items, each with: type dropdown (Book / Paper / Article / Experience / AI Summary) + title input + author input + verified checkbox
- "Add source" button to append a new source item
- AI Summary sources get a warning if verified=false: amber banner "⚠ Primary source not yet verified"
- "✦ Suggest sources" AI button — calls /api/ai/suggest-sources with the topic, returns a list of suggested books/papers to read

Section 8 — Last Updated
- Read-only, shows the timestamp
- "Mark as reviewed today" button that updates last_updated to now

SAVE BEHAVIOUR:
- Debounced autosave (2 seconds after last keystroke) with a subtle "Saving..." indicator in DM Mono 9px var(--vault-text-3) in the topbar
- On status change: immediate save + update

AI PANEL (right sidebar, 280px, only visible on screens > 1280px):
- Panel title: DM Mono 10px "AI ASSISTANT" with Sparkles icon
- Button: "✦ Challenge my stance" — sends all sections to Claude, returns 3 pointed questions that challenge the reasoning
- Button: "✦ Find contradictions" — checks this stance against all other settled stances, flags logical conflicts
- Button: "✦ Improve clarity" — suggests rewrites for unclear sentences in My Stance section
- All responses appear as cards below the buttons with an "Insert" or "Dismiss" action

Create api/ai/steelman/route.ts:
- POST endpoint
- Body: { topic: string, my_stance: string }
- System prompt: "You are helping someone think rigorously. Given their stance on a topic, write the single strongest steelman argument against their position. Be genuinely challenging, not a strawman. 3-4 sentences. No preamble."
- Use Anthropic SDK, stream the response
- Return as streaming text response

Create api/ai/suggest-sources/route.ts:
- POST endpoint  
- Body: { topic: string }
- Return 3-5 real books/papers someone should read to understand this topic deeply
- Format as JSON array: [{ title, author, type, why }]
```

---

## PROMPT 10 — Journal Module (List View)

```
Build the Journal list page at app/(vault)/journal/page.tsx.

LAYOUT: Two-column (260px list | 1fr content area), full height minus topbar.

LEFT PANEL — Entry List:
- Header: "JOURNAL" DM Mono 10px + entry count + "New Entry" icon button (Plus icon)
- View toggle: List view | Calendar view (just switch the panel content)
- Search input: filter entries by title or content client-side
- Entry rows (each): 
  - Date: DM Mono 9px uppercase var(--vault-text-3)
  - Title: Geist 14px var(--vault-text)
  - Preview: first 80 chars of plain text extracted from content JSON — Geist 12px var(--vault-text-3), truncated
  - Tags: small chips, DM Mono 9px, bg var(--vault-bg-4)
  - Hover: bg var(--vault-bg-3)
  - Active (selected): bg var(--vault-accent-dim), border-left 2px solid var(--vault-accent)
- "New Entry" button at the bottom of the list

CALENDAR VIEW (inside the left panel when toggled):
- Month grid, 7 columns
- Day labels: DM Mono 9px uppercase var(--vault-text-3)
- Each day cell: small number, bg var(--vault-bg-2), border var(--vault-border), br 4px
- Days with entries: show a small sky blue dot below the number
- Today: border-color var(--vault-accent)
- Clicking a day with an entry selects that entry in the right panel

RIGHT PANEL — Entry Viewer/Placeholder:
- If no entry selected: empty state with Instrument Serif italic "Select an entry or write something new." var(--vault-text-3), plus a large "New Entry" button
- If entry selected: shows the entry with a link "Open full editor →" that navigates to /journal/[id]
- Show title (Instrument Serif 24px), date (DM Mono 10px), tags, and rendered (read-only) Tiptap content

Create app/(vault)/journal/new/page.tsx:
- Redirect to /journal/[newId] after creating a blank entry in Supabase
- Insert: { title: 'Untitled', content: {}, tags: [], word_count: 0, user_id }
- Then redirect to /journal/[id]

Fetch all entries on load, ordered by created_at desc.
```

---

## PROMPT 11 — Journal Module (Editor)

```
Build the Journal entry editor at app/(vault)/journal/[id]/page.tsx.

This is the full-screen writing experience.

TOPBAR for this page:
- Back link "← Journal" 
- Entry title as the page title (editable inline, Instrument Serif 16px in topbar)
- Right: word count "XXX words · X min read" in DM Mono 10px var(--vault-text-3)
- Save status: "Saving..." / "Saved" / "Unsaved changes" in DM Mono 9px
- Actions: tag button, AI button, delete button (ghost danger)

MAIN LAYOUT: Editor (center, max-width 720px, mx-auto) + AI Sidebar (280px, right, collapsible)

EDITOR AREA:
Title input:
- Instrument Serif 36px, no border, full width, placeholder "Title..."
- Autofocused on new entries

Date display:
- DM Mono 10px uppercase var(--vault-text-3), not editable, below title

Tags row:
- Inline tag chips + input to add new tags
- Each tag: bg var(--vault-bg-4), DM Mono 10px, × to remove

Tiptap Editor:
- Extensions: StarterKit, Placeholder, CharacterCount, Underline, TaskList, TaskItem, Link, Heading (levels 1,2,3)
- Toolbar (above editor, sticky): Bold | Italic | Underline | Strikethrough | — | H1 | H2 | H3 | — | Bullet list | Numbered list | Checklist | — | Quote | Code | Link | — | (AI actions)
- Toolbar buttons: 28px × 28px, bg transparent, hover bg var(--vault-bg-3), br 3px
- Active toolbar button: bg var(--vault-accent-dim), color var(--vault-accent)
- Editor content area: Geist 17px, line-height 1.8, color var(--vault-text-2), min-height 400px, padding 0
- Placeholder: Instrument Serif italic var(--vault-text-3) "Begin writing..."

Autosave:
- Debounce 2 seconds
- On save: update content, word_count, updated_at in Supabase
- Word count from CharacterCount extension

AI SIDEBAR (right panel, 280px):
Panel header: DM Mono 10px "AI TOOLS" + Sparkles icon (sky blue) + collapse button

AI Action Cards:
1. "Summarise entry" — sends full content to Claude, returns 3-sentence summary. Show inline in a sky-blue bordered block.
2. "Find contradictions" — Claude checks this entry against all settled stances. Returns list of potential conflicts.
3. "Expand this thought" — only available when text is selected in editor. Sends selected text to Claude, returns an expanded paragraph. User can insert or dismiss.
4. "Link to stance" — Claude suggests which of the 100 stances this entry connects to most. Shows up to 3 stance names with links.

All AI responses rendered in the AI content block style: bg var(--vault-accent-dim), left border 3px solid var(--vault-accent), AI badge, response text, Insert / Dismiss buttons.

Create api/ai/summarise/route.ts:
POST, body: { content: string }
System: "Summarise the following journal entry in 3 concise sentences. Focus on the main ideas and insights. No preamble."
Return streaming text.

Create api/ai/expand/route.ts:
POST, body: { selected_text: string, context: string }
System: "The user has written: '[selected_text]'. Help them develop this thought further. Write 1-2 paragraphs that explore the idea more deeply, maintaining their voice and perspective. No preamble."
Return streaming text.
```

---

## PROMPT 12 — Notes Module

```
Build the Notes module at app/(vault)/notes/page.tsx and app/(vault)/notes/[id]/page.tsx.

NOTES LIST PAGE (app/(vault)/notes/page.tsx):

Left sidebar (260px):
- "NOTES" header + count + New Note button
- Pinned section (if any pinned notes): "PINNED" DM Mono label + pinned note items
- All notes tree: flat list for now (nesting in Week 2)
- Note row: Geist 14px title + DM Mono 9px date, hover bg var(--vault-bg-3), active bg var(--vault-accent-dim) with sky blue left border
- Right-click context menu (or ... button on hover): Pin / Duplicate / Delete

Main area: Same pattern as Journal — if no note selected, show empty state. If selected, show read-only preview with "Open editor" button.

NOTE EDITOR PAGE (app/(vault)/notes/[id]/page.tsx):

Full-page editor, same layout pattern as Journal but with block-based features.

DIFFERENCES from Journal editor:
1. No date display (notes are not dated)
2. Slash commands: typing "/" in the editor shows a command palette with block options
3. Block types available via slash command:
   - /text → paragraph
   - /h1 /h2 /h3 → headings
   - /bullet → bullet list
   - /numbered → numbered list
   - /todo → checklist
   - /quote → blockquote
   - /code → code block
   - /callout → callout (styled box with icon, bg var(--vault-bg-4), border-left 3px solid var(--vault-accent))
   - /divider → horizontal rule
   - /table → basic 3x3 table

Slash command palette styled as: bg var(--vault-bg-2), border var(--vault-border-2), br 6px, shadow-like effect using a second border, DM Mono 11px labels, navigate with arrow keys, enter to insert.

Templates button in topbar: dropdown with 4 templates:
- Research Summary: pre-fills with sections "Overview / Key Arguments / My Assessment / Sources"
- Argument Map: "Claim / Evidence For / Evidence Against / My Verdict"
- Book Notes: "Book / Author / Core Thesis / Key Ideas / Quotes / My Takeaways"
- Meeting Notes: "Date / Attendees / Agenda / Decisions / Actions"

AI SIDEBAR (same 280px right panel):
1. "✦ Generate outline" — input a topic, Claude generates a structured outline and inserts it as blocks
2. "✦ Summarise note" — 3-sentence summary
3. "✦ Improve note" — Claude suggests what's missing or unclear
4. "✦ Suggest related" — Claude scans all notes titles and stances, surfaces 3 related items with links

Create api/ai/outline/route.ts:
POST, body: { topic: string }
System: "Create a structured outline for a research note on: [topic]. Use clear section headings and 2-3 bullet points per section. Format as plain text with ## for headings and - for bullets. 5-7 sections. No preamble."
Return streaming text.
```

---

## PROMPT 13 — Documents Module (Upload & Library)

```
Build the Documents module at app/(vault)/documents/page.tsx.

LIBRARY PAGE LAYOUT: Full width (no sidebar panel needed).

PAGE HEADER:
- Title "Documents" Instrument Serif 28px
- Subtitle: count + "· PDFs, images, scans, articles" DM Mono 10px var(--vault-text-3)
- Right: filter chips (All / PDF / Image / Article) + "Upload" primary button

UPLOAD ZONE (shown at top when no documents, or collapsible banner when documents exist):
- Dashed border 2px dashed var(--vault-border-2), br 8px, padding 40px, bg var(--vault-bg-2)
- Center: upload icon (Archive, 32px, var(--vault-text-3)) + "Drop files here or click to upload" Instrument Serif italic 18px + supported formats list DM Mono 10px var(--vault-text-3)
- Supported: PDF, DOCX, TXT, PNG, JPG, WEBP
- Use react-dropzone
- Multiple files allowed
- On drop/select: show upload progress for each file

UPLOAD PROCESS:
1. File is uploaded to Supabase Storage at path: [user_id]/[uuid]/[filename]
2. For PDFs: call /api/documents/extract-text to get text content
3. For images: call /api/documents/ocr to get text via Tesseract.js
4. After text extraction: call /api/ai/summarise-document to get AI summary
5. Insert record to documents table
6. Show completion with summary preview

DOCUMENTS GRID (3 columns desktop, 2 tablet):
Document Card (components/vault/DocumentCard.tsx):
- bg var(--vault-bg-2), border var(--vault-border), br 6px, padding 18px 20px, cursor pointer
- Top row: file type badge (PDF=blue, IMAGE=amber, TXT=green, ARTICLE=purple) + date DM Mono 9px
- Title: Geist 15px var(--vault-text), 2 lines max, ellipsis
- Summary preview: first 100 chars of AI summary or "Processing..." — Geist 13px var(--vault-text-2)
- Tags row at bottom
- Hover: border var(--vault-border-2), bg var(--vault-bg-3)

CREATE api/documents/extract-text/route.ts:
- POST with FormData (file)
- For PDFs: use pdf-parse to extract text
- Return: { text: string, pageCount: number }

CREATE api/documents/ocr/route.ts:
- POST with FormData (image file)
- Use Tesseract.js: const { data: { text } } = await Tesseract.recognize(buffer, 'eng')
- Return: { text: string }

CREATE api/ai/summarise-document/route.ts:
- POST, body: { text: string, title: string }
- System: "Summarise the following document in 3-4 sentences. Focus on the main topic, key arguments, and conclusions. No preamble."
- Input: first 4000 chars of extracted text
- Return streaming text.

Install: npm install pdf-parse tesseract.js
Install types: npm install --save-dev @types/pdf-parse
```

---

## PROMPT 14 — Document Viewer

```
Build the Document viewer at app/(vault)/documents/[id]/page.tsx.

LAYOUT: Two-column — document view (flex-1) | annotations sidebar (320px)

TOPBAR for this page:
- Back "← Documents"
- Document title (Instrument Serif 16px)
- Actions: "Ask document" AI button + Download + Delete (ghost danger)

MAIN DOCUMENT VIEW:
- Reading mode: clean white-ish surface (bg var(--vault-bg-2)), padding 40px, max-width 700px, centered
- If PDF: render extracted text in reading mode (no PDF embed — just the text, beautifully formatted)
- If image: show the image full-width with zoom capability
- Text: Geist 17px line-height 1.8 var(--vault-text-2)
- Headings detected in text rendered as Instrument Serif

Text selection behaviour:
- When user selects text in the document, a floating tooltip appears with two actions:
  - "Highlight" — saves the selection with position info
  - "Add note" — opens a small inline comment input

Highlights rendered as: text background var(--vault-accent-dim), underline var(--vault-accent-border)

ANNOTATIONS SIDEBAR (320px right):
Header: DM Mono 10px "ANNOTATIONS" + count
Each annotation:
- Selected text (italic, var(--vault-text-2), 13px, border-left 3px solid var(--vault-accent), pl 12px)
- User note below it (Geist 14px)
- Timestamp DM Mono 9px var(--vault-text-3)
- Delete button on hover

AI SECTION (below annotations in sidebar):
"✦ AI Summary" card — shows the stored AI summary from upload, with a "Regenerate" button

"✦ Ask this document" — text input, user types a question, Claude answers using ONLY the document's extracted_text as context. Styled same as other AI responses.

"✦ Extract key arguments" — Claude returns 4-6 bullet points of the main claims in the document

"✦ Generate note" — Creates a new note in the Notes module pre-filled with an Argument Map template populated from this document. Navigates to the new note after creation.

Create api/ai/ask-document/route.ts:
POST, body: { question: string, document_text: string }
System: "Answer the following question using ONLY the information in the document provided. If the answer is not in the document, say so. Be concise and direct."
User message: "Document:\n[first 6000 chars of document_text]\n\nQuestion: [question]"
Return streaming text.

Create api/ai/extract-arguments/route.ts:
POST, body: { text: string }
System: "Extract the 4-6 main arguments or key claims from this document. Return as a numbered list. Each item: one sentence. No preamble."
Return streaming text.
```

---

## PROMPT 15 — AI Search Page

```
Build the Search page at app/(vault)/search/page.tsx.

LAYOUT: Centered content, max-width 780px, mx-auto.

HERO SECTION:
- Heading: "Ask Anything" Instrument Serif italic 44px, centered, mb 4px
- Subtext: "Search your vault · Research the web · Think out loud" DM Mono 10px uppercase var(--vault-text-3), centered, mb 32px

SEARCH BAR:
- Full width input, bg var(--vault-bg-2), border 1px solid var(--vault-border-2), br 8px, padding 16px 52px 16px 20px
- Font: Geist 18px, placeholder italic var(--vault-text-3) "What do you want to understand?"
- Focus: border var(--vault-accent), box-shadow 0 0 0 3px var(--vault-accent-dim)
- Submit button inside (right edge): bg var(--vault-accent), 36px circle, → arrow, color #0D0D0F
- Keyboard: Enter to submit

SEARCH MODE TABS (below search bar):
Four tabs in a segmented control: "Vault" | "Web + AI" | "Deep Reason" | "Academic"
- Border 1px solid var(--vault-border), br 6px, no gap between tabs
- Active tab: bg var(--vault-accent), color #0D0D0F
- Inactive: bg var(--vault-bg-2), DM Mono 10px uppercase, color var(--vault-text-3)

RECENT SEARCHES:
If no active search, show last 5 searches from localStorage as chips below tabs.

SEARCH RESULTS:

Mode: VAULT
- Full-text search across stances, journal_entries, notes, documents using Supabase ilike on content fields
- Group results by module with section headers
- Each result card: module badge (DM Mono 9px, colour-coded) + title + excerpt with search term highlighted + date + "Open →" link

Mode: WEB + AI
- POST to /api/ai/websearch with the query
- Show AI synthesis response in the AI response box (sky blue bordered card, AI badge, streaming text)
- Below the AI response: "What do you actually think?" friction prompt — Instrument Serif italic placeholder "Write your reaction before it fades..." — small textarea, saves as a journal entry on submit
- Below friction: "Related in your vault" — surfaces any stances/notes that match keywords from the query

Mode: DEEP REASON
- POST to /api/ai/reason with the query
- Claude Sonnet with extended thinking prompt
- System: "You are a rigorous analytical thinking partner. The user wants to deeply understand a topic. Provide a comprehensive analysis covering: (1) The core question, (2) Multiple perspectives, (3) The strongest evidence on each side, (4) What remains genuinely uncertain, (5) What a clear-thinking person should conclude. Be honest about complexity."
- Stream the response

Mode: ACADEMIC
- Same as Web + AI but with a system prompt oriented toward: "Focus on peer-reviewed research, academic consensus, and scholarly debate. Cite types of sources that exist."

CREATE api/ai/websearch/route.ts:
- POST, body: { query: string }
- Use Gemini API with Google Search grounding:
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", tools: [{ googleSearch: {} }] })
  const result = await model.generateContent(query)
- Stream the response text back
- Also extract grounding metadata (sources) and return them

CREATE api/ai/reason/route.ts:
- POST, body: { query: string }
- Use Anthropic Claude Sonnet
- Use the system prompt defined above
- Stream response

FRICTION PROMPT component (components/vault/FrictionPrompt.tsx):
- Sky blue tinted box (var(--vault-accent-dim), border var(--vault-accent-border))
- Label: DM Mono 9px "✦ YOUR REACTION" var(--vault-accent)
- Textarea: Instrument Serif italic 16px, placeholder "In your own words — what does this mean for your thinking?"
- "Save to Journal" button: creates a new journal entry with the AI query as title and the reaction as content, then navigates to that entry
```

---

## PROMPT 16 — Settings Page

```
Build the Settings page at app/(vault)/settings/page.tsx.

LAYOUT: Two-column — settings nav (200px) | settings panel (flex-1)

SETTINGS NAV:
bg var(--vault-bg-2), border var(--vault-border), br 6px
Nav items: Geist 14px, padding 12px 16px, hover bg var(--vault-bg-3), active bg var(--vault-accent-dim) color var(--vault-accent)
Sections: General | AI & Search | Privacy | Export & Backup

SETTINGS PANEL:
bg var(--vault-bg-2), border var(--vault-border), br 6px

Each section inside the panel:

GENERAL:
- Profile name: text input (editable, saves to profiles table)
- Theme: only Dark available, show as selected/locked

AI & SEARCH:
- Primary reasoning model: select (Claude Sonnet / Claude Haiku)
- Live web search: toggle (on by default)
- Show AI friction prompts: toggle (on by default) — "Show 'what do you think?' prompts after AI responses"
- Flag unverified AI summaries: toggle (on by default)
- 90-day stance review nudges: toggle (on by default)
- Daily reflection prompt: toggle (on by default)

PRIVACY:
- Vault is private: static info (always true, not a toggle)
- Session timeout: select (Never / 1 hour / 8 hours / 24 hours)

EXPORT & BACKUP:
- "Export as JSON" button: fetches all stances, journal_entries, notes, documents metadata from Supabase, serialises to JSON, triggers browser download as vault-export-[date].json
- "Export as Markdown" button: converts each stance to a markdown document, each journal entry to a markdown file, bundles as a zip using JSZip, triggers download
- Last export date: stored in localStorage

Install JSZip: npm install jszip @types/jszip

Toggle component: 40px wide × 22px tall, bg var(--vault-bg-4) off / var(--vault-accent) on, white circle inside, transition 150ms, saves setting to localStorage under 'vault_settings'

Settings are read from and saved to localStorage under key 'vault_settings' as a JSON object.

Wrap all settings reads in a useSettings() hook (lib/hooks/useSettings.ts) that reads from localStorage and provides a setSetting(key, value) function.
```

---

## PROMPT 17 — Polish, Empty States & Loading

```
Add all empty states, loading skeletons, and polish across Vault.

EMPTY STATES:
Create a reusable EmptyState component (components/shared/EmptyState.tsx):
- Props: icon (Lucide component), title (Instrument Serif italic 20px), subtitle (DM Mono 10px uppercase var(--vault-text-3)), action button (optional)
- Centered, padding 60px 20px

Use it in:
- Stances: "No stances match your filter." (Target icon)
- Journal list: "No entries yet. Begin with a thought." (BookOpen icon) + "Write First Entry" button
- Notes list: "Nothing here yet." (FileText icon) + "Create First Note" button
- Documents: "No documents uploaded." (Archive icon) + "Upload Document" button
- Search: "Ask something to begin." (Search icon)
- Dashboard activity feed: "No recent activity." (LayoutDashboard icon)

LOADING SKELETONS:
Create a Skeleton component (components/shared/Skeleton.tsx):
Shimmer animation: linear-gradient 90deg from var(--vault-bg-3) to var(--vault-bg-4) to var(--vault-bg-3), bg-size 200%, animation shimmer 1.5s infinite

Use skeletons instead of spinners everywhere:
- Stance cards while fetching: 6 skeleton cards in the grid, matching card dimensions
- Journal entry list while fetching: 5 skeleton rows
- Document cards while fetching: 6 skeleton cards
- Dashboard stats: 4 skeleton stat cards

TOAST NOTIFICATIONS:
Install: npm install sonner
Add <Toaster> to root layout with theme="dark" and custom styles matching Vault design:
- bg var(--vault-bg-2), border var(--vault-border), color var(--vault-text), DM Mono 12px
- Success: left border 3px solid var(--vault-settled)
- Error: left border 3px solid var(--vault-danger)

Use toast() for:
- Stance saved: "Stance saved"
- Journal entry saved: "Entry saved"
- Document uploaded: "Document processed"
- Export triggered: "Export downloaded"
- Errors: show the error message

GLOBAL KEYBOARD SHORTCUTS:
Add a KeyboardShortcuts component to the root layout:
- Cmd/Ctrl + K → focus search bar (navigate to /search if not there)
- Cmd/Ctrl + N → new entry (context-dependent: on /journal creates journal entry, on /notes creates note)
- Cmd/Ctrl + S → manual save (triggers save in active editor)
- Esc → close any open AI panel

Show a keyboard shortcuts reference accessible via ? key (renders a modal listing all shortcuts).
```

---

## PROMPT 18 — Deployment

```
Prepare Vault for production deployment on Vercel.

1. Create a vercel.json at the root:
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install"
}

2. Update next.config.ts:
- Add image domains for Supabase storage
- Set up proper environment variable handling
- Enable React strict mode

3. Create a README.md with:
- Project overview (2 sentences)
- Local setup instructions: git clone → npm install → copy .env.example to .env.local → fill in values → npm run dev
- Environment variables table with description of each
- How to run the Supabase schema (paste into Supabase SQL editor)
- Tech stack list
- Folder structure overview

4. Add a /health route at app/api/health/route.ts that returns { status: 'ok', timestamp } — useful for uptime monitoring.

5. Create .gitignore additions to ensure .env.local is never committed.

6. Add metadata to app/layout.tsx:
- title: "Vault"
- description: "Your personal intelligence vault"
- Set favicon to a simple text-based SVG of the letter V in sky blue on dark background (inline SVG, no external file needed yet — logo will be provided later)

7. Final check: ensure all API routes have proper error handling and return consistent error shapes: { error: string, code: string }

8. Ensure all Supabase queries use the server client in Server Components and the browser client in Client Components.

After this prompt, the app should be deployable. Instructions:
- Push to GitHub
- Import repo in Vercel
- Add all .env.local variables as Vercel environment variables
- Deploy
```

---

## PROMPT 19 — Logo Integration (Send this when ready)

```
I have a logo for Vault. [Attach your logo file here]

Replace the placeholder "V" favicon and the "VAULT" text in the sidebar with:
1. The logo image in the sidebar (constrained to 32px height, maintaining aspect ratio)
2. The logo as the favicon (generate appropriate sizes)
3. The logo in the login page header area

Keep "VAULT" as text in places where the logo doesn't fit (topbar title, meta tags, document title).

Ensure the logo renders cleanly on the dark background (var(--vault-bg-2)).
```

---

## WEEK 2 PROMPTS (Post-Weekend)

---

## PROMPT W2-01 — Camera & Scan Mode

```
Add camera capture and document scanning to the Documents module.

In the upload zone on app/(vault)/documents/page.tsx, add two new upload method buttons alongside the existing dropzone:

1. "Take Photo" button (Camera icon):
- Opens browser camera using navigator.mediaDevices.getUserMedia({ video: true })
- Shows camera preview in a modal overlay (full screen on mobile, 600px centered on desktop)
- Capture button takes a snapshot of the video frame to a canvas
- Preview the captured image before confirming
- Confirm button: uploads the image through the same upload pipeline as file upload
- Cancel button: closes camera

2. "Scan Document" button (Scan icon):
- Same camera flow but with scan mode overlay
- Overlay shows a rectangular guide frame (1px solid var(--vault-accent), semi-transparent corners)
- After capture, apply basic perspective correction using canvas transforms
- Auto-crop to the document area if detected
- Allow multi-page scanning: after each page, show "Scan another page" or "Finish"
- On finish: combine all pages into a single document record, run OCR across all pages

Camera permission error state: if permission denied, show a message explaining how to grant camera permission in browser settings.

This is mobile-first — the camera button should be prominently placed on the upload page on mobile.
```

---

## PROMPT W2-02 — Export System

```
Build the full export system for Vault.

Wire up the Export buttons in Settings that are currently disabled.

EXPORT AS JSON:
Fetch from Supabase:
- All stances (all fields)
- All journal entries (all fields, include content JSON)
- All notes (all fields, include content JSON)
- All documents (metadata only, not file contents)

Combine into a single JSON structure:
{
  "exported_at": "[ISO date]",
  "vault_version": "1.0",
  "stances": [...],
  "journal_entries": [...],
  "notes": [...],
  "documents": [...]
}

Trigger download of vault-export-[YYYY-MM-DD].json

EXPORT AS MARKDOWN:
Convert each module to markdown:

Stances → one .md file per stance:
# [Topic]
**Status:** [status] | **Category:** [category] | **Last Updated:** [date]

## My Stance
[my_stance]

## Why I Hold This
[why_i_hold_this]

## Strongest Counter-Argument
[strongest_counter]

## My Rebuttal
[my_rebuttal]

## Where I'm Uncertain
[uncertainties]

## How This Affects My Life
[life_impact]

## Sources
[sources]

Journal entries → one .md file per entry with YAML frontmatter:
---
title: [title]
date: [created_at]
tags: [tags]
---
[content as markdown]

Notes → same as journal entries

Bundle all files using JSZip into vault-markdown-[date].zip and trigger download.

After export: save the export timestamp to localStorage and display it in the Settings export section as "Last export: [date]".
```

---

## PROMPT W2-03 — Note Backlinks & Nesting

```
Add note nesting and backlinks to the Notes module.

NESTING:
Update the notes list sidebar to show a tree structure:
- Top-level notes (parent_id = null) are shown normally
- Child notes are indented 16px under their parent
- Parent notes have a ▶ toggle to collapse/expand children
- "New sub-note" appears on hover of any note row (adds a new note with parent_id set)
- Limit nesting to 3 levels deep

BACKLINKS:
Add a [[Note Name]] syntax to the Tiptap editor:
- When user types [[, show an autocomplete dropdown of all note titles
- Selecting a note inserts a link styled with sky blue colour
- On the note detail page, show a "Referenced by" section at the bottom listing all notes that link to this note
- Query: find all notes where content JSONB contains the current note's id

This requires updating the Tiptap editor with a custom extension for [[ syntax.
```

---

## PROMPT W2-04 — PWA Setup

```
Make Vault a Progressive Web App (PWA) so it can be installed on desktop and mobile.

1. Create public/manifest.json:
{
  "name": "Vault",
  "short_name": "Vault",
  "description": "Your personal intelligence vault",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0D0D0F",
  "theme_color": "#0D0D0F",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

2. Add manifest link to app/layout.tsx head

3. Create a service worker at public/sw.js that caches:
- The app shell (layout, sidebar, fonts)
- The last-viewed stances list
- Strategies: cache-first for fonts and static assets, network-first for API calls

4. Register the service worker in a client component that mounts in the root layout.

5. Add an "Install App" banner (dismissible) that shows on mobile browsers when the app is not installed:
- Bottom banner, bg var(--vault-bg-2), border-top var(--vault-border)
- "Install Vault on your home screen" text + Install button
- Uses the beforeinstallprompt event
- Dismissed state saved to localStorage

6. Create 192×192 and 512×512 placeholder icon images programmatically (navy background, "V" letter in sky blue, Instrument Serif font) — these will be replaced when the actual logo is provided.
```

---

## NOTES FOR BUILDING

**Between each prompt:**
- Test what was built before proceeding
- Check the browser console for errors
- Check Supabase dashboard to confirm data is being written correctly
- If a prompt produces an error, describe the error to Antigravity as a follow-up

**If something breaks:**
"The previous implementation has this error: [paste error]. Fix it while keeping all other functionality intact."

**If you want to change a design detail:**
"In the [component name], change [specific element] from [current] to [desired]. Do not change anything else."

**Final advice:**
The Saturday goal is Prompts 01–09 (foundation + stances). The Sunday goal is Prompts 10–18 (all modules + deploy). Everything after that is Week 2 polish.