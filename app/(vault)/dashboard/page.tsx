import { createClient } from '@/lib/supabase/server'
import { STANCE_SEEDS } from '@/lib/stances/seed'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { SetTopbar } from '@/components/vault/SetTopbar'
import { ExportButton } from '@/components/vault/ExportButton'

const PROMPTS = [
  "Does morality require religion, or can it be derived from reason alone?",
  "What belief do you hold that most people around you would disagree with?",
  "What would you defend even if it cost you something?",
  "Is justice the same as fairness?",
  "What has changed your mind most significantly in the last year?",
  "Where do your values come from — and do they still hold?",
  "What do you believe about human nature?",
  "Is there a difference between what you believe and how you live?",
  "What suffering has built you, and what has damaged you?",
  "What does freedom actually mean to you?",
  "Is loyalty a virtue or a trap?",
  "What would you die for? What would you live for?",
  "Do you believe in objective truth? Why?",
  "What do you owe to people who came before you?",
  "What do you owe to people who will come after you?",
  "When is it right to break a rule?",
  "What does success mean to you right now — and is that what you actually want?",
  "Are you living according to your stated values?",
  "What idea have you held longest without examining?",
  "What would you tell your 15-year-old self?",
  "Is wealth a moral responsibility?",
  "What is the most important thing you are not doing?",
  "What do you believe about death?",
  "What makes a life meaningful?",
  "Is forgiveness always the right choice?",
  "What are you most certain about? What are you most uncertain about?",
  "What has reading taught you that experience hasn't?",
  "Is there a version of you that you are afraid of becoming?",
  "What is the relationship between discipline and freedom?",
  "What do you believe that you cannot yet defend?"
]

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const userName = profile?.name || 'User'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateString = format(new Date(), "EEEE · d MMMM yyyy").toUpperCase()

  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  const prompt = PROMPTS[dayOfYear % PROMPTS.length]

  const [
    { count: settledCount },
    { count: evolvingCount },
    { count: journalCount },
    { count: docsCount },
    { data: filledStances },
    { data: recentStances },
    { data: recentJournals },
    { data: recentDocs },
    { data: recentNotes },
  ] = await Promise.all([
    supabase.from('stances').select('*', { count: 'exact', head: true }).eq('status', 'settled'),
    supabase.from('stances').select('*', { count: 'exact', head: true }).eq('status', 'evolving'),
    supabase.from('journal_entries').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('stances').select('category, status').neq('status', 'empty'),
    supabase.from('stances').select('id, topic, status, last_updated').neq('status', 'empty').order('last_updated', { ascending: false }).limit(10),
    supabase.from('journal_entries').select('id, title, updated_at').order('updated_at', { ascending: false }).limit(10),
    supabase.from('documents').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('notes').select('id, title, updated_at').order('updated_at', { ascending: false }).limit(10),
  ])

  const categoryTotals = STANCE_SEEDS.reduce((acc, stance) => {
    acc[stance.category] = (acc[stance.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categoryFilled = (filledStances || []).reduce((acc, stance) => {
    acc[stance.category] = (acc[stance.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categories = Object.keys(categoryTotals).sort()

  const activities = [
    ...(recentStances || []).map(s => ({ id: s.id, title: `Stance: ${s.topic}`, date: s.last_updated, type: 'stance' as const, status: s.status })),
    ...(recentJournals || []).map(j => ({ id: j.id, title: `Journal: ${j.title}`, date: j.updated_at, type: 'journal' as const })),
    ...(recentDocs || []).map(d => ({ id: d.id, title: `Document: ${d.title}`, date: d.created_at, type: 'document' as const })),
    ...(recentNotes || []).map(n => ({ id: n.id, title: `Note: ${n.title}`, date: n.updated_at, type: 'note' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

  const getDotColor = (item: any) => {
    if (item.type === 'stance') {
      if (item.status === 'settled') return 'bg-vault-settled'
      if (item.status === 'evolving') return 'bg-vault-evolving'
      if (item.status === 'undecided') return 'bg-vault-undecided'
      return 'bg-vault-text-3'
    }
    if (item.type === 'journal') return 'bg-vault-accent'
    if (item.type === 'document') return 'bg-vault-undecided'
    return 'bg-vault-text-3'
  }

  return (
    <div className="flex flex-col gap-12 w-full max-w-5xl mx-auto pb-10">
      <SetTopbar title="Dashboard" />

      {/* 1. GREETING SECTION */}
      <div className="flex flex-col gap-2">
        <h1 className="font-serif italic text-[32px] text-vault-text">
          {greeting}, {userName}.
        </h1>
        <div className="font-mono text-[11px] uppercase tracking-widest text-vault-text-3">
          {dateString}
        </div>
      </div>

      {/* 2. DAILY REFLECTION PROMPT */}
      <div className="bg-vault-bg-2 border border-vault-accent-border rounded-[6px] p-[20px] px-[24px] flex flex-col gap-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-vault-accent">
          Today's Reflection
        </div>
        <div className="font-serif italic text-[20px] text-vault-text leading-snug">
          "{prompt}"
        </div>
        <div className="pt-2">
          <Link 
            href="/journal/new" 
            className="font-sans text-[14px] text-vault-text-2 hover:text-vault-accent transition-colors"
          >
            Write in Journal →
          </Link>
        </div>
      </div>

      {/* 3. STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-vault-bg-2 border border-vault-border rounded-[6px] p-5 flex flex-col gap-1">
          <div className="font-serif text-[36px] text-vault-accent leading-none mb-1">{settledCount || 0}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-vault-text-3">Stances Settled</div>
        </div>
        <div className="bg-vault-bg-2 border border-vault-border rounded-[6px] p-5 flex flex-col gap-1">
          <div className="font-serif text-[36px] text-vault-accent leading-none mb-1">{evolvingCount || 0}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-vault-text-3">Still Evolving</div>
        </div>
        <div className="bg-vault-bg-2 border border-vault-border rounded-[6px] p-5 flex flex-col gap-1">
          <div className="font-serif text-[36px] text-vault-accent leading-none mb-1">{journalCount || 0}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-vault-text-3">Journal Entries</div>
        </div>
        <div className="bg-vault-bg-2 border border-vault-border rounded-[6px] p-5 flex flex-col gap-1">
          <div className="font-serif text-[36px] text-vault-accent leading-none mb-1">{docsCount || 0}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-vault-text-3">Documents</div>
        </div>
      </div>

      {/* 4. TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* Left: Stance Progress */}
        <div className="flex flex-col gap-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-vault-text-3">
            Stance Progress
          </div>
          <div className="flex flex-col gap-4">
            {categories.map(cat => {
              const total = categoryTotals[cat]
              const filled = categoryFilled[cat] || 0
              const percentage = Math.round((filled / total) * 100)

              return (
                <div key={cat} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-mono text-[10px] text-vault-text-2 uppercase">
                    <span>{cat}</span>
                    <span>{filled} / {total}</span>
                  </div>
                  <div className="w-full h-[4px] bg-vault-bg-4 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-vault-accent transition-all duration-500 ease-out" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Recent Activity Feed */}
        <div className="flex flex-col gap-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-vault-text-3">
            Recent Activity
          </div>
          <div className="flex flex-col gap-4">
            {activities.length === 0 ? (
              <div className="text-vault-text-3 text-[14px] font-sans italic">No recent activity.</div>
            ) : (
              activities.map(item => (
                <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 group cursor-pointer">
                  <div className={`mt-1.5 w-[6px] h-[6px] rounded-full ${getDotColor(item)} shrink-0`} />
                  <div className="flex flex-col gap-0.5">
                    <div className="font-sans text-[14px] text-vault-text group-hover:text-vault-accent transition-colors line-clamp-1">
                      {item.title}
                    </div>
                    <div className="font-mono text-[10px] text-vault-text-3 uppercase">
                      {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 5. EXPORT BANNER */}
      <div className="mt-4 bg-vault-bg-2 border border-vault-border rounded-[6px] p-4 px-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-vault-bg-4 flex items-center justify-center shrink-0 border border-vault-border">
            <Download className="w-4 h-4 text-vault-text-2" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="font-sans text-[15px] text-vault-text">Your vault is always yours</div>
            <div className="font-mono text-[10px] text-vault-text-3">Export all data as JSON or Markdown · Last export: Never</div>
          </div>
        </div>
        <ExportButton />
      </div>

    </div>
  )
}