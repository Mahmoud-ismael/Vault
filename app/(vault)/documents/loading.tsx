import { Skeleton } from '@/components/shared/Skeleton'
import { SetTopbar } from '@/components/vault/SetTopbar'

export default function DocumentsLoading() {
  return (
    <div className="w-full flex flex-col gap-8 pb-16 relative">
      <SetTopbar title="Documents" />
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mt-4">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[160px] w-full" />)}
      </div>
    </div>
  )
}
