import { format } from 'date-fns'

export function DocumentCard({ doc }: { doc: any }) {
  const getBadgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'image': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'txt': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'article': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      default: return 'bg-vault-bg-4 text-vault-text-3 border-vault-border'
    }
  }

  return (
    <div className="bg-vault-bg-2 border border-vault-border rounded-[6px] p-[18px] px-[20px] cursor-pointer hover:border-vault-border-2 hover:bg-vault-bg-3 transition-colors duration-150 flex flex-col gap-3 h-[160px]">
      <div className="flex items-center justify-between">
        <div className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[3px] border ${getBadgeStyle(doc.file_type)}`}>
          {doc.file_type}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-wider text-vault-text-3">
          {format(new Date(doc.created_at), 'MMM d, yyyy')}
        </div>
      </div>
      
      <h3 className="font-sans font-medium text-[15px] text-vault-text line-clamp-2 leading-snug">
        {doc.title}
      </h3>
      
      <div className="font-sans text-[13px] text-vault-text-2 line-clamp-2 leading-relaxed flex-1">
        {doc.summary || "Processing..."}
      </div>
      
      {doc.tags && doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {doc.tags.map((tag: string, i: number) => (
            <span key={i} className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] bg-vault-bg-4 text-vault-text-3">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}