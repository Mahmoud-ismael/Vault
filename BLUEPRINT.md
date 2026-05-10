# VAULT — Product Blueprint
**Version:** 1.0  
**Owner:** M. Ismail- Hisako Technologies
**Started:** May 2026  
**Status:** Active Build

---

## 1. What Is Vault?

Vault is a personal intelligence operating system. It is a single private webapp where one person — the owner — stores, writes, organises, researches, and thinks through everything that matters to them: their opinions, notes, journals, documents, and research. It is not a productivity tool. It is not a note-taking app. It is a thinking infrastructure — a place where your knowledge, beliefs, and writing compound over years.

The core promise: **everything you've ever thought, read, written, or believed, in one place, searchable, connected, and yours forever.**

---

## 2. Who Is It For?

Vault is a single-user personal tool. There is one account. It is not multi-tenant, not collaborative, not social. It is built for a person who:

- Reads seriously and wants to capture what they learn
- Holds considered opinions on hard topics and wants to document them
- Keeps a private journal
- Collects and annotates documents — papers, articles, books, scans
- Wants AI to assist their thinking without replacing it
- Wants to own their data permanently

---

## 3. Core Modules

### 3.1 STANCES
The philosophical core of Vault. 100 pre-seeded topics (expandable) covering gender, religion, ethics, race, politics, economics, technology, environment, education, and personal philosophy. Each stance follows an 8-section structure:

1. **My Stance** — one to two sentences, plain and direct
2. **Why I Hold This** — core reasoning, personal and logical
3. **Strongest Argument Against Me** — steelmanned opposition
4. **My Rebuttal** — why you still hold it
5. **Where I'm Uncertain** — grey areas, what would change your mind
6. **How It Affects How I Live** — behavioral impact
7. **Sources & Influences** — books, papers, experiences
8. **Last Updated** — date stamp

**Status system:** Settled ✓ / Evolving ↻ / Undecided ? / Not Started ○  
**90-day review nudge:** Stances not updated in 90+ days are surfaced  
**Category worldview:** Each category has a 2–3 sentence philosophical summary  
**AI features:** Steelman generator, contradiction detector, stance challenger, source suggester

---

### 3.2 JOURNAL
Long-form private writing. Dated entries. The thinking happens here.

**Editor features:**
- Full rich text (Tiptap): bold, italic, underline, strikethrough, H1–H3, blockquotes, bullet lists, numbered lists, checklists, horizontal rules
- Inline citations — highlight text, cite a source from your vault
- Word count, reading time, autosave every 30 seconds
- Entry tags — topic, emotion, linked stance
- Calendar view — visual record of writing days
- Search across all entries

**AI features (inline, not chatbot):**
- Summarise this entry
- Find contradictions with existing stances
- Expand this thought (selected text)
- Link to stance (AI suggests relevant stances)
- Writing quality feedback (clarity, logic score)

---

### 3.3 NOTES
Block-based structured knowledge. Notion-style but stripped to essentials.

**Structure:**
- Infinite nested pages
- Block types: Text, H1/H2/H3, Bullet list, Numbered list, Toggle/collapsible, Callout, Divider, Table, Code block, Quote, Image
- `/` command palette for block insertion
- Drag-and-drop block reorder
- Backlinks to other notes, stances, journal entries, documents
- Tags and categories
- Pinned notes in sidebar
- Templates: Research Summary, Argument Map, Book Notes, Meeting Notes

**AI features:**
- Generate outline from topic
- Summarise note
- Fill from document (extract content from uploaded doc into note)
- Ask about this note
- Suggest related notes from vault

---

### 3.4 DOCUMENTS
Upload, scan, photograph. All your physical and digital paper, searchable and annotatable.

**Upload methods:**
- Drag and drop (PDF, DOCX, TXT, PNG, JPG, WEBP)
- Camera capture (mobile browser, direct photo)
- Scan mode (multi-page, auto-crop, perspective correction)
- URL import (paste URL → saves article as document)

**Document features:**
- Full text extraction (pdf-parse for PDFs, Tesseract.js OCR for images)
- Full-text indexed and searchable
- Highlight and annotate passages with margin notes
- Tag by topic, link to stances or notes
- Reading mode (clean, distraction-free)
- Version history on re-upload

**AI features:**
- Summarise document (auto-run on upload, dismissible)
- Extract key arguments
- Fact-check against existing stances
- Generate notes from document
- Ask the document (question-answering against document content only)
- Translate document

---

### 3.5 SEARCH
Unified AI-powered search across the entire vault.

**Modes:**
- **Vault Search** — full-text across all modules
- **Web + AI** — Gemini Flash with Google Search grounding for live research
- **Deep Reason** — Claude Sonnet for synthesised analysis
- **Academic** — targeted at papers and research sources

**Features:**
- Filters: module, date range, tag, status
- Related vault items surfaced on every external result
- Save any result to Research / Notes / Documents with one click
- Friction prompt after every AI response: *"In your own words — what does this mean for your thinking?"*
- Source display: every AI response shows sources used

---

### 3.6 DASHBOARD
Command centre. Seen first on every session.

**Components:**
- Greeting with time of day
- Daily reflection prompt (rotates from a curated set)
- Stats: stances settled, journal entries, notes, documents
- Stance progress by category (progress bars)
- Recent activity feed
- 90-day review nudge (stances due for revisit)
- Export reminder (last export date)

---

## 4. AI Philosophy

AI in Vault is **built-in, not bolted on.** There is no AI chatbot. There is no chat interface. AI appears as contextual actions inside each module — buttons, inline suggestions, floating toolbars on selected text.

**Rules:**
1. AI never overwrites your content. It always suggests; you accept or dismiss.
2. AI outputs are visually distinct — tagged `AI` with a sky-blue border.
3. Every AI output has a friction prompt: *"What do you actually think?"*
4. AI-sourced research notes are flagged `AI Summary` and warned if no primary source is attached.
5. AI does not have memory across sessions beyond what's in the vault.

**Models:**
- **Claude Sonnet** — reasoning, contradiction detection, stance analysis, writing feedback
- **Gemini Flash** — live web search, document translation, URL import extraction

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom design tokens |
| UI Components | shadcn/ui (customised to Vault design system) |
| Auth | Supabase Auth (magic link) |
| Database | Supabase Postgres |
| File Storage | Supabase Storage |
| Rich Text Editor | Tiptap v2 |
| OCR | Tesseract.js (client-side) |
| PDF Parsing | pdf-parse |
| AI — Reasoning | Anthropic Claude API (claude-sonnet-4-5) |
| AI — Search | Google Gemini API (gemini-1.5-flash) |
| Hosting | Vercel |
| Domain | vault.hisako.tech (or similar) |

---

## 6. Database Schema (Supabase)

```sql
-- Core tables

profiles
  id uuid references auth.users
  name text
  created_at timestamptz

stances
  id uuid
  user_id uuid
  topic text
  category text
  status text -- settled | evolving | undecided | empty
  my_stance text
  why_i_hold_this text
  strongest_counter text
  my_rebuttal text
  uncertainties text
  life_impact text
  last_updated timestamptz
  created_at timestamptz

journal_entries
  id uuid
  user_id uuid
  title text
  content jsonb -- Tiptap JSON
  tags text[]
  word_count int
  linked_stances uuid[]
  created_at timestamptz
  updated_at timestamptz

notes
  id uuid
  user_id uuid
  title text
  content jsonb -- Tiptap JSON
  parent_id uuid references notes(id) -- for nesting
  tags text[]
  pinned boolean
  linked_stances uuid[]
  backlinks uuid[]
  created_at timestamptz
  updated_at timestamptz

documents
  id uuid
  user_id uuid
  title text
  file_path text -- Supabase Storage path
  file_type text
  extracted_text text
  summary text -- AI generated
  annotations jsonb
  tags text[]
  linked_stances uuid[]
  source_url text
  created_at timestamptz

sources
  id uuid
  user_id uuid
  title text
  author text
  type text -- book | paper | article | ai_summary | experience
  url text
  verified boolean
  stance_id uuid references stances(id)
  document_id uuid references documents(id)
  created_at timestamptz

search_history
  id uuid
  user_id uuid
  query text
  mode text
  created_at timestamptz
```

---

## 7. File & Folder Structure

```
vault/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (vault)/
│   │   ├── layout.tsx          ← sidebar + topbar shell
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── stances/
│   │   │   ├── page.tsx        ← browse all stances
│   │   │   └── [id]/
│   │   │       └── page.tsx    ← single stance detail + editor
│   │   ├── journal/
│   │   │   ├── page.tsx        ← entry list + calendar
│   │   │   └── [id]/
│   │   │       └── page.tsx    ← entry editor
│   │   ├── notes/
│   │   │   ├── page.tsx        ← notes tree
│   │   │   └── [id]/
│   │   │       └── page.tsx    ← note editor
│   │   ├── documents/
│   │   │   ├── page.tsx        ← document library
│   │   │   └── [id]/
│   │   │       └── page.tsx    ← document viewer + annotations
│   │   └── search/
│   │       └── page.tsx
│   ├── api/
│   │   ├── ai/
│   │   │   ├── summarise/route.ts
│   │   │   ├── steelman/route.ts
│   │   │   ├── contradict/route.ts
│   │   │   ├── expand/route.ts
│   │   │   ├── outline/route.ts
│   │   │   └── websearch/route.ts
│   │   └── documents/
│   │       ├── upload/route.ts
│   │       └── ocr/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                     ← shadcn base components
│   ├── vault/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── StanceCard.tsx
│   │   ├── StanceEditor.tsx
│   │   ├── JournalEditor.tsx
│   │   ├── NoteEditor.tsx
│   │   ├── DocumentCard.tsx
│   │   ├── DocumentViewer.tsx
│   │   ├── AIPanel.tsx
│   │   ├── SearchBar.tsx
│   │   └── FrictionPrompt.tsx
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── TagInput.tsx
│       └── ExportButton.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── ai/
│   │   ├── claude.ts
│   │   └── gemini.ts
│   ├── documents/
│   │   ├── ocr.ts
│   │   └── pdf.ts
│   └── stances/
│       └── seed.ts             ← the 100 topics seed data
├── styles/
│   └── globals.css
├── BLUEPRINT.md
├── DESIGN.md
└── PROMPTS.md
```

---

## 8. Weekend Build Sequence

### Saturday — Foundation
- [ ] Repo setup, Next.js 15 + TypeScript + Tailwind
- [ ] Supabase project, tables, RLS policies
- [ ] Auth (magic link login page)
- [ ] Global layout: sidebar, topbar
- [ ] Design system: CSS variables, typography, components
- [ ] Dashboard page
- [ ] Stances module: browse + detail + editor

### Sunday — Modules + AI
- [ ] Journal module: list + rich text editor
- [ ] Notes module: block editor + nesting
- [ ] Documents module: upload + PDF extraction + basic AI summary
- [ ] Search page: vault search + Claude API
- [ ] AI features wired throughout
- [ ] Deploy to Vercel

### Week 2 (Post-Weekend)
- [ ] Camera/scan mode in Documents
- [ ] Backlinks between notes
- [ ] Calendar view for Journal
- [ ] Full OCR pipeline (Tesseract.js)
- [ ] URL import for Documents
- [ ] Export (JSON + Markdown + PDF)
- [ ] 90-day review automation
- [ ] Logo integration
- [ ] PWA manifest

---

## 9. Non-Negotiables

1. **Data ownership** — Export all as JSON or Markdown at any time. Always.
2. **AI never overwrites** — Every AI action is a suggestion. Accept or dismiss.
3. **No chatbot** — AI is contextual actions, not a conversation.
4. **Single user** — No multi-tenancy, no collaboration, no social features.
5. **Private by default** — Nothing is shareable unless you explicitly generate a link.
6. **Runs forever** — Supabase free tier + Vercel free tier = zero ongoing cost for personal use.
