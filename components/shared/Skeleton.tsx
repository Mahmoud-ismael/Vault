export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`rounded-[4px] ${className}`}
      style={{
        background: 'linear-gradient(90deg, var(--vault-bg-3) 25%, var(--vault-bg-4) 50%, var(--vault-bg-3) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear'
      }}
    />
  )
}
