'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function FrictionPrompt({ query }: { query: string }) {
  const [reaction, setReaction] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const saveToJournal = async () => {
    if (!reaction.trim()) return
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      title: `Reaction to: ${query}`,
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: reaction }] }
        ]
      }
    }).select().single()

    setLoading(false)
    if (data) router.push(`/journal/${data.id}`)
  }

  return (
    <div className="bg-vault-accent-dim border border-vault-accent-border rounded-[8px] p-5 flex flex-col gap-3 my-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="font-mono text-[9px] uppercase tracking-widest text-vault-accent">
        ✦ YOUR REACTION
      </div>
      <textarea
        value={reaction}
        onChange={e => setReaction(e.target.value)}
        placeholder="In your own words — what does this mean for your thinking? Write your reaction before it fades..."
        className="w-full bg-transparent border-none focus:outline-none font-serif italic text-[18px] text-vault-text resize-none min-h-[80px] placeholder:text-vault-text-3"
      />
      <div className="flex justify-end">
        <button
          onClick={saveToJournal}
          disabled={loading || !reaction.trim()}
          className="bg-vault-accent text-[#0D0D0F] font-mono text-[10px] uppercase tracking-widest py-1.5 px-4 rounded-[4px] hover:bg-vault-accent-2 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save to Journal'}
        </button>
      </div>
    </div>
  )
}