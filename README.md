# Vault

Vault is a personal intelligence operating system. It is a single, private space to store, write, organize, research, and think through everything that matters to you.

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vault
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in the environment variables in `.env.local` (see table below).
5. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of your Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anonymous key for your Supabase project. |
| `ANTHROPIC_API_KEY` | API key for Anthropic (Claude 3.5 Sonnet) used for reasoning and summarization. |
| `GEMINI_API_KEY` | API key for Google Gemini used for web search synthesis. |

## Supabase Schema Setup

To set up the database, run the following schema in your Supabase SQL editor:

```sql
-- Find the schema at supabase/schema.sql in the repository.
-- Copy the entire content and execute it in the Supabase dashboard's SQL Editor.
```

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL)
- **AI Integration**: Anthropic SDK (Claude 3.5), Google Generative AI SDK (Gemini)
- **Document Processing**: pdf-parse, tesseract.js
- **Editor**: Tiptap

## Folder Structure Overview

- `/app`: Next.js App Router containing pages and API routes.
  - `/(auth)`: Authentication routes (login).
  - `/(vault)`: Main application modules (Dashboard, Journal, Notes, Documents, Stances, Search, Settings).
  - `/api`: API endpoints for AI and document processing.
- `/components`: Reusable UI components.
  - `/shared`: Common UI elements (Empty states, skeletons, shortcuts).
  - `/vault`: Vault-specific UI components (Sidebar, Topbar, Editors).
- `/lib`: Utility functions and clients.
  - `/supabase`: Supabase client and middleware.
  - `/stances`: Seed data for the stances module.
- `/styles`: Global CSS and Tailwind configurations.
- `/supabase`: Database schema definitions.
