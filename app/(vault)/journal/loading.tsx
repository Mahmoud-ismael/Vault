import { Skeleton } from '@/components/shared/Skeleton'
import { SetTopbar } from '@/components/vault/SetTopbar'

export default function JournalLoading() {
  return (
    <div className="flex h-[calc(100vh-52px)] -m-8 lg:-m-10">
      <SetTopbar title="Journal" />
      <div className="w-[260px] flex-shrink-0 flex flex-col border-r border-vault-border bg-vault-bg-2 p-4 gap-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full mt-4" />
        <div className="flex flex-col gap-2 mt-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[80px] w-full" />)}
        </div>
      </div>
      <div className="flex-1 bg-vault-bg p-10 lg:p-16 flex flex-col gap-6 w-full mx-auto max-w-4xl">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-3/4 mt-4" />
        <div className="flex flex-col gap-4 mt-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-4 w-full" />)}
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  )
}
