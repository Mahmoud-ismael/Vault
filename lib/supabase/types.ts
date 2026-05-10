export interface Profile {
  id: string
  name: string
  created_at: string
}

export interface Stance {
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

export interface JournalEntry {
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

export interface Note {
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

export interface Document {
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
