export function StatusBadge({ status }: { status: 'settled' | 'evolving' | 'undecided' | 'empty' }) {
  const configs = {
    settled: { bg: 'bg-vault-settled/[0.15]', color: 'text-vault-settled', text: '✓ Settled' },
    evolving: { bg: 'bg-vault-evolving/[0.15]', color: 'text-vault-evolving', text: '↻ Evolving' },
    undecided: { bg: 'bg-vault-undecided/[0.15]', color: 'text-vault-undecided', text: '? Undecided' },
    empty: { bg: 'bg-vault-bg-4', color: 'text-vault-text-3', text: '○ Not Started' },
  }
  
  const config = configs[status] || configs.empty

  return (
    <div className={`text-[9px] uppercase px-2 py-[2px] rounded-[3px] ${config.bg} ${config.color} tracking-normal`}>
      {config.text}
    </div>
  )
}