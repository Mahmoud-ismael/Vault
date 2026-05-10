'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STANCE_SEEDS } from '@/lib/stances/seed'
import { SetTopbar } from '@/components/vault/SetTopbar'
import { StanceCard } from '@/components/vault/StanceCard'
import { Loader2 } from 'lucide-react'

type Stance = {
  id: string
  topic: string
  category: string
  status: 'settled' | 'evolving' | 'undecided' | 'empty'
  my_stance: string | null
  last_updated: string
}

export default function StancesPage() {
  const [stances, setStances] = useState<Stance[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [filter, setFilter] = useState<'All' | 'Settled' | 'Evolving' | 'Undecided' | 'Not Started'>('All')
  const [search, setSearch] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function loadStances() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('stances').select('*').order('topic', { ascending: true })
      
      if (!data || data.length === 0) {
        setSeeding(true)
        const seedData = STANCE_SEEDS.map(seed => ({
          user_id: user.id,
          topic: seed.topic,
          category: seed.category,
          status: 'empty',
        }))
        
        await supabase.from('stances').insert(seedData)
        
        const { data: newStances } = await supabase.from('stances').select('*').order('topic', { ascending: true })
        setStances(newStances || [])
        setSeeding(false)
      } else {
        setStances(data)
      }
      setLoading(false)
    }
    
    loadStances()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <SetTopbar title="Stances" />
        <Loader2 className="w-6 h-6 animate-spin text-vault-accent" />
        {seeding ? (
          <div className="font-mono text-[11px] uppercase tracking-widest text-vault-text-3">Seeding 100 worldview topics...</div>
        ) : (
          <div className="font-mono text-[11px] uppercase tracking-widest text-vault-text-3">Loading stances...</div>
        )}
      </div>
    )
  }

  const counts = {
    settled: stances.filter(s => s.status === 'settled').length,
    evolving: stances.filter(s => s.status === 'evolving').length,
    undecided: stances.filter(s => s.status === 'undecided').length,
    empty: stances.filter(s => s.status === 'empty').length,
  }

  const filteredStances = stances.filter(s => {
    if (filter === 'Settled' && s.status !== 'settled') return false
    if (filter === 'Evolving' && s.status !== 'evolving') return false
    if (filter === 'Undecided' && s.status !== 'undecided') return false
    if (filter === 'Not Started' && s.status !== 'empty') return false
    
    if (search && !s.topic.toLowerCase().includes(search.toLowerCase())) return false
    
    return true
  })

  // Group by category
  const grouped: Record<string, Stance[]> = {}
  filteredStances.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = []
    grouped[s.category].push(s)
  })

  // Sort categories alphabetically
  const categories = Object.keys(grouped).sort()

  const FilterChip = ({ label }: { label: 'All' | 'Settled' | 'Evolving' | 'Undecided' | 'Not Started' }) => {
    const isActive = filter === label
    
    let activeClass = 'bg-vault-bg-3 border-vault-border-2 text-vault-text'
    if (isActive) {
      if (label === 'Settled') activeClass = 'bg-vault-settled/[0.15] border-vault-settled text-vault-settled'
      else if (label === 'Evolving') activeClass = 'bg-vault-evolving/[0.15] border-vault-evolving text-vault-evolving'
      else if (label === 'Undecided') activeClass = 'bg-vault-undecided/[0.15] border-vault-undecided text-vault-undecided'
      else if (label === 'Not Started') activeClass = 'bg-vault-bg-4 border-vault-text-3 text-vault-text-3'
      else activeClass = 'bg-vault-accent/[0.15] border-vault-accent text-vault-accent'
    }

    return (
      <button 
        onClick={() => setFilter(label)}
        className={`font-mono text-[10px] uppercase px-4 py-1.5 rounded-[20px] border transition-colors duration-150 tracking-wider ${
          isActive ? activeClass : 'border-vault-border-2 text-vault-text-3 hover:text-vault-text hover:border-vault-border-3 hover:bg-vault-bg-3'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-16">
      <SetTopbar title="Stances" />

      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] text-vault-text leading-none">
          My Stances
        </h1>
        <div className="font-mono text-[10px] tracking-[0.05em] text-vault-text-3">
          {counts.settled} settled · {counts.evolving} evolving · {counts.undecided} undecided · {counts.empty} not started
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-y border-vault-border mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip label="All" />
          <FilterChip label="Settled" />
          <FilterChip label="Evolving" />
          <FilterChip label="Undecided" />
          <FilterChip label="Not Started" />
        </div>
        
        <input 
          type="text"
          placeholder="Filter topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[240px] bg-vault-bg-4 border border-vault-border rounded-[4px] px-3 py-1.5 font-sans text-[13px] text-vault-text placeholder-vault-text-3 focus:outline-none focus:border-vault-accent transition-all duration-150"
        />
      </div>

      {/* CATEGORY SECTIONS */}
      <div className="flex flex-col gap-12 mt-2">
        {categories.length === 0 ? (
          <div className="text-vault-text-3 font-sans text-[14px] italic text-center py-10">
            No topics match your filters.
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat} className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-vault-border pb-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-vault-text-3">
                  {cat}
                </div>
                <div className="font-mono text-[9px] bg-vault-bg-4 text-vault-text-3 px-2 py-0.5 rounded-full">
                  {grouped[cat].length}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {grouped[cat].map(stance => (
                  <StanceCard
                    key={stance.id}
                    id={stance.id}
                    topic={stance.topic}
                    status={stance.status}
                    myStance={stance.my_stance}
                    lastUpdated={stance.last_updated}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}