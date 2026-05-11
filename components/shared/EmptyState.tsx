import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-[60px] px-[20px] w-full">
      <Icon className="w-8 h-8 text-vault-text-4 mb-4" />
      <h3 className="font-serif italic text-[20px] text-vault-text mb-2">{title}</h3>
      {subtitle && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3 mb-6">
          {subtitle}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
