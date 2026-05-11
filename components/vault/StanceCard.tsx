import Link from 'next/link'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { format } from 'date-fns'

interface StanceCardProps {
  id: string
  topic: string
  status: 'settled' | 'evolving' | 'undecided' | 'empty'
  myStance: string | null
  lastUpdated: string
}

export function StanceCard({ id, topic, status, myStance, lastUpdated }: StanceCardProps) {
  const getBorderColor = () => {
    switch (status) {
      case 'settled': return 'border-vault-settled'
      case 'evolving': return 'border-vault-evolving'
      case 'undecided': return 'border-vault-undecided'
      case 'empty': return 'border-vault-border-2'
      default: return 'border-vault-border-2'
    }
  }

  const previewText = myStance 
    ? (myStance.length > 60 ? myStance.substring(0, 60) + '...' : myStance) 
    : 'No stance written yet'

  return (
    <Link 
      href={`/stances/${id}`}
      className="flex flex-col gap-3 bg-vault-bg-2 border border-vault-border rounded-[6px] px-[18px] py-[16px] transition-all duration-150 hover:border-vault-border-2 hover:bg-vault-bg-3 hover:-translate-y-[1px] relative overflow-hidden group"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${getBorderColor()}`} />
      
      <div className="text-[15px] text-vault-text line-clamp-2 leading-snug group-hover:text-vault-accent transition-colors">
        {topic}
      </div>
      
      <div className="text-[10px] text-vault-text-3 line-clamp-2 min-h-[30px] leading-relaxed">
        {previewText}
      </div>
      
      <div className="flex items-center justify-between mt-1">
        <StatusBadge status={status} />
        <div className="text-[9px] text-vault-text-3 uppercase tracking-normal">
          {format(new Date(lastUpdated), 'dd MMM yyyy')}
        </div>
      </div>
    </Link>
  )
}